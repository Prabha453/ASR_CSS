const httpStatus = require('http-status');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { extractRelativePath, getUploadBase, uploadDocument } = require('../../helper/documentHelper');

const ReminderDao = require('../../dao/masterSettings/ReminderDao');
const CompanyEventReminderLogDao = require('../../dao/company/CompanyEventReminderLogDao');
const DocumentStoreDao = require('../../dao/DocumentStoreDao');
const EmailConfigurationDao = require('../../dao/companyProfile/EmailConfigurationDao');
const EmailHelper = require('../../helper/EmailHelper');
const { decrypt } = require('../../utils/crypto');
const { renderReminderTemplate } = require('../../helper/eventHelper');

const logHelper = require('../../helper/LogHelper');
const { MODULES, ACTIONS, STATUS } = require('../../helper/LogHelper');

const REMINDER_MODULE_NAME = 'reminder';
const REMINDER_ENTITY_TYPE = 'REMINDER';

// ── Shared-shape pure helpers (duplicated from CompanyEventService) ──
// These are intentionally self-contained copies rather than imports from
// CompanyEventService, so ReminderService has no dependency on the event
// service module and can be constructed/tested independently.

const jsonArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return value.split(',').map(item => item.trim()).filter(Boolean);
        }
    }
    return [];
};

const jsonPayload = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return value;
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) return parsed;
        } catch {
            return jsonArray(value);
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

const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

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

const toEmailList = rows => [...new Set((rows || [])
    .map(row => String(row?.email || '').trim())
    .filter(isValidEmail))];

const formatDisplayDate = (value) => {
    const clean = dateOrNull(value);
    if (!clean) return '';
    const [year, month, day] = clean.split('-');
    return `${day}/${month}/${year}`;
};

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

const stripHtml = value => decodeHtmlEntities(String(value || '').replace(/<[^>]*>/g, '')).trim();

const maybeDecryptContactValue = (value) => {
    const clean = String(value || '').trim();
    if (!clean) return '';
    if (isValidEmail(clean)) return clean;
    if (/^[a-f0-9]+$/i.test(clean) && clean.length % 2 === 0) {
        const decrypted = decrypt(clean);
        if (decrypted && isValidEmail(decrypted)) return decrypted;
    }
    return clean;
};

class ReminderService {
    constructor() {
        this.reminderDao = new ReminderDao();
        this.reminderLogDao = new CompanyEventReminderLogDao();
        this.documentStoreDao = new DocumentStoreDao();
        this.emailConfigurationDao = new EmailConfigurationDao();
        this.emailHelper = new EmailHelper();
    }

    _row = row => (row?.toJSON ? row.toJSON() : row);

    // ── Includes for the "reminder master" list (reminder config rows) ──
    _reminderInclude(models) {
        return [
            ...(models.company_event_name ? [{
                model: models.company_event_name,
                as: 'event',
                required: false,
                attributes: ['e_id', 'event_name', 'event_slug'],
            }] : []),
            ...(models.company_type ? [{
                model: models.company_type,
                as: 'company_type_info',
                required: false,
                attributes: ['company_type_id', 'company_type_name'],
            }] : []),
        ];
    }

    // ── Include for company_event rows, used only by the sendDueReminders cron ──
    // (mirrors CompanyEventService._eventInclude(models, 'reminder') so the cron
    // still gets company_detail/addresses needed for merge-field context)
    _companyEventIncludeForReminders(models) {
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

    async _getReminderAttachments(reminderId) {
        const rows = await this.documentStoreDao.findByWhere({
            entity_id: reminderId,
            entity_type: REMINDER_ENTITY_TYPE,
            module_name: REMINDER_MODULE_NAME,
            is_deleted: false,
        });

        return (rows || []).map(row => {
            const doc = this._row(row);
            return {
                doc_id: doc.doc_id,
                file_name: doc.doc_name || doc.file_name || '',
                file_path: doc.file_path || '',
                created_date: doc.created_date || null,
            };
        });
    }

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

    async _uploadReminderAttachments({ files = [], reminderId, userId, req }) {

        const uploaded = [];
        for (const file of files) {
            try {
                const doc = await uploadDocument({
                    file,
                    userId,
                    entity_id: reminderId,
                    entity_type: REMINDER_ENTITY_TYPE,
                    module_name: REMINDER_MODULE_NAME,
                    sub_module_name: 'attachment',
                    module_record_id: reminderId,
                    doc_category: 'reminder_attachment',
                    doc_name: file.originalname || 'attachment',
                    sub_folder: 'reminder/attachments',
                    replace_existing: false,
                    delete_old_file: false,
                    req,
                });
                if (doc) uploaded.push(doc);
            } catch (err) {
                logger.error(`[Reminder attachments] upload failed for "${file.originalname}": ${err.message}`);
            }
        }
        return uploaded;
    }

    async _toReminderResponse(row) {
        const value = this._row(row);
        if (!value) return value;
        const attachments = await this._getReminderAttachments(value.reminder_id);

        return {
            ...value,
            event_name: value.event?.event_name || '',
            company_type_name: value.company_type_info?.company_type_name || '',
            attachments,
        };
    }

    _buildReminderPayload(body = {}, existing = null, userId = null) {
        const category = body.category === 'LOG' ? 'LOG' : 'EVENT';
        const timingType = body.timing_type === 'AFTER' ? 'AFTER' : 'BEFORE';
        const isRecurring = timingType === 'AFTER' && (body.is_recurring === true || body.is_recurring === 'true' || body.is_recurring === 1 || body.is_recurring === '1');

        return {
            category,
            event_id: category === 'EVENT' ? (Number(body.event_id) || null) : null,
            company_type_id: body.company_type_id ? Number(body.company_type_id) : null,
            status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            timing_type: timingType,
            offset_days: Number(body.offset_days) || 0,
            is_recurring: isRecurring,
            recurring_interval_type: isRecurring ? (body.recurring_interval_type === 'DAILY' ? 'DAILY' : 'CUSTOM') : null,
            recurring_interval_days: isRecurring ? (Number(body.recurring_interval_days) || 1) : null,
            sender_name: body.sender_name || existing?.sender_name || '',
            subject: body.subject ?? existing?.subject ?? '',
            message: body.message ?? existing?.message ?? '',
            updated_by: userId || body.updated_by || body.created_by || null,
            updated_date: new Date(),
        };
    }

    getReminders = async (query = {}) => {
        try {
            const where = { is_deleted: false };
            if (query.category) where.category = String(query.category).toUpperCase();
            if (query.status) where.status = String(query.status).toUpperCase();
            if (query.event_id) where.event_id = Number(query.event_id);
            if (query.company_type_id) where.company_type_id = Number(query.company_type_id);

            if (query.search && String(query.search).trim()) {
                const kw = `%${String(query.search).trim()}%`;
                where[Op.or] = [
                    { sender_name: { [Op.like]: kw } },
                    { subject: { [Op.like]: kw } },
                ];
            }

            const page = Math.max(parseInt(query.page || 1, 10), 1);
            const limit = Math.max(parseInt(query.limit || 25, 10), 1);
            const offset = (page - 1) * limit;

            const models = getCurrentModels();
            const result = await this.reminderDao.findAndCountAll({
                where,
                include: this._reminderInclude(models),
                order: [['reminder_id', 'DESC']],
                limit,
                offset,
            });

            const rows = await Promise.all(result.rows.map(row => this._toReminderResponse(row)));
            const paginationData = responseHandler.getPaginationData({ count: result.count, rows }, page, limit);

            return responseHandler.returnSuccess(httpStatus.OK, 'Reminders fetched', paginationData);
        } catch (err) {
            logger.error('Get reminders error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching reminders');
        }
    };

    getReminder = async (reminderId) => {
        try {
            const id = Number(reminderId);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Reminder id is required');

            const models = getCurrentModels();
            const row = await this.reminderDao.findOne({
                where: { reminder_id: id, is_deleted: false },
                include: this._reminderInclude(models),
            });

            if (!row) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Reminder not found');

            return responseHandler.returnSuccess(httpStatus.OK, 'Reminder fetched', await this._toReminderResponse(row));
        } catch (err) {
            logger.error('Get reminder error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching reminder');
        }
    };

    createReminder = async (body = {}, files = [], userId = null, req = null) => {
        const models = getCurrentModels();
        const t = await models.sequelize.transaction();

        try {
            if (body.category !== 'LOG' && !body.event_id) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is required for event reminders');
            }

            const payload = {
                ...this._buildReminderPayload(body, null, userId),
                is_deleted: false,
                created_date: new Date(),
                created_by: userId || body.created_by || null,
            };

            const created = await this.reminderDao.create(payload, { transaction: t });
            await t.commit();

            if (Array.isArray(files) && files.length) {
                await this._uploadReminderAttachments({ files, reminderId: created.reminder_id, userId, req });
            }

            logHelper.auditLog(req, {
                module: MODULES.REMINDER,
                action: ACTIONS.CREATE_REMINDER,
                user_id: userId,
                table_name: 'reminder',
                record_id: created.reminder_id,
                new_values: payload,
            });

            return this.getReminder(created.reminder_id);
        } catch (err) {
            await t.rollback();
            logger.error('Create reminder error:', err);
            logHelper.auditLog(req, {
                module: MODULES.REMINDER,
                action: ACTIONS.CREATE_REMINDER,
                user_id: userId,
                table_name: 'reminder',
                new_values: body,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error creating reminder');
        }
    };

    updateReminder = async (reminderId, body = {}, files = [], userId = null, req = null) => {
        const models = getCurrentModels();
        const id = Number(reminderId);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Reminder id is required');

        const t = await models.sequelize.transaction();
        try {
            const instance = await this.reminderDao.findOne({
                where: { reminder_id: id, is_deleted: false },
                transaction: t,
            });
            if (!instance) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Reminder not found');
            }

            const existing = this._row(instance);

            if ((body.category || existing.category) !== 'LOG' && !(body.event_id || existing.event_id)) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is required for event reminders');
            }

            const payload = this._buildReminderPayload(body, existing, userId);
            await instance.update(payload, { transaction: t });
            await t.commit();

            if (Array.isArray(files) && files.length) {
                await this._uploadReminderAttachments({ files, reminderId: id, userId, req });
            }

            logHelper.auditLog(req, {
                module: MODULES.REMINDER,
                action: ACTIONS.UPDATE_REMINDER,
                user_id: userId,
                table_name: 'reminder',
                record_id: id,
                old_values: existing,
                new_values: payload,
            });

            return this.getReminder(id);
        } catch (err) {
            await t.rollback();
            logger.error('Update reminder error:', err);
            logHelper.auditLog(req, {
                module: MODULES.REMINDER,
                action: ACTIONS.UPDATE_REMINDER,
                user_id: userId,
                table_name: 'reminder',
                record_id: id,
                new_values: body,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating reminder');
        }
    };

    deleteReminder = async (reminderId, userId = null, req = null) => {
        try {
            const id = Number(reminderId);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Reminder id is required');

            const existing = await this.reminderDao.findOne({ where: { reminder_id: id, is_deleted: false } });
            if (!existing) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Reminder not found');

            const oldValues = this._row(existing);

            await this.reminderDao.Model.update(
                { is_deleted: true, updated_by: userId, updated_date: new Date() },
                { where: { reminder_id: id } }
            );

            await this.documentStoreDao.updateWhere(
                { is_deleted: true },
                { entity_id: id, entity_type: REMINDER_ENTITY_TYPE, module_name: REMINDER_MODULE_NAME }
            );

            logHelper.auditLog(req, {
                module: MODULES.REMINDER,
                action: ACTIONS.DELETE_REMINDER,
                user_id: userId,
                table_name: 'reminder',
                record_id: id,
                old_values: oldValues,
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Reminder deleted', { reminder_id: id });
        } catch (err) {
            logger.error('Delete reminder error:', err);
            logHelper.auditLog(req, {
                module: MODULES.REMINDER,
                action: ACTIONS.DELETE_REMINDER,
                user_id: userId,
                table_name: 'reminder',
                record_id: reminderId,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting reminder');
        }
    };

    // ── Reminder logs (audit trail of sent/failed/skipped reminder attempts) ──

    _reminderLogInclude(models, eventWhere = null) {
        return [
            ...(models.company_event ? [{
                model: models.company_event,
                as: 'company_event',
                required: Boolean(eventWhere),
                ...(eventWhere ? { where: eventWhere } : {}),
                include: [
                    ...(models.company_event_name ? [{
                        model: models.company_event_name,
                        as: 'event',
                        required: false,
                        attributes: ['e_id', 'event_name', 'event_slug', 'event_subject'],
                    }] : []),
                    ...(models.entities ? [{
                        model: models.entities,
                        as: 'entity',
                        required: false,
                        attributes: ['entity_id', 'name', 'client_no', 'uen_no', 'fbrn_reg_no', 'acra_no'],
                    }] : []),
                ],
            }] : []),
            ...(models.reminder ? [{
                model: models.reminder,
                as: 'reminder',
                required: false,
                attributes: ['reminder_id', 'sender_name', 'subject', 'timing_type', 'offset_days', 'is_recurring'],
            }] : []),
        ];
    }

    _toReminderLogResponse(row) {
        const value = this._row(row);
        if (!value) return value;
        const event = this._row(value.company_event) || {};
        const company = this._row(event.entity) || {};
        const eventMaster = this._row(event.event) || {};
        const reminder = this._row(value.reminder) || {};
        const deliverySummary = jsonPayload(value.delivery_summary, {});
        const deliveryDetails = jsonPayload(value.delivery_details, {});
        const counts = deliverySummary.counts || deliveryDetails.counts || {};

        return {
            ...value,
            company_event_id: value.company_event_id,
            reminder_id: value.reminder_id,
            company_name: company.name || '',
            company_id: company.entity_id || event.entity_id || null,
            client_no: company.client_no || '',
            uen_no: company.uen_no || '',
            fbrn_reg_no: company.fbrn_reg_no || '',
            event_name: eventMaster.event_name || event.event_slug || '',
            event_slug: event.event_slug || eventMaster.event_slug || '',
            event_due_date: event.due_date || null,
            reminder_subject: stripHtml(value.subject_snapshot || reminder.subject || ''),
            timing_type: reminder.timing_type || '',
            offset_days: reminder.offset_days ?? null,
            to_recipients: jsonPayload(deliverySummary.to_recipients || deliveryDetails.to_recipients, []),
            cc_recipients: jsonPayload(deliverySummary.cc_recipients || deliveryDetails.cc_recipients, []),
            bcc_recipients: jsonPayload(deliverySummary.bcc_recipients || deliveryDetails.bcc_recipients, []),
            to_count: Number(counts.to_count || 0),
            cc_count: Number(counts.cc_count || 0),
            bcc_count: Number(counts.bcc_count || 0),
            recipient_count: Number(counts.recipient_count || 0),
            sent_count: Number(counts.sent_count || 0),
            failed_count: Number(counts.failed_count || 0),
            skipped_count: Number(counts.skipped_count || 0),
            invalid_count: Number(counts.invalid_count || 0),
            accepted_recipients: jsonPayload(deliverySummary.accepted_recipients || deliveryDetails.accepted_recipients, []),
            rejected_recipients: jsonPayload(deliverySummary.rejected_recipients || deliveryDetails.rejected_recipients, []),
            invalid_recipients: jsonPayload(deliverySummary.invalid_recipients || deliveryDetails.invalid_recipients, []),
            recipient_results: jsonPayload(deliverySummary.recipient_results || deliveryDetails.recipient_results, []),
            delivery_summary: deliverySummary,
            delivery_details: deliveryDetails,
            message_id: deliverySummary.message_id || deliveryDetails.message_id || '',
            provider_response: deliverySummary.provider_response || deliveryDetails.provider_response || '',
            summary_message: deliverySummary.summary_message || deliveryDetails.summary_message || '',
            user_message: deliverySummary.user_message || deliverySummary.summary_message || deliveryDetails.user_message || deliveryDetails.summary_message || '',
            technical_message: deliverySummary.technical_message || deliveryDetails.technical_message || '',
        };
    }

    getReminderLogs = async (query = {}) => {
        try {
            const models = getCurrentModels();
            if (!models.company_event_reminder_log) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Reminder log model is unavailable');
            }

            const where = {};
            if (query.status) where.status = String(query.status).toUpperCase();
            if (query.company_event_id) where.company_event_id = Number(query.company_event_id);
            if (query.reminder_id) where.reminder_id = Number(query.reminder_id);
            const eventWhere = {};
            if (query.entity_id || query.company_id) {
                eventWhere.entity_id = Number(query.entity_id || query.company_id);
            }
            if (query.scheduled_from || query.scheduled_to) {
                where.scheduled_date = {};
                if (query.scheduled_from) where.scheduled_date[Op.gte] = query.scheduled_from;
                if (query.scheduled_to) where.scheduled_date[Op.lte] = query.scheduled_to;
            }

            const page = Math.max(parseInt(query.page || 1, 10), 1);
            const limit = Math.max(parseInt(query.limit || 25, 10), 1);
            const offset = (page - 1) * limit;

            const result = await this.reminderLogDao.findAndCountAll({
                where,
                include: this._reminderLogInclude(models, Object.keys(eventWhere).length ? eventWhere : null),
                order: [['scheduled_date', 'DESC'], ['log_id', 'DESC']],
                limit,
                offset,
            });

            const rows = result.rows.map(row => this._toReminderLogResponse(row));
            const paginationData = responseHandler.getPaginationData({ count: result.count, rows }, page, limit);

            return responseHandler.returnSuccess(httpStatus.OK, 'Reminder logs fetched', paginationData);
        } catch (err) {
            logger.error('Get reminder logs error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching reminder logs');
        }
    };

    // ── Reminder-to-event matching & scheduling (used by the sendDueReminders cron) ──

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

    _addressByType(entity = {}, type = '') {
        const addresses = Array.isArray(entity.addresses) ? entity.addresses.map(row => this._row(row)) : [];
        const normalizedType = String(type || '').toUpperCase();
        return addresses.find(address => String(address.address_type || '').toUpperCase() === normalizedType)
            || (normalizedType === 'REGISTERED' ? addresses.find(address => address.is_primary) : null)
            || null;
    }

    _companyRegistrationNumber(entity = {}) {
        return entity.uen_no
            || entity.fbrn_reg_no
            || entity.acra_no
            || entity.uf_no
            || entity.domes_bus_no
            || '';
    }

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

    // Duplicated from CompanyEventService by design — see file header comment.
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
            const plain = this._row(row);
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
            const plain = this._row(row);
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
                return { ...row, email };
            }

            return { ...row, email: String(row?.email || '').trim() };
        });

        return {
            to: toEmailList(resolvedRows.filter(row => String(row?.channel || '').toUpperCase() === 'TO')),
            cc: toEmailList(resolvedRows.filter(row => String(row?.channel || '').toUpperCase() === 'CC')),
            bcc: toEmailList(resolvedRows.filter(row => String(row?.channel || '').toUpperCase() === 'BCC')),
        };
    }

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

        const configRow = this._row(row) || {};
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

}

module.exports = ReminderService;
