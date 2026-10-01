/* eslint-disable class-methods-use-this */

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailHelper {
    constructor() {
        this.transporterCache = new Map();
    }

    _toArray(value) {
        if (Array.isArray(value)) return value.filter(Boolean);
        if (!value) return [];
        return [value];
    }

    _cleanSender(value = '') {
        const match = String(value).match(/<([^>]+)>/);
        return match ? match[1].trim() : String(value).trim();
    }

    _fromAddress(from, settings = {}) {
        const sender = this._cleanSender(from || settings.sender_email || settings.sending_email || settings.smtp_user);
        const name = settings.from_name || settings.config_name || '';
        return name && sender ? `"${String(name).replace(/"/g, '\\"')}" <${sender}>` : sender;
    }

    _smtpConfig(settings = {}) {
        const host = settings.smtp_host || process.env.SMTP_HOST;
        const port = Number(settings.smtp_port || process.env.SMTP_PORT || 587);
        const encryption = String(settings.smtp_encryption || process.env.SMTP_ENCRYPTION || 'TLS').toUpperCase();
        const user = settings.smtp_user || settings.sender_email || settings.sending_email || process.env.SMTP_USER;
        const pass = settings.smtp_password || process.env.SMTP_PASSWORD;

        return {
            host,
            port,
            secure: encryption === 'SSL' || port === 465,
            requireTLS: encryption === 'TLS',
            auth: user || pass ? { user, pass } : undefined,
        };
    }

    _errorMessage(err) {
        if (!err) return 'Unknown SMTP error';
        return [
            err.message,
            err.code ? `code=${err.code}` : '',
            err.command ? `command=${err.command}` : '',
            err.response ? `response=${err.response}` : '',
            err.responseCode ? `responseCode=${err.responseCode}` : '',
        ].filter(Boolean).join(' | ');
    }

    _safeSmtpSummary(config = {}) {
        return {
            host: config.host || '',
            port: config.port || '',
            secure: Boolean(config.secure),
            requireTLS: Boolean(config.requireTLS),
            authUser: config.auth?.user || '',
            hasPassword: Boolean(config.auth?.pass),
        };
    }

    _smtpCacheKey(config = {}) {
        return JSON.stringify({
            host: config.host || '',
            port: config.port || '',
            secure: Boolean(config.secure),
            requireTLS: Boolean(config.requireTLS),
            user: config.auth?.user || '',
        });
    }

    _getTransporter(config = {}) {
        const key = this._smtpCacheKey(config);
        if (!this.transporterCache.has(key)) {
            this.transporterCache.set(key, nodemailer.createTransport({
                ...config,
                pool: true,
                maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 3),
                maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 100),
            }));
        }

        return this.transporterCache.get(key);
    }

    _decodeHtmlEntities(value = '') {
        return String(value || '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
            .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
    }

    _cleanSubject(value = '') {
        return this._decodeHtmlEntities(String(value || '').replace(/<[^>]*>/g, ' '))
            .replace(/\s+/g, ' ')
            .trim();
    }

    async sendEmailResult(from, to, subject, body, auth = null, attachment = false, options = {}) {
        try {
            const settings = auth || {};
            const smtpConfig = this._smtpConfig(settings);
            const fromAddress = this._fromAddress(from, settings);
            const toList = this._toArray(to);

            if (!smtpConfig.host || !fromAddress || !toList.length) {
                const message = 'SMTP email configuration is incomplete';
                logger.error(message, {
                    smtp: this._safeSmtpSummary(smtpConfig),
                    from: fromAddress,
                    toCount: toList.length,
                });
                return { success: false, error: message };
            }

            if (smtpConfig.auth && (!smtpConfig.auth.user || !smtpConfig.auth.pass)) {
                const message = 'SMTP authentication is incomplete';
                logger.error(message, {
                    smtp: this._safeSmtpSummary(smtpConfig),
                    from: fromAddress,
                    toCount: toList.length,
                });
                return { success: false, error: message };
            }

            const transporter = this._getTransporter(smtpConfig);
            const mailOptions = {
                from: fromAddress,
                to: toList,
                cc: this._toArray(options.cc),
                bcc: this._toArray(options.bcc),
                replyTo: options.replyTo || settings.reply_to_email || settings.reply_email || undefined,
                subject: this._cleanSubject(subject),
                html: body || '',
            };

            if (attachment) {
                mailOptions.attachments = Array.isArray(attachment) ? attachment : [attachment];
            }

            const info = await transporter.sendMail(mailOptions);
            const success = Boolean(info && (info.accepted?.length || info.messageId));
            if (!success) {
                logger.error('SMTP provider did not accept reminder email', {
                    smtp: this._safeSmtpSummary(smtpConfig),
                    from: fromAddress,
                    to: toList,
                    cc: mailOptions.cc,
                    bcc: mailOptions.bcc,
                    rejected: info?.rejected || [],
                    response: info?.response || '',
                });
            }

            return {
                success,
                messageId: info?.messageId || '',
                accepted: info?.accepted || [],
                rejected: info?.rejected || [],
                response: info?.response || '',
                error: success ? '' : 'SMTP provider did not accept email',
            };
        } catch (err) {
            const message = this._errorMessage(err);
            logger.error('SMTP email send failed:', {
                error: message,
                stack: err?.stack,
            });
            return { success: false, error: message };
        }
    }

    async sendEmail(from, to, subject, body, auth = null, attachment = false, options = {}) {
        const result = await this.sendEmailResult(from, to, subject, body, auth, attachment, options);
        return Boolean(result.success);
    }

    async sendEmailWithAttachment(from, to, subject, text, body, attachment, auth = null) {
        return this.sendEmail(from, to, subject, body || text, auth, attachment);
    }
}

module.exports = EmailHelper;
