/**
 * recaptcha.js
 * -----------
 * Reusable reCAPTCHA v3 helper.
 *
 * Usage:
 *   import { loadRecaptcha, executeRecaptcha } from '../../helpers/recaptcha';
 *
 *   // In a useEffect on mount:
 *   useEffect(() => { loadRecaptcha(); }, []);
 *
 *   // Before form submit:
 *   const token = await executeRecaptcha('register_charge_submit');
 */

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

/**
 * Injects the reCAPTCHA v3 script into <head> once.
 * Safe to call multiple times — skips if already loaded.
 */
export const loadRecaptcha = () => {
  if (!RECAPTCHA_SITE_KEY) {
    console.warn('[reCAPTCHA] REACT_APP_RECAPTCHA_SITE_KEY is not set.');
    return;
  }
  if (document.getElementById('recaptcha-script')) return;

  const script   = document.createElement('script');
  script.id      = 'recaptcha-script';
  script.src     = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  script.async   = true;
  script.defer   = true;
  document.head.appendChild(script);
};

/**
 * Executes reCAPTCHA v3 and returns a token string.
 *
 * @param {string} action - A descriptive action name shown in the reCAPTCHA console
 *                          (e.g. 'login', 'register_charge_submit').
 * @returns {Promise<string>} Resolved token to send to your backend for verification.
 *
 * @throws Will reject if the site key is missing or grecaptcha is unavailable.
 *
 * @example
 *   try {
 *     const token = await executeRecaptcha('charge_submit');
 *     // include token in your API payload as recaptcha_token
 *   } catch (err) {
 *     toast.error('reCAPTCHA failed. Please refresh and try again.');
 *   }
 */
export const executeRecaptcha = (action = 'submit') => {
  if (!RECAPTCHA_SITE_KEY) {
    return Promise.reject(new Error('[reCAPTCHA] Site key is not configured.'));
  }
  if (!window.grecaptcha) {
    return Promise.reject(new Error('[reCAPTCHA] Script not loaded yet. Call loadRecaptcha() on mount.'));
  }

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then(resolve)
        .catch(reject);
    });
  });
};