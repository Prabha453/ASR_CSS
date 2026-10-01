'use strict';

const httpStatus = require('http-status');
const { Op }     = require('sequelize');

const FormDao           = require('../../dao/formBuilder/FormDao');
const DocumentStoreDaos = require('../../dao/DocumentStoreDao');
const TemplateCategoryDao = require('../../dao/masterSettings/TemplateCategoryDao');
const UserDao             = require('../../dao/UserDao');

const responseHandler = require('../../helper/responseHandler');
const logger          = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const { getCurrentModels, getSequelizeForDb } = require('../../models');

const config = require('../../config/config');

const table                = require('../../helper/dbTable');

const { uploadDocument } = require('../../helper/documentHelper');

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers  (module-level, no `this` needed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a value that may arrive as a single primitive OR an array.
 *
 * category_id     → [9, 7]  → stored as "9,7"   (mirrors PHP implode)
 * assigned_user_id → [1]    → stored as "1"
 *
 * If the value is already a string/number it is returned as-is.
 */
const toCommaSeparated = (val) => {
    if (val === null || val === undefined) return null;
    if (Array.isArray(val)) return val.join(',');
    return String(val);
};

/**
 * Serialises the popup_fields array into the section_N keyed object that
 * mirrors the old PHP tbl_company_form_pop_up structure.
 *
 * Incoming payload:
 *   popup_fields: [
 *     {
 *       section_name: "ssssss",
 *       rows: [
 *         { pop_up_field_id: 3, popup_fields: "63",
 *           pop_up_temp_param: "38", pop_up_field_label_name: "..." },
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 *
 * Stored shape (JSON-serialised):
 *   {
 *     section_0: [
 *       { section_name, pop_up_field_id, pop_up_field_type,
 *         pop_up_temp_param, pop_up_field_label_name },
 *       ...
 *     ],
 *     section_1: [ ... ]
 *   }
 *
 * NOTE: the row key "popup_fields" (frontend) is saved as "pop_up_field_type"
 *       internally to stay consistent with the old PHP column name.
 */
// A section name equal to its own storage key ("section_0") means "no name".
const cleanSectionName = (value) => {
    const name = String(value ?? '').trim();
    return /^section_\d+$/i.test(name) ? '' : name;
};

const buildPopupFields = (popupFields = []) => {
    if (!Array.isArray(popupFields)) return {};

    const result = {};

    popupFields.forEach((section, idx) => {
        result[`section_${idx}`] = (section.rows || []).map((row) => ({
            section_name:            cleanSectionName(section.section_name),
            pop_up_field_id:         row.pop_up_field_id         ?? '',
            pop_up_field_type:       row.pop_up_field_type            ?? '',   // frontend → internal
            pop_up_temp_param:       row.pop_up_temp_param       ?? '',
            pop_up_field_label_name: row.pop_up_field_label_name ?? '',
            form_pop_up_field_slug: row.form_pop_up_field_slug ?? '',
            child_of:                row.child_of               ?? '',
            control_type:            row.control_type            ?? '',
            value_source:            row.value_source            ?? '',
            required:                row.required === true,
            multiple:                row.multiple === true,
            depends_on:              Array.isArray(row.depends_on) ? row.depends_on : [],
            transaction_types:       Array.isArray(row.transaction_types) ? row.transaction_types : [],
            official_roles:          Array.isArray(row.official_roles) ? row.official_roles : [],
            official_statuses:       Array.isArray(row.official_statuses) ? row.official_statuses : [],
            source_filter_1:         row.source_filter_1         ?? 'all',
            source_filter_2:         row.source_filter_2         ?? 'all',
            source_filter_3:         row.source_filter_3         ?? 'all',
            // SHARES only: shareholder entity type (officials.official_type),
            // comma-joined — e.g. "COMPANY,INDIVIDUAL". Ignored by every other
            // data source, same as source_filter_1..3 already are.
            source_filter_4:         row.source_filter_4         ?? 'all',
            option_label_fields:     Array.isArray(row.option_label_fields) ? row.option_label_fields : [],
        }));
    });

    return result;
};

/**
 * Deserialises the stored JSON back to the popup_fields shape the
 * frontend expects.
 */
const deserializePopupFields = (raw) => {
    if (!raw) return [];
    try {
        // Handle double-encoded JSON: DB JSON column may return a string
        // that is itself a JSON string (stored via JSON.stringify twice)
        let parsed = raw;
        while (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            console.warn('[deserializePopupFields] unexpected shape:', parsed);
            return [];
        }

        const popUpFields = Object.keys(parsed)
            .sort()                          // section_0, section_1, …
            .map((key) => {
                const rows = parsed[key] || [];
                return {
                    _id: Math.floor(10000000 + Math.random() * 90000000),
                    section_name: cleanSectionName(rows[0]?.section_name),
                    rows: rows.map((r) => {
                        const random8Digit = Math.floor(10000000 + Math.random() * 90000000);

                        return {
                            _rid: random8Digit,
                            pop_up_field_id: r.pop_up_field_id ?? '',
                            pop_up_field_type: r.pop_up_field_type ?? '',
                            pop_up_temp_param: r.pop_up_temp_param ?? '',
                            pop_up_field_label_name: r.pop_up_field_label_name ?? '',
                            form_pop_up_field_slug: r.form_pop_up_field_slug ?? '',
                            child_of: r.child_of ?? '',
                            control_type: r.control_type ?? '',
                            value_source: r.value_source ?? '',
                            required: r.required === true,
                            multiple: r.multiple === true,
                            depends_on: Array.isArray(r.depends_on) ? r.depends_on : [],
                            transaction_types: Array.isArray(r.transaction_types) ? r.transaction_types : [],
                            official_roles: Array.isArray(r.official_roles) ? r.official_roles : [],
                            official_statuses: Array.isArray(r.official_statuses) ? r.official_statuses : [],
                            source_filter_1: r.source_filter_1 ?? 'all',
                            source_filter_2: r.source_filter_2 ?? 'all',
                            source_filter_3: r.source_filter_3 ?? 'all',
                            source_filter_4: r.source_filter_4 ?? 'all',
                            option_label_fields: Array.isArray(r.option_label_fields) ? r.option_label_fields : [],
                        };
                    }),
                };
            });

        console.log('[deserializePopupFields] result:', popUpFields);
        return popUpFields;

    } catch (err) {
        console.error('[deserializePopupFields] parse error:', err.message, 'raw:', raw);
        return [];
    }
};

/**
 * Generates a template-id string  (mirrors PHP generate_templateId).
 */
const generateTemplateId = (insertId) => {
    const ts = Date.now().toString().slice(-6);
    return `TPL-${ts}-${String(insertId).padStart(6, '0')}`;
};

/**
 * Maps the new flat payload → DB column names.
 *
 * Payload key          DB column            Notes
 * ─────────────────── ─────────────────────────────────────────────────────
 * category_id          category_id          array → "9,7"
 * assigned_user_id     assigned_user_id     array → "1"
 * form_name            form_name
 * orientation          orientation
 * margin_top/…         margin_top/…
 * header_margin        header_margin
 * footer_margin        footer_margin
 * country_code         country_code
 * default_library      default_library
 * form_type            form_type
 * pdpa_required        pdpa_required        "1"/true → 1
 * form_content         form_content
 * popup_fields         popup_fields         serialised JSON
 * make_esign_copy      —                    handled separately, not stored
 * save_type            —                    handled separately, not stored
 * Audit columns are populated only from the authenticated actor supplied by
 * the controller. Client-provided created_by/updated_by values are ignored.
 */
const buildSaveRecord = (body, userId) => ({
    // ── identifiers / assignment ──────────────────────────────────────────
    category_id:      toCommaSeparated(body.category_id)      || null,
    assigned_user_id: toCommaSeparated(body.assigned_user_id) || null,

    // ── name ──────────────────────────────────────────────────────────────
    form_name:        (body.form_name || '').trim(),
    download_name :   (body.download_name || '').trim(),
    // ── layout ────────────────────────────────────────────────────────────
    orientation:      body.orientation   || null,
    margin_top:       body.margin_top    ?? null,
    margin_right:     body.margin_right  ?? null,
    margin_bottom:    body.margin_bottom ?? null,
    margin_left:      body.margin_left   ?? null,
    header_margin:    body.header_margin ?? null,
    footer_margin:    body.footer_margin ?? null,

    // ── metadata ──────────────────────────────────────────────────────────
    country_code:     body.country_code    || null,
    default_library:  body.default_library || null,
    status:           (body.status === '1' || body.status === true || body.status === 1) ? 1 : 0,
    form_type:        body.form_type != null ? Number(body.form_type) : 0,

    // ── flags ─────────────────────────────────────────────────────────────
    pdpa_required:    (body.pdpa_required === '1' || body.pdpa_required === true || body.pdpa_required === 1) ? 1 : 0,

    // ── content ───────────────────────────────────────────────────────────
    form_content:     body.form_content || '',

    // ── popup sections (JSON-serialised) ──────────────────────────────────
    popup_fields: JSON.stringify(buildPopupFields(body.popup_fields || [])),

    // ── audit ─────────────────────────────────────────────────────────────
    created_by: userId,
    updated_by: userId,
    updated_at:       new Date(),
});

/** Normalises a document_store row for API responses. */
const mapDoc = (d) => ({
    doc_id:          d.doc_id,
    sub_module_name: d.sub_module_name,
    doc_name:        d.doc_name,
    file_path:       d.cdn_url || d.file_path || null,
    created_at:      d.created_at,
});

// ─────────────────────────────────────────────────────────────────────────────

const SEARCH_FIELDS = ['form_name', 'form_slug', 'download_name'];

// ─────────────────────────────────────────────────────────────────────────────

class FormService {

    constructor() {
        this.formDao          = new FormDao();
        this.documentStoreDao     = new DocumentStoreDaos();
        this.templateCategoryDao  = new TemplateCategoryDao();
        this.userDao              = new UserDao();
    }

    // ── internal helpers ─────────────────────────────────────────────────────

    async _checkExists(id) {
        return this.formDao.findOneByWhere({ form_id: id, is_deleted: false });
    }

    async _resolvePort(portName) {
        if (!portName) throw new Error('portName is required');

        try {
            const db = await getSequelizeForDb(config.portDbName);
            if (!db) {
                logger.error(`[_resolvePort] Failed to connect db port="${portName}"`);
            }

            const [results] = await db.sequelize.query(
                'SELECT port_number, port_db FROM ports WHERE port_db = ? LIMIT 1',
                { replacements: [portName] }
            );

            if (!results || results.length === 0) {
                throw new Error(`Port not found for portName: "${portName}"`);
            }

            return {
                port_number: results[0].port_number,
                port_name:   results[0].port_db,
            };
        } catch (err) {
            logger.error(`[_resolvePort] Failed to resolve portName="${portName}":`, err.message);
            throw err;
        }
    }


    generateSlug = async (formName, excludeId = null) => {
        let slug = formName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const baseSlug = slug;
        let counter    = 1;

        while (true) {
            const where = { form_slug: slug, is_deleted: false };
            if (excludeId) where.form_id = { [Op.ne]: excludeId };

            const exists = await this.formDao.findOneByWhere(where);
            if (!exists) return slug;

            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Document upload  (module=formbuilder, sub_module=manual_form | forms)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Upload a single file attachment for a form.
     *
     * sub_module_name:
     *   'manual_form'  → formbuilder context  (default)
     *   'forms'        → company-file context  (body.redirect === 'forms')
     */
    async uploadFormDocument(file, formId, userId, options = {}) {
        try {
            const doc = await uploadDocument({
                file,
                userId,
                port_number:      options.port_number     || null,
                port_name:        options.port_name       || null,
                entity_id:        formId,
                entity_type:      'form',
                module_name:      'formbuilder',
                sub_module_name:  options.sub_module_name || 'manual_form',
                module_record_id: formId,
                doc_category:     options.doc_category    || 'form_attachment',
                doc_name:         file.originalname       || file.fieldname,
                sub_folder:       options.sub_folder      || `formbuilder/manual_form/${formId}`,
                replace_existing: options.replace_existing ?? false,
                delete_old_file:  options.delete_old_file  ?? false,
                req:              options.req             || null,
            });
            return doc || null;
        } catch (err) {
            logger.error(`[FormService] uploadFormDocument failed form_id=${formId}:`, err.message);
            return null;
        }
    }

    /**
     * Iterates multer files and uploads each one.
     * sub_module_name is 'forms' when body.redirect === 'forms',
     * otherwise 'manual_form'  (mirrors PHP uri->segment(4) == 'forms' check).
     */
    async _processFormFiles(files, formId, userId, portId, portName, req) {
        const subModule = 'manual_form';

        for (const file of files) {
            await this.uploadFormDocument(file, formId, userId, {
                sub_module_name:  subModule,
                doc_category:     'form_attachment',
                sub_folder:       `formbuilder/${subModule}`,
                replace_existing: false,
                delete_old_file:  false,
                port_number:      portId,
                port_name:        portName,
                req,
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Esign copy  (mirrors PHP make_esign_copy block)
    // ─────────────────────────────────────────────────────────────────────────

    async _createEsignCopy(baseRecord, sourceFormId, userId) {
        try {
            const sourceForm = await this.formDao.findOneByWhere({ form_id: sourceFormId });
            const baseName   = sourceForm?.form_name || baseRecord.form_name || '';

            // Count existing esign copies to derive suffix  (PHP: Esign | Esign1 | Esign2 …)
            const esignCount = await this.formDao.getCountByWhere({
                form_name:  { [Op.like]: `%${baseName} Esign%` },
                is_deleted: false,
            });
            const esignSuffix = esignCount > 0 ? `Esign${esignCount}` : 'Esign';
            const esignName   = `${baseName} ${esignSuffix}`;

            const esignRecord = {
                ...baseRecord,
                form_id:    null,   // force INSERT
                form_name:  esignName,
                form_slug:  await this.generateSlug(esignName),
                form_type:  1,      // esign
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            };
            delete esignRecord.template_id;

            const esignRow   = await this.formDao.create(esignRecord);
            const templateId = generateTemplateId(esignRow.form_id);
            await this.formDao.updateWhere({ template_id: templateId }, { form_id: esignRow.form_id });

            logger.info(`[FormService] Esign copy created: id=${esignRow.form_id} name="${esignName}"`);
            return esignRow;
        } catch (err) {
            // Non-fatal — mirrors PHP behaviour (it never rolled back on esign failure)
            logger.error('[FormService] _createEsignCopy failed:', err.message);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAVE  (new + update + save_as + duplicate_form + move_to_live)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Single entry-point that mirrors the entire PHP form() save branch.
     *
     * save_type    behaviour
     * ──────────── ───────────────────────────────────────────────────────────
     * 'save'       INSERT when id is null, UPDATE when id is provided
     * 'save_as'    INSERT a V-N version linked via save_us_id to the original
     * 'duplicate'  INSERT a "Duplicate-N" copy
     * 'move_to_live' no-op (reserved, same as PHP)
     */
    save = async (id = null, body = {}, files = [], userId = null, req = null) => {
        try {
            const saveType = body.save_type || 'save';

            // Verify existing record when an id is supplied
            let formData = null;
            if (id) {
                formData = await this._checkExists(id);
                if (!formData) {
                    return responseHandler.returnError(
                        httpStatus.BAD_REQUEST,
                        'Form not found'
                    );
                }
            }

            const save = buildSaveRecord(body, userId);
            let insertId = null;

            // ── save_as → versioned copy  ────────────────────────────────
            if (saveType === 'save_as') {
                const originId = (formData.save_us_id == 0)
                    ? id
                    : formData.save_us_id;

                const versionCount  = await this.formDao.getCountByWhere({ save_us_id: originId, is_deleted: false });
                const versionSuffix = `V-${versionCount + 1}`;

                Object.assign(save, {
                    form_id:      null,
                    save_us_id:   originId,
                    old_form_id:  formData.form_id,
                    save_us_name: versionSuffix,
                    form_name:    `${body.form_name} ${versionSuffix}`,
                    form_slug:    await this.generateSlug(`${body.form_name}-${versionSuffix}`),
                    is_deleted:   false,
                    created_at:   new Date(),
                });

                const row    = await this.formDao.create(save);
                insertId     = row.form_id;
                await this.formDao.updateWhere(
                    { template_id: generateTemplateId(insertId) },
                    { form_id: insertId }
                );

            // ── duplicate_form → standalone duplicate  ───────────────────
            } else if (saveType === 'duplicate_form') {
                const originId = (formData.save_us_id == 0)
                    ? id
                    : formData.save_us_id;

                const dupCount = await this.formDao.getCountByWhere({ form_name: body.form_name, is_deleted: false });

                Object.assign(save, {
                    form_id:      null,
                    save_us_id:   originId,
                    old_form_id:  formData.form_id,
                    save_us_name: '',
                    form_name:    `${body.form_name} Duplicate-${dupCount}`,
                    form_slug:    await this.generateSlug(body.form_name),
                    is_deleted:   false,
                    created_at:   new Date(),
                });

                const row    = await this.formDao.create(save);
                insertId     = row.form_id;
                await this.formDao.updateWhere(
                    { template_id: generateTemplateId(insertId) },
                    { form_id: insertId }
                );

            // ── move_to_live → reserved no-op  ──────────────────────────
            } else if (saveType === 'move_to_live') {
                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'Move to live acknowledged (no action taken)',
                    { form_id: id }
                );

            // ── save → insert or update  ─────────────────────────────────
            } else {
                if (id) {
                    // UPDATE
                    save.form_slug  = body.form_slug || await this.generateSlug(body.form_name, id);
                    save.updated_at = new Date();
                    await this.formDao.updateWhere(save, { form_id: id });
                    insertId = id;
                } else {
                    // INSERT
                    Object.assign(save, {
                        form_slug:  await this.generateSlug(body.form_name),
                        is_deleted: false,
                        created_by: userId,
                        created_at: new Date(),
                    });
                    const row = await this.formDao.create(save);
                    if (!row) throw new Error('Unable to create form. Ensure the latest database migration has been applied.');
                    insertId  = row.form_id;
                    await this.formDao.updateWhere(
                        { template_id: generateTemplateId(insertId) },
                        { form_id: insertId }
                    );
                }
            }

            // ── optional esign copy (any save_type)  ─────────────────────
            if (body.make_esign_copy && body.make_esign_copy !== '' && body.make_esign_copy !== false) {
                await this._createEsignCopy(save, insertId, userId);
            }

            const portName = body.port_name || null;
            let portId     = null;

            if (portName) {
                try {
                    const resolved = await this._resolvePort(portName);
                    portId = resolved.port_number;
                    logger.info(`[update] Resolved port: ${portName} → port_number=${portId}`);
                } catch (portErr) {
                    logger.warn(`[update] Could not resolve port "${portName}": ${portErr.message}`);
                }
            }

            // ── file uploads  ─────────────────────────────────────────────
            if (files && files.length > 0) {
                await this._processFormFiles(files, insertId, userId , portId, portName, req);

            }

            const message = id
                ? (saveType === 'save' ? 'Updated Successfully' : 'New version of document successfully created..')
                : 'Added Successfully';

            const result = await this.formDao.findOneByWhere({ form_id: insertId });

            return responseHandler.returnSuccess(httpStatus.OK, message, result);

        } catch (err) {
            logger.error('Save form error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error saving form'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LIST
    // ─────────────────────────────────────────────────────────────────────────

      list = async (query) => {
    try {
        const where = buildCompleteWhere({
            query,
            searchFields: SEARCH_FIELDS,
            filterFields: [
                'category_id',
                'status',
                'form_type',
                'country_code',
                'default_library',
                'pdpa_required',
                'orientation',
            ],
            baseWhere: { is_deleted: false },
        });

        const { page, limit, offset } = getPaginationParams(query, 10);

        const orderParam = query.sort
            ? `${query.sort}:${(query.order || 'desc').toUpperCase()}`
            : null;
        const order = buildOrderClause(orderParam, [['form_id', 'DESC']]);

        const formModel = this.formDao.Model;
        const countWhere = condition => ({ [Op.and]: [where, condition] });
        const [result, formBuilderCount, esignCount, pdpaCount] = await Promise.all([
            this.formDao.findAndCountAll({ where, limit, offset, order }),
            formModel.count({ where: countWhere({ form_type: 0 }) }),
            formModel.count({ where: countWhere({ form_type: 1 }) }),
            formModel.count({ where: countWhere({ pdpa_required: true }) }),
        ]);

        // ── Collect all unique category IDs and user IDs across all rows ──
        const allCategoryIds = new Set();
        const allUserIds     = new Set();

        for (const row of result.rows) {
            if (row.category_id) {
                String(row.category_id).split(',').map(Number).filter(Boolean).forEach(id => allCategoryIds.add(id));
            }
            if (row.assigned_user_id) {
                String(row.assigned_user_id).split(',').map(Number).filter(Boolean).forEach(id => allUserIds.add(id));
            }
        }

        // ── Batch-fetch categories and users ──────────────────────────────
        const [categories, users] = await Promise.all([
            allCategoryIds.size > 0
                ? this.templateCategoryDao.findByWhere({
                      tc_id:      { [Op.in]: [...allCategoryIds] },
                      is_deleted: false,
                  })
                : [],
            allUserIds.size > 0
                ? this.userDao.findByWhere({
                      user_id:    { [Op.in]: [...allUserIds] },
                      is_deleted: false,
                  })
                : [],
        ]);

        // ── Build lookup maps  id → name ──────────────────────────────────
        // KEY must match the PK used in the query above (tc_id / user_id)
        const categoryMap = Object.fromEntries(
            (categories || []).map(c => [c.tc_id, c.tc_name])
        );
        const userMap = Object.fromEntries(
            (users || []).map(u => [u.user_id, u.full_name ?? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()])
        );

        // ── Enrich each row ───────────────────────────────────────────────
        const enriched = result.rows.map(row => {
            const json = row.toJSON ? row.toJSON() : { ...row };

            // category_id may arrive as array (Sequelize getter) or raw "5,3,7" string
            const categoryIds = Array.isArray(json.category_id)
                ? json.category_id
                : (json.category_id ? String(json.category_id).split(',').map(Number).filter(Boolean) : []);

            const userIds = Array.isArray(json.assigned_user_id)
                ? json.assigned_user_id
                : (json.assigned_user_id ? String(json.assigned_user_id).split(',').map(Number).filter(Boolean) : []);

            return {
                ...json,
                category_id:         categoryIds,
                category_names:      categoryIds.map(id => categoryMap[id] ?? null).filter(Boolean).join(', '),
                assigned_user_id:    userIds,
                assigned_user_names: userIds.map(id => userMap[id]  ?? null).filter(Boolean).join(', '),
            };
        });

        const paginationData = responseHandler.getPaginationData(result, page, limit);

        return responseHandler.returnSuccess(
            httpStatus.OK,
            'Form list fetched successfully',
            {
                ...paginationData,
                data: enriched,
                counts: {
                    formBuilder: formBuilderCount,
                    esign: esignCount,
                    pdpa: pdpaCount,
                },
            }
        );
    } catch (err) {
        logger.error('List form error:', err);
        return responseHandler.returnError(
            httpStatus.INTERNAL_SERVER_ERROR,
            err.message || 'Error fetching forms'
        );
    }
};

    // ─────────────────────────────────────────────────────────────────────────
    // GET
    // ─────────────────────────────────────────────────────────────────────────

    get = async (id) => {
        try {
            const data = await this._checkExists(id);
            if (!data) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Form not found');
            }

            const docs = await this.documentStoreDao.findByWhere({
                module_record_id: id,
                entity_type:      'form',
                module_name:      'formbuilder',
                is_deleted:       false,
            });

            // Split stored comma-separated values back to arrays for the frontend
            const json = data.toJSON();

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Form fetched successfully',
                {
                    ...json,
                    form_type : String(json.form_type) || '0',
                    category_id:      json.category_id
                        ? String(json.category_id).split(',').map(Number)
                        : [],
                    assigned_user_id: json.assigned_user_id
                        ? String(json.assigned_user_id).split(',').map(Number)
                        : [],
                    popup_fields: deserializePopupFields(json.popup_fields),
                    documents:    (docs || []).map(mapDoc),
                }
            );
        } catch (err) {
            logger.error('Get form error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching form'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────

    delete = async (id) => {
        try {
            const oldData = await this._checkExists(id);
            if (!oldData) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Form not found');
            }
            await this.formDao.updateWhere(
                { is_deleted: true, updated_at: new Date() },
                { form_id: id }
            );
            return responseHandler.returnSuccess(httpStatus.OK, 'Form deleted successfully');
        } catch (err) {
            logger.error('Delete form error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting form'
            );
        }
    };
}

module.exports = FormService;
module.exports.buildPopupFields = buildPopupFields;
module.exports.deserializePopupFields = deserializePopupFields;
