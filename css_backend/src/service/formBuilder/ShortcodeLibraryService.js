'use strict';

const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const {
    assertCanonicalKey,
    normalizeAliasKey,
    buildSemanticFingerprint,
} = require('../../domain/formBuilder/shortcodeDefinition');
const { registry: resolverRegistry } = require('../../config/formBuilder/shortcodeResolverRegistry');
const {
    dataFields,
    findDataField,
} = require('../../config/formBuilder/shortcodeDataFieldCatalog');
const {
    getCustomShortcodeHandler,
    listCustomShortcodeHandlers,
} = require('../../config/formBuilder/customShortcodeHandlers');

const SOURCE_DOMAINS = ['COMPANY', 'OFFICIAL', 'SHARE', 'EVENT', 'COMMON'];
const VALUE_TYPES = ['STRING', 'TEXT', 'BOOLEAN', 'INTEGER', 'DECIMAL', 'MONEY', 'DATE', 'DATETIME', 'EMAIL', 'ADDRESS', 'FILE_REFERENCE', 'JSON'];
const SENSITIVITIES = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];
const SELECTION_BEHAVIORS = ['NONE', 'ALL', 'SELECT_ONE', 'SELECT_MANY'];
const STATUSES = ['ACTIVE', 'DEPRECATED', 'RETIRED'];
const CUSTOM_RESOLVER_NAME = 'CUSTOM_BACKEND';

const uniqueAliases = (aliases, canonicalKey) => [...new Set(
    (Array.isArray(aliases) ? aliases : [])
        .map(normalizeAliasKey)
        .filter(alias => alias && alias !== canonicalKey)
)];

class ShortcodeLibraryService {
    _models = () => {
        const models = getCurrentModels();
        if (!models.form_shortcode_definition || !models.form_shortcode_alias) {
            throw new Error('Shortcode registry migration has not been applied');
        }
        return models;
    };

    _payload = (body, userId) => {
        const shortcodeKey = assertCanonicalKey(body.shortcode_key);
        const sourceDomain = String(body.source_domain || '').trim().toUpperCase();
        const isCustomBackend = body.is_custom_backend === true
            || body.is_custom_backend === 1
            || String(body.resolver_name || '').trim().toUpperCase() === CUSTOM_RESOLVER_NAME;
        let resolverName = String(body.resolver_name || '').trim().toUpperCase();
        let resolverPath = String(body.resolver_path || '').trim();
        let valueType = String(body.value_type || 'STRING').trim().toUpperCase();
        let isCollection = body.is_collection === true || body.is_collection === 1;

        if (isCustomBackend) {
            const handler = getCustomShortcodeHandler(shortcodeKey);
            resolverName = CUSTOM_RESOLVER_NAME;
            // Custom handlers are bound by the immutable shortcode key. The UI
            // never accepts an executable expression or arbitrary module path.
            resolverPath = shortcodeKey;
            valueType = handler?.valueType || valueType || 'STRING';
            if (handler) isCollection = Boolean(handler.isCollection);
        } else {
            const dataField = findDataField(sourceDomain, resolverName, resolverPath);
            if (!dataField) {
                throw new Error('Select a registered Data Field for the chosen Source Domain');
            }
            valueType = dataField.value_type;
        }

        return {
            shortcode_key: shortcodeKey,
            label: String(body.label || '').trim(),
            source_domain: sourceDomain,
            sort_order: Number(body.sort_order || 1),
            resolver_name: resolverName,
            resolver_path: resolverPath,
            value_type: valueType,
            is_collection: isCollection,
            sensitivity: String(body.sensitivity || 'INTERNAL').trim().toUpperCase(),
            description: body.description ? String(body.description).trim() : null,
            example_value: body.example_value == null ? null : String(body.example_value),
            allowed_formats: Array.isArray(body.allowed_formats) ? body.allowed_formats : [],
            selection_behavior: String(body.selection_behavior || 'NONE').trim().toUpperCase(),
            role_tags: Array.isArray(body.role_tags) ? body.role_tags : [],
            semantic_fingerprint: buildSemanticFingerprint({
                label: body.label,
                sourceDomain,
                resolverName,
                resolverPath,
                valueType,
                isCollection,
            }),
            status: String(body.status || 'ACTIVE').trim().toUpperCase(),
            is_deleted: false,
            updated_by: userId,
            updated_at: new Date(),
        };
    };

    _findCollisions = async (models, keys, excludeId, transaction) => {
        if (!keys.length) return [];
        const definitionWhere = {
            shortcode_key: { [Op.in]: keys },
            is_deleted: false,
        };
        if (excludeId) definitionWhere.shortcode_id = { [Op.ne]: excludeId };

        const [definitions, aliases] = await Promise.all([
            models.form_shortcode_definition.findAll({
                where: definitionWhere,
                attributes: ['shortcode_id', 'shortcode_key'],
                transaction,
            }),
            models.form_shortcode_alias.findAll({
                where: { alias_key: { [Op.in]: keys }, is_deleted: false },
                attributes: ['shortcode_id', 'alias_key'],
                transaction,
            }),
        ]);

        return [
            ...definitions.map(row => ({
                key: row.shortcode_key,
                kind: 'CANONICAL',
                shortcode_id: row.shortcode_id,
            })),
            ...aliases
                .filter(row => Number(row.shortcode_id) !== Number(excludeId))
                .map(row => ({
                    key: row.alias_key,
                    kind: 'ALIAS',
                    shortcode_id: row.shortcode_id,
                })),
        ];
    };

    meta = async () => {
        try {
            return responseHandler.returnSuccess(httpStatus.OK, 'Shortcode metadata fetched successfully', {
                resolver_registry: Object.fromEntries(
                    Object.entries(resolverRegistry).map(([name, paths]) => [name, [...paths]])
                ),
                data_fields: dataFields,
                custom_handlers: listCustomShortcodeHandlers(),
                source_domains: SOURCE_DOMAINS,
                value_types: VALUE_TYPES,
                sensitivities: SENSITIVITIES,
                selection_behaviors: SELECTION_BEHAVIORS,
                statuses: STATUSES,
            });
        } catch (error) {
            logger.error('Shortcode meta error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    list = async (query = {}) => {
        try {
            const models = this._models();
            const where = { is_deleted: false };
            if (query.status) where.status = String(query.status).toUpperCase();
            if (query.source_domain) where.source_domain = String(query.source_domain).toUpperCase();
            if (query.search) {
                where[Op.or] = [
                    { shortcode_key: { [Op.like]: `%${query.search}%` } },
                    { label: { [Op.like]: `%${query.search}%` } },
                ];
            }
            const rows = await models.form_shortcode_definition.findAll({
                where,
                include: [{
                    model: models.form_shortcode_alias,
                    as: 'aliases',
                    where: { is_deleted: false },
                    required: false,
                }],
                order: [['source_domain', 'ASC'], ['sort_order', 'ASC'], ['shortcode_key', 'ASC']],
            });
            return responseHandler.returnSuccess(httpStatus.OK, 'Shortcodes fetched successfully', rows);
        } catch (error) {
            logger.error('List shortcodes error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    get = async (id) => {
        try {
            const models = this._models();
            const row = await models.form_shortcode_definition.findOne({
                where: { shortcode_id: id, is_deleted: false },
                include: [{
                    model: models.form_shortcode_alias,
                    as: 'aliases',
                    where: { is_deleted: false },
                    required: false,
                }],
            });
            if (!row) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Shortcode not found');
            return responseHandler.returnSuccess(httpStatus.OK, 'Shortcode fetched successfully', row);
        } catch (error) {
            logger.error('Get shortcode error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    save = async (id, body = {}, userId = null) => {
        let models;
        try {
            models = this._models();
        } catch (error) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, error.message);
        }

        const transaction = await models.sequelize.transaction();
        try {
            const payload = this._payload(body, userId);
            const aliases = uniqueAliases(body.aliases, payload.shortcode_key);
            const keys = [payload.shortcode_key, ...aliases];
            const collisions = await this._findCollisions(models, keys, id, transaction);
            if (collisions.length) {
                await transaction.rollback();
                return responseHandler.returnError(
                    httpStatus.CONFLICT,
                    `Shortcode key or alias already exists: ${collisions.map(item => item.key).join(', ')}`
                );
            }

            let definition;
            if (id) {
                definition = await models.form_shortcode_definition.findOne({
                    where: { shortcode_id: id, is_deleted: false },
                    transaction,
                });
                if (!definition) {
                    await transaction.rollback();
                    return responseHandler.returnError(httpStatus.NOT_FOUND, 'Shortcode not found');
                }
                await definition.update(payload, { transaction });
            } else {
                definition = await models.form_shortcode_definition.create({
                    ...payload,
                    created_by: userId,
                    created_at: new Date(),
                }, { transaction });
            }

            const existingAliases = await models.form_shortcode_alias.findAll({
                where: { shortcode_id: definition.shortcode_id },
                transaction,
            });
            const existingByKey = new Map(existingAliases.map(row => [row.alias_key, row]));
            for (const row of existingAliases) {
                await row.update({ is_deleted: !aliases.includes(row.alias_key) }, { transaction });
            }
            for (const alias of aliases) {
                const existing = existingByKey.get(alias);
                if (existing) {
                    await existing.update({ is_deleted: false }, { transaction });
                } else {
                    await models.form_shortcode_alias.create({
                        shortcode_id: definition.shortcode_id,
                        alias_key: alias,
                        is_deleted: false,
                        created_by: userId,
                        created_at: new Date(),
                    }, { transaction });
                }
            }

            const semanticMatches = await models.form_shortcode_definition.findAll({
                where: {
                    semantic_fingerprint: payload.semantic_fingerprint,
                    shortcode_id: { [Op.ne]: definition.shortcode_id },
                    is_deleted: false,
                },
                attributes: ['shortcode_id', 'shortcode_key', 'label'],
                transaction,
            });
            await transaction.commit();

            return responseHandler.returnSuccess(
                id ? httpStatus.OK : httpStatus.CREATED,
                id ? 'Shortcode updated successfully' : 'Shortcode created successfully',
                {
                    shortcode_id: definition.shortcode_id,
                    shortcode_key: payload.shortcode_key,
                    aliases,
                    possible_semantic_duplicates: semanticMatches,
                }
            );
        } catch (error) {
            await transaction.rollback();
            logger.error('Save shortcode error:', error);
            const invalidRequest = error.message?.includes('lowercase dotted key')
                || error.message?.includes('registered Data Field');
            return responseHandler.returnError(
                invalidRequest ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR,
                error.message || 'Error saving shortcode'
            );
        }
    };

    retire = async (id, userId = null) => {
        try {
            const models = this._models();
            const row = await models.form_shortcode_definition.findOne({
                where: { shortcode_id: id, is_deleted: false },
            });
            if (!row) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Shortcode not found');
            await row.update({ status: 'RETIRED', updated_by: userId, updated_at: new Date() });
            return responseHandler.returnSuccess(httpStatus.OK, 'Shortcode retired successfully');
        } catch (error) {
            logger.error('Retire shortcode error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };
}

ShortcodeLibraryService.uniqueAliases = uniqueAliases;

module.exports = ShortcodeLibraryService;
