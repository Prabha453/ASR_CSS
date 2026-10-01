const httpStatus = require('http-status');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { extractRelativePath, getUploadBase } = require('../../helper/documentHelper');
const { getOfficialRoleGroupsByEntityIds } = require('../../helper/officialRoleHelper');
const { decrypt } = require('../../utils/crypto');
const { renderReminderTemplate } = require('../../helper/eventHelper');

const CompanyEventDao = require('../../dao/company/CompanyEventDao');
const CompanyEventReminderLogDao = require('../../dao/company/CompanyEventReminderLogDao');
const ReminderDao = require('../../dao/masterSettings/ReminderDao');
const DocumentStoreDao = require('../../dao/DocumentStoreDao');
const EmailConfigurationDao = require('../../dao/companyProfile/EmailConfigurationDao');
const EmailHelper = require('../../helper/EmailHelper');
const { OPEN_EVENT_STATUSES } = require('../../config/companyEventStatus');

const REMINDER_MODULE_NAME = 'reminder';
const REMINDER_ENTITY_TYPE = 'REMINDER';

// Helper functions (copied from original service)
const dateOrNull = (value) => {
    if (!value) return null;
    const clean = String(value).trim().split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
        const [day, month, year] = clean.split('/');
        return `${year}-${month}-${day}`;
    }
    return value;
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const addDays = (value, days) => {
    const clean = dateOrNull(value);
    if (!clean) return null;
    const date = new Date(clean);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
    const clean = dateOrNull(value);
    if (!clean) return '';
    const [year, month, day] = clean.split('-');
    return `${day}/${month}/${year}`;
};

const stripHtml = value => String(value || '').replace(/<[^>]*>/g, '').trim();

const decodeHtmlEntities = value =>
    String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

const stripSubjectHtml = value => decodeHtmlEntities(String(value || '').replace(/<[^>]*>/g, '')).trim();

const jsonPayload = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return value;
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) return parsed;
        } catch {
            return fallback;
        }
    }
    return fallback;
};

const flattenPartyPayload = (value) => {
    const payload = jsonPayload(value, []);
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
        return [
            ...(Array.isArray(payload.officials) ? payload.officials : []),
            ...(Array.isArray(payload.users) ? payload.users : []),
            ...(Array.isArray(payload.custom) ? payload.custom : []),
        ];
    }
    return [];
};

const maybeDecryptContactValue = (value) => {
    const clean = String(value || '').trim();
    if (!clean) return '';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return clean;
    if (/^[a-f0-9]+$/i.test(clean) && clean.length % 2 === 0) {
        const decrypted = decrypt(clean);
        if (decrypted && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decrypted)) return decrypted;
    }
    return clean;
};

const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const TYPO_EMAIL_DOMAINS = {
    'gnmail.com': 'Did you mean gmail.com?',
    'gamil.com': 'Did you mean gmail.com?',
    'gmial.com': 'Did you mean gmail.com?',
    'gmai.com': 'Did you mean gmail.com?',
    'gmail.co': 'Did you mean gmail.com?',
    'hotmial.com': 'Did you mean hotmail.com?',
    'hotmai.com': 'Did you mean hotmail.com?',
    'yaho.com': 'Did you mean yahoo.com?',
    'yhaoo.com': 'Did you mean yahoo.com?',
    'outlok.com': 'Did you mean outlook.com?',
};

const emailValidationReason = (value) => {
    const email = String(value || '').trim().toLowerCase();
    if (!email) return 'Missing email address';
    if (!isValidEmail(email)) return 'Invalid email format';
    const domain = email.split('@')[1] || '';
    if (TYPO_EMAIL_DOMAINS[domain]) return `Invalid email domain "${domain}". ${TYPO_EMAIL_DOMAINS[domain]}`;
    return '';
};

const isDeliverableEmail = value => !emailValidationReason(value);

const recipientName = row =>
    row?.official_entity_name
    || row?.display_name
    || row?.name
    || row?.email
    || row?.official_id
    || row?.user_id
    || '';

const recipientType = row => {
    if (row?.official_id) return 'official';
    if (row?.user_id || String(row?.party_type || '').toUpperCase() === 'USER') return 'user';
    return 'custom';
};

const recipientIdentity = row => ({
    type: recipientType(row),
    name: recipientName(row),
    email: String(row?.email || '').trim(),
    channel: String(row?.channel || 'TO').toUpperCase(),
    official_id: row?.official_id || null,
    official_entity_id: row?.official_entity_id || null,
    user_id: row?.user_id || null,
    role: row?.role || row?.party_type || row?.attendee_type || '',
});

const uniqueValidEmails = rows => [...new Set((rows || [])
    .map(row => String(row?.email || '').trim())
    .filter(isDeliverableEmail))];

const emailSet = rows => new Set((rows || []).map(email => String(email || '').trim().toLowerCase()).filter(Boolean));

const buildRecipientResults = ({
    recipients = {},
    accepted = [],
    rejected = [],
    failedReason = '',
    skippedReason = '',
    fallbackAccepted = false,
} = {}) => {
    const acceptedSet = emailSet(accepted);
    const rejectedSet = emailSet(rejected);
    const rows = Array.isArray(recipients.rows) ? recipients.rows : [];
    const validRows = rows.filter(row => isDeliverableEmail(row.email));
    const invalidRows = Array.isArray(recipients.invalid) ? recipients.invalid : [];

    return [
        ...validRows.map(row => {
            const email = String(row.email || '').trim();
            const key = email.toLowerCase();
            if (skippedReason) {
                return { ...row, email, delivery_status: 'SKIPPED', reason: skippedReason };
            }
            if (failedReason) {
                return { ...row, email, delivery_status: 'FAILED', reason: failedReason };
            }
            if (rejectedSet.has(key)) {
                return { ...row, email, delivery_status: 'REJECTED', reason: 'SMTP provider rejected this recipient' };
            }
            if (acceptedSet.has(key) || fallbackAccepted) {
                return {
                    ...row,
                    email,
                    delivery_status: 'ACCEPTED',
                    reason: 'Accepted by SMTP provider. Final inbox delivery cannot be guaranteed without provider delivery webhooks.',
                };
            }
            return { ...row, email, delivery_status: 'UNKNOWN', reason: 'SMTP provider did not return recipient-level result' };
        }),
        ...invalidRows.map(row => ({
            ...row,
            delivery_status: 'INVALID',
            reason: row.reason || 'Invalid or missing email address',
        })),
    ];
};

const buildDeliverySummaryMessage = ({
    status = '',
    acceptedCount = 0,
    failedCount = 0,
    skippedCount = 0,
    invalidCount = 0,
    errorMessage = '',
    hasRejected = false,
} = {}) => {
    const parts = [];
    if (acceptedCount) {
        parts.push(`${acceptedCount} email(s) accepted by the mail server and delivery is expected.`);
    }
    if (invalidCount) {
        parts.push(`${invalidCount} email(s) were not sent because the address is invalid or missing.`);
    }
    if (hasRejected) {
        parts.push('Some email(s) were rejected by the mail server.');
    }
    if (failedCount) {
        parts.push(`${failedCount} email(s) were not sent because sending failed.`);
    }
    if (skippedCount) {
        parts.push(`${skippedCount} reminder(s) skipped.`);
    }
    if (errorMessage) {
        parts.push(`Reason: ${errorMessage}`);
    }

    if (parts.length) return parts.join(' ');
    if (String(status).toUpperCase() === 'SENT') return 'Email accepted by the mail server and delivery is expected.';
    return 'No delivery details available.';
};

const buildTechnicalDeliveryMessage = ({
    status = '',
    companyEventId = '',
    reminderId = '',
    scheduledDate = '',
    senderEmail = '',
    replyToEmail = '',
    emailConfigId = '',
    smtpHost = '',
    to = [],
    cc = [],
    bcc = [],
    accepted = [],
    rejected = [],
    invalid = [],
    messageId = '',
    providerResponse = '',
    errorMessage = '',
    attachmentCount = 0,
    missingAttachments = [],
} = {}) => {
    const parts = [
        `Status: ${status || 'UNKNOWN'}`,
        companyEventId ? `CompanyEventId: ${companyEventId}` : '',
        reminderId ? `ReminderId: ${reminderId}` : '',
        scheduledDate ? `ScheduledDate: ${scheduledDate}` : '',
        senderEmail ? `Sender: ${senderEmail}` : '',
        replyToEmail ? `ReplyTo: ${replyToEmail}` : '',
        emailConfigId ? `EmailConfigId: ${emailConfigId}` : '',
        smtpHost ? `SMTPHost: ${smtpHost}` : '',
        `TO(${to.length}): ${to.join(', ') || '-'}`,
        `CC(${cc.length}): ${cc.join(', ') || '-'}`,
        `BCC(${bcc.length}): ${bcc.join(', ') || '-'}`,
        accepted.length ? `Accepted: ${accepted.join(', ')}` : '',
        rejected.length ? `Rejected: ${rejected.join(', ')}` : '',
        invalid.length ? `Invalid: ${invalid.map(item => `${item.email || item.name || 'Unknown'} (${item.reason || 'Invalid'})`).join(', ')}` : '',
        messageId ? `MessageId: ${messageId}` : '',
        providerResponse ? `ProviderResponse: ${providerResponse}` : '',
        errorMessage ? `Error: ${errorMessage}` : '',
        `AttachmentCount: ${attachmentCount}`,
        missingAttachments.length ? `MissingAttachments: ${missingAttachments.map(item => item.file_name || item.file_path || item.doc_id).filter(Boolean).join(', ')}` : '',
    ];

    return parts.filter(Boolean).join(' | ');
};

const _row = row => (row?.toJSON ? row.toJSON() : row);

class CommonCronService {
    constructor() {
        this.eventDao = new CompanyEventDao();
        this.reminderLogDao = new CompanyEventReminderLogDao();
        this.reminderDao = new ReminderDao();
        this.documentStoreDao = new DocumentStoreDao();
        this.emailConfigurationDao = new EmailConfigurationDao();
        this.emailHelper = new EmailHelper();
    }

    /**
     * Get event includes for reminder processing
     */
    _eventInclude(models, mode = 'reminder') {
        return [
            ...(models.company_event_name ? [{
                model: models.company_event_name,
                as: 'event',
                required: false,
                attributes: ['e_id', 'event_name', 'event_slug', 'event_subject', 'color_code', 'is_system_event', 'is_recurring', 'recurring_period', 'recurring_duration'],
            }] : []),
            ...(models.entities ? [{
                model: models.entities,
                as: 'entity',
                required: false,
                attributes: ['entity_id', 'name', 'client_no', 'status', 'uen_no', 'fbrn_reg_no', 'uf_no', 'domes_bus_no', 'acra_no', 'company_type_id'],
                include: [
                    ...(models.entity_company_details ? [{
                        model: models.entity_company_details,
                        as: 'company_detail',
                        required: false,
                        attributes: ['company_incorporation_date', 'company_fin_date', 'country', 'country_id'],
                    }] : []),
                    ...(models.entity_address ? [{
                        model: models.entity_address,
                        as: 'addresses',
                        required: false,
                        attributes: ['address_id', 'address_type', 'block_no', 'street_name', 'building_name', 'level_no', 'unit_no', 'city', 'state', 'postal_code', 'country', 'is_primary'],
                        where: { is_deleted: false },
                    }] : []),
                ],
            }] : []),
        ];
    }

    /**
     * Format entity address
     */
    _formatEntityAddress(address = {}) {
        const row = address || {};
        return [
            row.block_no,
            row.street_name,
            row.level_no,
            row.unit_no,
            row.building_name,
            row.city,
            row.state,
            row.country,
            row.postal_code,
        ].filter(Boolean).join(' ');
    }

    /**
     * Get address by type
     */
    _addressByType(entity = {}, type = '') {
        const addresses = Array.isArray(entity.addresses) ? entity.addresses.map(row => _row(row)) : [];
        const normalizedType = String(type || '').toUpperCase();
        return addresses.find(address => String(address.address_type || '').toUpperCase() === normalizedType)
            || (normalizedType === 'REGISTERED' ? addresses.find(address => address.is_primary) : null)
            || null;
    }

    /**
     * Get company registration number
     */
    _companyRegistrationNumber(entity = {}) {
        return entity.uen_no
            || entity.fbrn_reg_no
            || entity.acra_no
            || entity.uf_no
            || entity.domes_bus_no
            || '';
    }

    /**
     * Build reminder context
     */
    _eventReminderContext(event = {}, reminder = {}, scheduledDate = null) {
        const entity = event.entity || {};
        const companyDetail = entity.company_detail || {};
        const eventMaster = event.event || {};
        const registeredAddress = this._addressByType(entity, 'REGISTERED');
        const localAddress = this._addressByType(entity, 'BUSINESS')
            || this._addressByType(entity, 'MAILING')
            || registeredAddress;
        const foreignAddress = this._addressByType(entity, 'FOREIGN');
        const fyeDate = event.fye_date || event.actual_fye || event.period_end || companyDetail.company_fin_date;

        return {
            company: {
                id: event.entity_id,
                name: entity.name || '',
                client_no: entity.client_no || '',
                registration_no: this._companyRegistrationNumber(entity),
                uen_no: entity.uen_no || '',
                fbrn_reg_no: entity.fbrn_reg_no || '',
                uf_no: entity.uf_no || '',
                domes_bus_no: entity.domes_bus_no || '',
                acra_no: entity.acra_no || '',
                registered_office_address: this._formatEntityAddress(registeredAddress),
                local_address: this._formatEntityAddress(localAddress),
                foreign_address: this._formatEntityAddress(foreignAddress),
                incorporation_date: formatDisplayDate(companyDetail.company_incorporation_date),
                fye_date: formatDisplayDate(fyeDate),
                country: companyDetail.country || registeredAddress?.country || localAddress?.country || '',
            },
            event: {
                id: event.company_event_id,
                name: eventMaster.event_name || event.event_slug || '',
                subject: eventMaster.event_subject || '',
                slug: event.event_slug || eventMaster.event_slug || '',
                due_date: formatDisplayDate(event.due_date),
                fye_date: formatDisplayDate(fyeDate),
                notice_date: formatDisplayDate(event.sent_date),
                received_date: formatDisplayDate(event.received_date),
                period_from: formatDisplayDate(event.period_start),
                period_to: formatDisplayDate(event.period_end),
                held_date: formatDisplayDate(event.held_date),
                filing_date: formatDisplayDate(event.filing_date),
                venue: event.venue || '',
                agenda: event.meeting_agenda || '',
                year_of_fye: event.year_of_fye || '',
                actual_year: event.actual_year || '',
            },
            reminder: {
                id: reminder.reminder_id || '',
                subject: stripHtml(reminder.subject || ''),
                scheduled_date: formatDisplayDate(scheduledDate),
            },
        };
    }

    /**
     * Check if reminder matches event
     */
    _reminderMatchesEvent(reminder = {}, event = {}) {
        if (String(reminder.category || 'EVENT').toUpperCase() !== 'EVENT') return false;
        if (String(reminder.status || 'ACTIVE').toUpperCase() !== 'ACTIVE') return false;
        if (reminder.is_deleted) return false;

        const reminderEventId = Number(reminder.event_id);
        const eventId = Number(event.event_id);
        if (reminderEventId && eventId && reminderEventId !== eventId) return false;

        const reminderCompanyTypeId = Number(reminder.company_type_id);
        const companyTypeId = Number(event.entity?.company_type_id);
        if (reminderCompanyTypeId && companyTypeId && reminderCompanyTypeId !== companyTypeId) return false;
        if (reminderCompanyTypeId && !companyTypeId) return false;

        return true;
    }

    /**
     * Get scheduled dates for reminder
     */
    _scheduledDatesForReminder(event = {}, reminder = {}, targetDate = todayDate()) {
        const reminderDueDate = event.reminder_date_basis === 'ACTUAL_DUE_DATE'
            ? event.due_date
            : (event.extended_due_date || event.due_date);
        if (!reminderDueDate) return [];

        const offset = Number(reminder.offset_days || 0);
        const direction = String(reminder.timing_type || 'BEFORE').toUpperCase() === 'AFTER' ? 1 : -1;
        const firstDate = addDays(reminderDueDate, direction * offset);
        if (!firstDate) return [];

        if (!reminder.is_recurring) return [firstDate];

        const intervalDays = Math.max(Number(reminder.recurring_interval_days || 1), 1);
        const dueDate = dateOrNull(reminderDueDate);
        const dates = [];
        let cursor = firstDate;
        let guard = 0;

        while (cursor && cursor <= targetDate && cursor <= dueDate && guard < 365) {
            dates.push(cursor);
            cursor = addDays(cursor, intervalDays);
            guard += 1;
        }

        return dates;
    }

    /**
     * Get official primary email by official IDs
     */
    async _officialPrimaryEmailByOfficialId(rows = []) {
        const models = getCurrentModels();
        if (!models.officials || !models.entity_contact) return {};

        const officialIds = [...new Set((rows || [])
            .map(row => Number(row?.official_id))
            .filter(Boolean))];
        if (!officialIds.length) return {};

        const officialRows = await models.officials.findAll({
            attributes: ['official_id', 'official_entity_id'],
            where: {
                official_id: { [Op.in]: officialIds },
                is_deleted: 0,
            },
        });

        const officialToEntity = {};
        const entityIds = [];
        officialRows.forEach(row => {
            const plain = _row(row);
            if (plain.official_id && plain.official_entity_id) {
                officialToEntity[plain.official_id] = Number(plain.official_entity_id);
                entityIds.push(Number(plain.official_entity_id));
            }
        });

        const uniqueEntityIds = [...new Set(entityIds.filter(Boolean))];
        if (!uniqueEntityIds.length) return {};

        const contactRows = await models.entity_contact.findAll({
            attributes: ['entity_id', 'contact_value', 'is_primary', 'contact_id'],
            where: {
                entity_id: { [Op.in]: uniqueEntityIds },
                contact_type: 'EMAIL',
                is_deleted: false,
            },
            order: [['is_primary', 'DESC'], ['contact_id', 'ASC']],
        });

        const emailByEntityId = {};
        contactRows.forEach(row => {
            const plain = _row(row);
            const email = maybeDecryptContactValue(plain.contact_value);
            if (!emailByEntityId[plain.entity_id] && isValidEmail(email)) {
                emailByEntityId[plain.entity_id] = email;
            }
        });

        return officialIds.reduce((acc, officialId) => {
            const entityId = officialToEntity[officialId];
            if (entityId && emailByEntityId[entityId]) {
                acc[officialId] = emailByEntityId[entityId];
            }
            return acc;
        }, {});
    }

    /**
     * Get event recipients
     */
    async _eventRecipients(event = {}) {
        const rows = flattenPartyPayload(event.receiving_parties);
        const officialEmailById = await this._officialPrimaryEmailByOfficialId(rows);
        const resolvedRows = rows.map((row) => {
            if (row?.official_id) {
                const email = officialEmailById[Number(row.official_id)] || '';
                if (!email) {
                    logger.warn('Reminder official recipient has no primary email', {
                        companyEventId: event.company_event_id,
                        officialId: row.official_id,
                        officialEntityId: row.official_entity_id || null,
                        channel: row.channel || '',
                    });
                }
                return { ...row, email, channel: String(row?.channel || 'TO').toUpperCase() };
            }

            return { ...row, email: String(row?.email || '').trim(), channel: String(row?.channel || 'TO').toUpperCase() };
        });

        const deliverableRows = resolvedRows.filter(row => ['TO', 'CC', 'BCC'].includes(row.channel));
        const invalid = deliverableRows
            .map(row => ({ row, reason: emailValidationReason(row.email) }))
            .filter(item => item.reason)
            .map(({ row, reason }) => ({
                ...recipientIdentity(row),
                reason,
            }));

        return {
            to: uniqueValidEmails(deliverableRows.filter(row => row.channel === 'TO')),
            cc: uniqueValidEmails(deliverableRows.filter(row => row.channel === 'CC')),
            bcc: uniqueValidEmails(deliverableRows.filter(row => row.channel === 'BCC')),
            invalid,
            rows: deliverableRows.map(recipientIdentity),
        };
    }

    /**
     * Resolve event email configuration
     */
    async _resolveEventEmailConfig(event = {}) {
        let row = null;

        if (event.email_config_id) {
            row = await this.emailConfigurationDao.findOneByWhere({
                email_config_id: Number(event.email_config_id),
                is_deleted: false,
            });
        }

        if (!row) {
            row = await this.emailConfigurationDao.findOneByWhere({
                is_default: true,
                is_deleted: false,
            });
        }

        if (!row) {
            row = await this.emailConfigurationDao.findOneByWhere({
                is_deleted: false,
            });
        }

        const configRow = _row(row) || {};
        const senderEmail = configRow.sending_email || event.sender_email || '';
        const replyEmail = configRow.reply_email || event.reply_to_email || '';
        const fromName = configRow.from_name || configRow.config_name || '';

        return {
            ...configRow,
            email_config_id: configRow.email_config_id || event.email_config_id || null,
            sender_email: senderEmail,
            reply_to_email: replyEmail,
            from_name: fromName,
            from: fromName && senderEmail ? `${fromName} <${senderEmail}>` : senderEmail,
        };
    }

    /**
     * Get reminder attachments
     */
    async _getReminderAttachments(reminderId) {
        const rows = await this.documentStoreDao.findByWhere({
            entity_id: reminderId,
            entity_type: REMINDER_ENTITY_TYPE,
            module_name: REMINDER_MODULE_NAME,
            is_deleted: false,
        });

        return (rows || []).map(row => {
            const doc = _row(row);
            return {
                doc_id: doc.doc_id,
                file_name: doc.doc_name || doc.file_name || '',
                file_path: doc.file_path || '',
                created_date: doc.created_date || null,
            };
        });
    }

    /**
     * Get attachment disk path
     */
    _attachmentDiskPath(filePath) {
        if (!filePath) return '';
        if (path.isAbsolute(filePath) && fs.existsSync(filePath)) return filePath;

        const relativePath = extractRelativePath(filePath).replace(/\\/g, '/');
        if (!relativePath) return '';

        const uploadPath = path.join(getUploadBase(), relativePath);
        if (fs.existsSync(uploadPath)) return uploadPath;

        const cwdPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(cwdPath)) return cwdPath;

        return '';
    }

    /**
     * Get reminder mail attachments
     */
    async _getReminderMailAttachments(reminderId, context = {}) {
        const docs = await this._getReminderAttachments(reminderId);
        const missing = [];
        const attachments = docs
            .map((doc) => {
                const diskPath = this._attachmentDiskPath(doc.file_path);
                if (!diskPath) {
                    missing.push({
                        doc_id: doc.doc_id,
                        file_name: doc.file_name,
                        file_path: doc.file_path,
                    });
                    return null;
                }

                return {
                    filename: doc.file_name || path.basename(diskPath),
                    path: diskPath,
                };
            })
            .filter(Boolean);

        if (missing.length) {
            logger.warn('Reminder attachment file missing on disk', {
                ...context,
                missing,
            });
        }

        return { attachments, missing };
    }

    /**
     * Find reminder log
     */
    async _findReminderLog(companyEventId, reminderId, scheduledDate) {
        if (!this.reminderLogDao.Model) return null;
        return this.reminderLogDao.findOne({
            where: {
                company_event_id: companyEventId,
                reminder_id: reminderId,
                scheduled_date: scheduledDate,
            },
        });
    }

    _shouldSkipExistingReminderLog(existingLog, force = false) {
        if (!existingLog || force) return false;
        const status = String(existingLog.status || '').toUpperCase();
        // SENT/SKIPPED are final for this event/reminder/date key. FAILED and
        // PENDING attempts remain retryable when the cron is run again.
        return ['SENT', 'SKIPPED'].includes(status);
    }

    /**
     * Write reminder log
     */
    async _writeReminderLog(payload = {}, existing = null) {
        const now = new Date();
        if (existing) {
            await existing.update({
                ...payload,
                updated_date: now,
            });
            return existing;
        }

        return this.reminderLogDao.create({
            ...payload,
            created_date: now,
            updated_date: now,
        });
    }

    /**
     * Send due reminders - MAIN CRON FUNCTION
     */
    sendDueReminders = async (body = {}, userId = null, req = null) => {
        try {
            const models = getCurrentModels();
            if (!models.company_event || !models.reminder || !models.company_event_reminder_log) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Reminder sending models are unavailable');
            }

            const targetDate = dateOrNull(body.date) || todayDate();
            const companyEventId = body.company_event_id || body.companyEventId;
            const entityId = body.entity_id || body.entityId || body.company_id || body.companyId;
            const dryRun = body.dry_run === true || body.dry_run === 'true' || body.dryRun === true || body.dryRun === 'true' || body.preview === true || body.preview === 'true';
            const force = body.force === true || body.force === 'true';
            const limit = body.limit ? Math.max(Number(body.limit) || 0, 0) : null;
            const eventWhere = {
                is_deleted: false,
                status: { [Op.in]: OPEN_EVENT_STATUSES },
                due_date: { [Op.ne]: null },
            };
            if (companyEventId) eventWhere.company_event_id = Number(companyEventId);
            if (entityId) eventWhere.entity_id = Number(entityId);

            const [events, reminders] = await Promise.all([
                models.company_event.findAll({
                    where: eventWhere,
                    include: this._eventInclude(models),
                    order: [['due_date', 'ASC']],
                    ...(limit ? { limit } : {}),
                }),
                this.reminderDao.Model.findAll({
                    where: {
                        category: 'EVENT',
                        status: 'ACTIVE',
                        is_deleted: false,
                    },
                    order: [['offset_days', 'DESC'], ['reminder_id', 'ASC']],
                }),
            ]);

            const result = {
                date: targetDate,
                dry_run: dryRun,
                checked: 0,
                sent: 0,
                skipped: 0,
                failed: 0,
                invalid: 0,
                items: [],
            };

            logger.info('Reminder cron started', {
                date: targetDate,
                dryRun,
                force,
                eventCount: events.length,
                reminderCount: reminders.length,
                companyEventId: companyEventId || null,
                entityId: entityId || null,
            });

            const emailConfigCache = new Map();
            const attachmentCache = new Map();

            for (const eventRow of events) {
                const event = _row(eventRow);
                for (const reminderRow of reminders) {
                    const reminder = _row(reminderRow);
                    if (!this._reminderMatchesEvent(reminder, event)) continue;

                    const dueDates = this._scheduledDatesForReminder(event, reminder, targetDate);
                    const scheduledDates = dueDates.filter(date => date === targetDate);
                    
                    for (const scheduledDate of scheduledDates) {
                        result.checked += 1;

                        let existingLog = await this._findReminderLog(
                            event.company_event_id, 
                            reminder.reminder_id, 
                            scheduledDate
                        );
                        if (this._shouldSkipExistingReminderLog(existingLog, force)) {
                            result.skipped += 1;
                            logger.info('Reminder skipped because it was already processed', {
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                logId: existingLog.log_id,
                            });
                            result.items.push({
                                company_event_id: event.company_event_id,
                                reminder_id: reminder.reminder_id,
                                scheduled_date: scheduledDate,
                                status: 'SKIPPED',
                                reason: 'Already processed',
                            });
                            continue;
                        }

                        const recipients = await this._eventRecipients(event);
                        result.invalid += recipients.invalid.length;
                        const emailConfigKey = event.email_config_id ? `id:${event.email_config_id}` : 'default';
                        
                        if (!emailConfigCache.has(emailConfigKey)) {
                            emailConfigCache.set(emailConfigKey, await this._resolveEventEmailConfig(event));
                        }
                        const emailConfig = emailConfigCache.get(emailConfigKey);
                        const senderEmail = emailConfig.sender_email || null;
                        const replyToEmail = emailConfig.reply_to_email || null;
                        
                        const context = this._eventReminderContext(event, reminder, scheduledDate);
                        const subject = stripSubjectHtml(renderReminderTemplate(reminder.subject, context)) 
                            || stripSubjectHtml(reminder.subject) 
                            || 'Event Reminder';
                        const message = renderReminderTemplate(reminder.message, context);
                        
                        if (!attachmentCache.has(reminder.reminder_id)) {
                            attachmentCache.set(reminder.reminder_id, await this._getReminderMailAttachments(
                                reminder.reminder_id, { reminderId: reminder.reminder_id }
                            ));
                        }
                        
                        const reminderAttachmentPayload = attachmentCache.get(reminder.reminder_id);
                        const mailAttachments = reminderAttachmentPayload.attachments;
                        const missingAttachments = reminderAttachmentPayload.missing;
                        const validRecipientCount = recipients.to.length + recipients.cc.length + recipients.bcc.length;
                        const baseCounts = {
                            to_count: recipients.to.length,
                            cc_count: recipients.cc.length,
                            bcc_count: recipients.bcc.length,
                            recipient_count: validRecipientCount,
                            invalid_count: recipients.invalid.length,
                        };
                        const buildDeliverySummary = (extra = {}) => ({
                            to_recipients: recipients.to,
                            cc_recipients: recipients.cc,
                            bcc_recipients: recipients.bcc,
                            invalid_recipients: recipients.invalid,
                            accepted_recipients: extra.accepted_recipients || [],
                            rejected_recipients: extra.rejected_recipients || [],
                            recipient_results: extra.recipient_results || [],
                            message_id: extra.message_id || '',
                            provider_response: extra.provider_response || '',
                            summary_message: extra.summary_message || '',
                            user_message: extra.user_message || extra.summary_message || '',
                            technical_message: extra.technical_message || '',
                            counts: {
                                ...baseCounts,
                                sent_count: extra.sent_count || 0,
                                failed_count: extra.failed_count || 0,
                                skipped_count: extra.skipped_count || 0,
                            },
                        });
                        const buildDeliveryDetails = (extra = {}) => ({
                            ...buildDeliverySummary(extra),
                            all_recipients: recipients.rows,
                            attachments: {
                                count: mailAttachments.length,
                                missing_count: missingAttachments.length,
                                missing: missingAttachments,
                            },
                            ...extra,
                        });
                        
                        const baseLog = {
                            company_event_id: event.company_event_id,
                            reminder_id: reminder.reminder_id,
                            scheduled_date: scheduledDate,
                            delivery_summary: buildDeliverySummary(),
                            delivery_details: buildDeliveryDetails(),
                            subject_snapshot: subject,
                            message_snapshot: message,
                            sender_email: senderEmail,
                            reply_to_email: replyToEmail,
                            email_config_id: emailConfig.email_config_id,
                            updated_by: userId,
                            created_by: userId,
                        };

                        if (!recipients.to.length) {
                            const errorMessage = 'No TO recipients found';
                            const recipientResults = buildRecipientResults({
                                recipients,
                                skippedReason: errorMessage,
                            });
                            const summaryMessage = buildDeliverySummaryMessage({
                                status: 'SKIPPED',
                                skippedCount: 1,
                                invalidCount: recipients.invalid.length,
                                errorMessage,
                            });
                            const technicalMessage = buildTechnicalDeliveryMessage({
                                status: 'SKIPPED',
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                senderEmail,
                                replyToEmail,
                                emailConfigId: emailConfig.email_config_id,
                                smtpHost: emailConfig.smtp_host || process.env.SMTP_HOST || '',
                                to: recipients.to,
                                cc: recipients.cc,
                                bcc: recipients.bcc,
                                invalid: recipients.invalid,
                                errorMessage,
                                attachmentCount: mailAttachments.length,
                                missingAttachments,
                            });
                            result.skipped += 1;
                            logger.warn('Reminder skipped: no TO recipients', {
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                ccCount: recipients.cc.length,
                                bccCount: recipients.bcc.length,
                            });
                            const deliverySummary = buildDeliverySummary({
                                skipped_count: 1,
                                recipient_results: recipientResults,
                                summary_message: summaryMessage,
                                user_message: summaryMessage,
                                technical_message: technicalMessage,
                            });
                            await this._writeReminderLog({
                                ...baseLog,
                                status: 'SKIPPED',
                                delivery_summary: deliverySummary,
                                delivery_details: buildDeliveryDetails({
                                    skipped_count: 1,
                                    recipient_results: recipientResults,
                                    summary_message: summaryMessage,
                                    user_message: summaryMessage,
                                    technical_message: technicalMessage,
                                    error_message: errorMessage,
                                }),
                                error_message: errorMessage,
                            }, existingLog);
                            result.items.push({
                                ...baseLog,
                                ...deliverySummary,
                                ...deliverySummary.counts,
                                status: 'SKIPPED',
                                reason: errorMessage,
                            });
                            continue;
                        }

                        if (dryRun) {
                            const errorMessage = 'Dry run only - email not sent';
                            const recipientResults = buildRecipientResults({
                                recipients,
                                skippedReason: errorMessage,
                            });
                            const summaryMessage = buildDeliverySummaryMessage({
                                status: 'PENDING',
                                skippedCount: 1,
                                invalidCount: recipients.invalid.length,
                                errorMessage,
                            });
                            const technicalMessage = buildTechnicalDeliveryMessage({
                                status: 'PENDING_DRY_RUN',
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                senderEmail,
                                replyToEmail,
                                emailConfigId: emailConfig.email_config_id,
                                smtpHost: emailConfig.smtp_host || process.env.SMTP_HOST || '',
                                to: recipients.to,
                                cc: recipients.cc,
                                bcc: recipients.bcc,
                                invalid: recipients.invalid,
                                errorMessage,
                                attachmentCount: mailAttachments.length,
                                missingAttachments,
                            });
                            logger.info('Reminder dry run recorded', {
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                senderEmail,
                                emailConfigId: emailConfig.email_config_id || null,
                                toCount: recipients.to.length,
                                ccCount: recipients.cc.length,
                                bccCount: recipients.bcc.length,
                                attachmentCount: mailAttachments.length,
                                missingAttachmentCount: missingAttachments.length,
                            });
                            const deliverySummary = buildDeliverySummary({
                                skipped_count: 1,
                                recipient_results: recipientResults,
                                summary_message: summaryMessage,
                                user_message: summaryMessage,
                                technical_message: technicalMessage,
                            });
                            await this._writeReminderLog({
                                ...baseLog,
                                status: 'PENDING',
                                sent_at: null,
                                delivery_summary: deliverySummary,
                                delivery_details: buildDeliveryDetails({
                                    skipped_count: 1,
                                    dry_run: true,
                                    recipient_results: recipientResults,
                                    summary_message: summaryMessage,
                                    user_message: summaryMessage,
                                    technical_message: technicalMessage,
                                    error_message: errorMessage,
                                }),
                                error_message: errorMessage,
                            }, existingLog);
                            result.items.push({
                                ...baseLog,
                                ...deliverySummary,
                                ...deliverySummary.counts,
                                status: 'PENDING',
                                reason: errorMessage,
                                attachment_count: mailAttachments.length,
                                missing_attachment_count: missingAttachments.length,
                                missing_attachments: missingAttachments,
                            });
                            continue;
                        }

                        logger.info('Sending reminder email', {
                            companyEventId: event.company_event_id,
                            reminderId: reminder.reminder_id,
                            scheduledDate,
                            senderEmail,
                            emailConfigId: emailConfig.email_config_id || null,
                            smtpHost: emailConfig.smtp_host || process.env.SMTP_HOST || '',
                            toCount: recipients.to.length,
                            ccCount: recipients.cc.length,
                            bccCount: recipients.bcc.length,
                            attachmentCount: mailAttachments.length,
                            missingAttachmentCount: missingAttachments.length,
                        });

                        // Save the attempt before SMTP. This same log row is updated
                        // to SENT or FAILED below, and remains retryable if interrupted.
                        existingLog = await this._writeReminderLog({
                            ...baseLog,
                            status: 'PENDING',
                            sent_at: null,
                            delivery_summary: buildDeliverySummary({
                                summary_message: 'Email delivery is in progress.',
                                user_message: 'Email delivery is in progress.',
                            }),
                            delivery_details: buildDeliveryDetails({
                                delivery_phase: 'SENDING',
                                summary_message: 'Email delivery is in progress.',
                                user_message: 'Email delivery is in progress.',
                            }),
                            error_message: null,
                        }, existingLog);

                        const sendResult = await this.emailHelper.sendEmailResult(
                            emailConfig.from || senderEmail,
                            recipients.to,
                            subject,
                            message,
                            emailConfig.email_config_id ? emailConfig : null,
                            mailAttachments.length ? mailAttachments : false,
                            {
                                cc: recipients.cc.length ? recipients.cc : undefined,
                                bcc: recipients.bcc.length ? recipients.bcc : undefined,
                                replyTo: replyToEmail || undefined,
                            }
                        );

                        if (sendResult.success) {
                            result.sent += 1;
                            const acceptedRecipients = Array.isArray(sendResult.accepted) ? sendResult.accepted : [];
                            const rejectedRecipients = Array.isArray(sendResult.rejected) ? sendResult.rejected : [];
                            const sentCount = acceptedRecipients.length || validRecipientCount;
                            const failedCount = rejectedRecipients.length;
                            const recipientResults = buildRecipientResults({
                                recipients,
                                accepted: acceptedRecipients,
                                rejected: rejectedRecipients,
                                fallbackAccepted: !acceptedRecipients.length && Boolean(sendResult.messageId),
                            });
                            const summaryMessage = buildDeliverySummaryMessage({
                                status: 'SENT',
                                acceptedCount: sentCount,
                                failedCount,
                                invalidCount: recipients.invalid.length,
                                hasRejected: rejectedRecipients.length > 0,
                            });
                            const technicalMessage = buildTechnicalDeliveryMessage({
                                status: 'SENT',
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                senderEmail,
                                replyToEmail,
                                emailConfigId: emailConfig.email_config_id,
                                smtpHost: emailConfig.smtp_host || process.env.SMTP_HOST || '',
                                to: recipients.to,
                                cc: recipients.cc,
                                bcc: recipients.bcc,
                                accepted: acceptedRecipients,
                                rejected: rejectedRecipients,
                                invalid: recipients.invalid,
                                messageId: sendResult.messageId || '',
                                providerResponse: sendResult.response || '',
                                attachmentCount: mailAttachments.length,
                                missingAttachments,
                            });
                            const deliverySummary = buildDeliverySummary({
                                sent_count: sentCount,
                                failed_count: failedCount,
                                message_id: sendResult.messageId || '',
                                provider_response: sendResult.response || '',
                                accepted_recipients: acceptedRecipients,
                                rejected_recipients: rejectedRecipients,
                                recipient_results: recipientResults,
                                summary_message: summaryMessage,
                                user_message: summaryMessage,
                                technical_message: technicalMessage,
                            });
                            await this._writeReminderLog({
                                ...baseLog,
                                status: 'SENT',
                                sent_at: new Date(),
                                delivery_summary: deliverySummary,
                                delivery_details: buildDeliveryDetails({
                                    sent_count: sentCount,
                                    failed_count: failedCount,
                                    message_id: sendResult.messageId || '',
                                    provider_response: sendResult.response || '',
                                    accepted_recipients: acceptedRecipients,
                                    rejected_recipients: rejectedRecipients,
                                    recipient_results: recipientResults,
                                    summary_message: summaryMessage,
                                    user_message: summaryMessage,
                                    technical_message: technicalMessage,
                                }),
                                error_message: null,
                            }, existingLog);
                            logger.info('Reminder email sent', {
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                messageId: sendResult.messageId || '',
                                accepted: sendResult.accepted || [],
                                rejected: sendResult.rejected || [],
                                response: sendResult.response || '',
                                attachmentCount: mailAttachments.length,
                                missingAttachmentCount: missingAttachments.length,
                            });
                            result.items.push({
                                ...baseLog,
                                ...deliverySummary,
                                ...deliverySummary.counts,
                                status: 'SENT',
                                attachment_count: mailAttachments.length,
                                missing_attachment_count: missingAttachments.length,
                                missing_attachments: missingAttachments,
                            });
                        } else {
                            const errorMessage = sendResult.error || 'SMTP email send failed';
                            result.failed += 1;
                            const rejectedRecipients = Array.isArray(sendResult.rejected) ? sendResult.rejected : [];
                            const recipientResults = buildRecipientResults({
                                recipients,
                                rejected: rejectedRecipients,
                                failedReason: errorMessage,
                            });
                            const summaryMessage = buildDeliverySummaryMessage({
                                status: 'FAILED',
                                failedCount: validRecipientCount,
                                invalidCount: recipients.invalid.length,
                                hasRejected: rejectedRecipients.length > 0,
                                errorMessage,
                            });
                            const technicalMessage = buildTechnicalDeliveryMessage({
                                status: 'FAILED',
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                senderEmail,
                                replyToEmail,
                                emailConfigId: emailConfig.email_config_id,
                                smtpHost: emailConfig.smtp_host || process.env.SMTP_HOST || '',
                                to: recipients.to,
                                cc: recipients.cc,
                                bcc: recipients.bcc,
                                rejected: rejectedRecipients,
                                invalid: recipients.invalid,
                                providerResponse: sendResult.response || '',
                                errorMessage,
                                attachmentCount: mailAttachments.length,
                                missingAttachments,
                            });
                            logger.error('Reminder email failed', {
                                companyEventId: event.company_event_id,
                                reminderId: reminder.reminder_id,
                                scheduledDate,
                                error: errorMessage,
                                rejected: sendResult.rejected || [],
                                response: sendResult.response || '',
                                attachmentCount: mailAttachments.length,
                                missingAttachmentCount: missingAttachments.length,
                            });
                            const deliverySummary = buildDeliverySummary({
                                failed_count: validRecipientCount,
                                rejected_recipients: rejectedRecipients,
                                recipient_results: recipientResults,
                                provider_response: sendResult.response || '',
                                summary_message: summaryMessage,
                                user_message: summaryMessage,
                                technical_message: technicalMessage,
                            });
                            await this._writeReminderLog({
                                ...baseLog,
                                status: 'FAILED',
                                delivery_summary: deliverySummary,
                                delivery_details: buildDeliveryDetails({
                                    failed_count: validRecipientCount,
                                    error_message: errorMessage,
                                    provider_response: sendResult.response || '',
                                    rejected_recipients: rejectedRecipients,
                                    recipient_results: recipientResults,
                                    summary_message: summaryMessage,
                                    user_message: summaryMessage,
                                    technical_message: technicalMessage,
                                }),
                                error_message: errorMessage,
                            }, existingLog);
                            result.items.push({
                                ...baseLog,
                                ...deliverySummary,
                                ...deliverySummary.counts,
                                status: 'FAILED',
                                error_message: errorMessage,
                                attachment_count: mailAttachments.length,
                                missing_attachment_count: missingAttachments.length,
                                missing_attachments: missingAttachments,
                            });
                        }
                    }
                }
            }

            logger.info('Reminder cron finished', {
                date: targetDate,
                checked: result.checked,
                sent: result.sent,
                skipped: result.skipped,
                failed: result.failed,
                invalid: result.invalid,
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Due reminders processed', result);
        } catch (err) {
            logger.error('Send due reminders error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error sending due reminders');
        }
    };
}

module.exports = CommonCronService;
