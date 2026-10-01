'use strict';

/**
 * recaptchaMiddleware.js
 *
 * Express middleware that verifies a Google reCAPTCHA v3 token.
 *
 * Usage in routes:
 *   const verifyRecaptcha = require('./recaptchaMiddleware');
 *   router.post('/', verifyRecaptcha('register_charge_submit'), upload.array('files[]'), async (req, res) => { ... });
 *
 * Environment variables required:
 *   RECAPTCHA_SECRET_KEY   — your Google reCAPTCHA v3 secret key
 *   RECAPTCHA_MIN_SCORE    — minimum acceptable score (default: 0.5)
 *   WHITELIST_IPS          — comma-separated IPs to bypass check (default: 127.0.0.1,::1)
 */

const https          = require('https');
const responseHandler = require('../helper/responseHandler'); // adjust path
const httpStatus      = require('http-status');

const SECRET_KEY  = process.env.RECAPTCHA_SECRET_KEY  || '';
const MIN_SCORE   = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');
// const WHITELIST   = (process.env.WHITELIST_IPS || 'localhost')
//                       .split(',')
//                       .map(ip => ip.trim())
//                       .filter(Boolean);

/**
 * Calls Google's siteverify endpoint and returns the parsed response.
 * Uses the built-in https module — no axios dependency needed.
 */
const verifyCaptchaToken = (token, remoteIp) =>
  new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      secret:   SECRET_KEY,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    }).toString();

    const options = {
      hostname: 'www.google.com',
      path:     '/recaptcha/api/siteverify',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('Failed to parse reCAPTCHA response')); }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('reCAPTCHA verification timed out'));
    });

    req.write(postData);
    req.end();
  });

/**
 * Factory function — returns Express middleware that:
 *  1. Bypasses check for whitelisted IPs (localhost / dev)
 *  2. Extracts token from body.recaptcha_token
 *  3. Verifies with Google
 *  4. Checks action name matches expected (optional but recommended)
 *  5. Checks score >= MIN_SCORE
 *
 * @param {string} expectedAction  — must match the action passed to grecaptcha.execute()
 */
const verifyRecaptcha = (expectedAction = '') => async (req, res, next) => {
  try {
    const clientIp = req.ip || req.connection?.remoteAddress || '';

    // ── Bypass for whitelisted IPs (localhost / staging) ──────────────────
    // if (WHITELIST.some(ip => clientIp.includes(ip))) {
    //   return next();
    // }

    const token = req.body?.recaptcha_token || '';
    if (!token) {
      return res.status(httpStatus.BAD_REQUEST).json(
        responseHandler.returnError(httpStatus.BAD_REQUEST, 'reCAPTCHA token is missing')
      );
    }

    if (!SECRET_KEY) {
      // Config error — fail open in dev, fail closed in production
      if (process.env.NODE_ENV === 'production') {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'reCAPTCHA is not configured')
        );
      }
      console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY is not set — skipping verification');
      return next();
    }

    const result = await verifyCaptchaToken(token, clientIp);

    // ── Verification failed ────────────────────────────────────────────────
    if (!result.success) {
      console.warn('[reCAPTCHA] Verification failed:', result['error-codes']);
      return res.status(httpStatus.FORBIDDEN).json(
        responseHandler.returnError(httpStatus.FORBIDDEN, 'reCAPTCHA verification failed')
      );
    }

    // ── Action mismatch ────────────────────────────────────────────────────
    if (expectedAction && result.action !== expectedAction) {
      console.warn(`[reCAPTCHA] Action mismatch: expected="${expectedAction}" got="${result.action}"`);
      return res.status(httpStatus.FORBIDDEN).json(
        responseHandler.returnError(httpStatus.FORBIDDEN, 'reCAPTCHA action mismatch')
      );
    }

    // ── Score too low (likely bot) ─────────────────────────────────────────
    if (result.score < MIN_SCORE) {
      console.warn(`[reCAPTCHA] Score too low: ${result.score} < ${MIN_SCORE}`);
      return res.status(httpStatus.FORBIDDEN).json(
        responseHandler.returnError(httpStatus.FORBIDDEN, 'reCAPTCHA score too low — request blocked')
      );
    }

    // ── All checks passed — attach score to req for logging if needed ──────
    req.recaptchaScore  = result.score;
    req.recaptchaAction = result.action;

    return next();
  } catch (err) {
    console.error('[reCAPTCHA] Unexpected error:', err.message);
    // Fail open on network errors so a Google outage doesn't block users
    return next();
  }
};

module.exports = verifyRecaptcha;