const httpStatus = require('http-status');

const { Op } = require('sequelize');

const CompanyEventNameDao =
    require('../../dao/masterSettings/CompanyEventNameDao');

const generateUniqueSlug =
    require('../../helper/generateUniqueSlug');

const responseHandler =
    require('../../helper/responseHandler');

const logger = require('../../config/logger');

const {
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
} = require('../../helper/searchHelper');

const SEARCH_FIELDS = [
    'event_type',
    'event_name',
    'event_slug',
    'event_subject',
];

const FILTER_FIELDS = [
    'event_type',
    'is_system_event',
    'is_recurring',
    'category',
    'authority_type',
    'active',
];

const DEFAULT_FREQUENCIES = ['ONE_TIME', 'ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'AD_HOC'];

const normalizeEventType = (value) => {
    if (value === undefined || value === null || value === '') return 'EVENT';
    if (typeof value === 'number') return [0, 2].includes(value) ? 'LOG' : 'EVENT';

    const text = String(value).trim().toLowerCase();
    if (['0', '2', 'log'].includes(text)) return 'LOG';
    return 'EVENT';
};

const eventTypeLabel = value => (normalizeEventType(value) === 'LOG' ? 'Log' : 'Event');

const toBoolean = value => {
    if (typeof value === 'boolean') return value;
    if (value === undefined || value === null || value === '') return false;
    return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toOptionalBoolean = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    return toBoolean(value);
};

const normalizeDefaultFrequency = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const text = String(value).trim().toUpperCase();
    return DEFAULT_FREQUENCIES.includes(text) ? text : null;
};

class CompanyEventNameService {

    constructor() {

        this.companyEventNameDao =
            new CompanyEventNameDao();

    }

    _toResponse(row) {
        const value = row?.toJSON ? row.toJSON() : row;
        if (!value) return value;

        return {
            ...value,
            event_type: normalizeEventType(value.event_type),
            event_type_label: eventTypeLabel(value.event_type),
            is_system_event: Boolean(value.is_system_event),
            is_system_event_label: value.is_system_event ? 'Yes' : 'No',
            is_recurring: Boolean(value.is_recurring),
            is_recurring_label: value.is_recurring ? 'Yes' : 'No',
        };
    }

    _normalizeRecurringPayload(body = {}) {
        const isRecurring = toBoolean(body.is_recurring);
        body.is_recurring = isRecurring;
        body.recurring_period = isRecurring ? Number(body.recurring_period || 1) : 0;
        body.recurring_duration = isRecurring ? (body.recurring_duration || 'Days') : '';
        return body;
    }

    // Compliance master catalogue fields (spec §4.1)
    _normalizeCompliancePayload(body = {}) {
        body.category = body.category ? String(body.category).trim() : null;
        body.authority_type = body.authority_type ? String(body.authority_type).trim() : null;
        body.default_frequency = normalizeDefaultFrequency(body.default_frequency);
        body.supports_extension = toOptionalBoolean(body.supports_extension, false);
        body.supports_waiver = toOptionalBoolean(body.supports_waiver, false);
        body.evidence_required = toOptionalBoolean(body.evidence_required, false);
        body.active = toOptionalBoolean(body.active, true);
        return body;
    }

    async _checkExists(id) {

        return await this.companyEventNameDao
            .findOneByWhere({
                e_id: id,
                is_deleted: false,
            });

    }

    create = async (body) => {
        try {

            const existing =
                await this.companyEventNameDao
                    .findOneByWhere({
                        event_name:
                            body.event_name,
                        event_type:
                            normalizeEventType(body.event_type),
                        is_deleted: false,
                    });

            if (existing) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company event name already exists'
                );

            }

            body.is_deleted = false;
            body.event_type = normalizeEventType(body.event_type);
            body.is_system_event = false;
            this._normalizeRecurringPayload(body);
            this._normalizeCompliancePayload(body);

            body.created_date = new Date();
            body.created_by = body.created_by || null;
            body.updated_date = new Date();

            body.event_slug = await generateUniqueSlug(
                this.companyEventNameDao.Model,
                body.event_name,
                'event_slug',
                'e_id'
            );

            const data =
                await this.companyEventNameDao
                    .create(body);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company event name created successfully',
                this._toResponse(data)
            );

        } catch (err) {

            logger.error(
                'Create company event name error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error creating company event name'
            );

        }
    };

    list = async (query) => {
        try {

            const normalizedQuery = {
                ...query,
                ...(query.event_type !== undefined ? { event_type: normalizeEventType(query.event_type) } : {}),
                ...(query.is_system_event !== undefined ? {
                    is_system_event: ['true', '1', 'yes'].includes(String(query.is_system_event).toLowerCase()),
                } : {}),
                ...(query.is_recurring !== undefined ? {
                    is_recurring: ['true', '1', 'yes'].includes(String(query.is_recurring).toLowerCase()),
                } : {}),
            };

            const where =
                buildCompleteWhere({
                    query: normalizedQuery,
                    searchFields: SEARCH_FIELDS,
                    filterFields: FILTER_FIELDS,
                    baseWhere: {
                        is_deleted: false
                    },
                });

            const { page, limit, offset } =
                getPaginationParams(query, 10);

            const order =
                buildOrderClause(
                    query.order,
                    [['e_id', 'DESC']]
                );

            const result =
                await this.companyEventNameDao
                    .findAndCountAll({
                        where,
                        limit,
                        offset,
                        order,
                    });

            if (result.count === 0) {

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'No company event names found',
                    {
                        totalItems: 0,
                        data: [],
                        totalPages: 0,
                        currentPage: page,
                    }
                );

            }

            const rows = result.rows.map(row => this._toResponse(row));
            const paginationData =
                responseHandler.getPaginationData(
                    { count: result.count, rows },
                    page,
                    limit
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company event name list fetched successfully',
                paginationData
            );

        } catch (err) {

            logger.error(
                'List company event name error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching company event name list'
            );

        }
    };

    get = async (id) => {
        try {

            const data =
                await this._checkExists(id);

            if (!data) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company event name not found'
                );

            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company event name fetched successfully',
                this._toResponse(data)
            );

        } catch (err) {

            logger.error(
                'Get company event name error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error fetching company event name'
            );

        }
    };

    update = async (id, body) => {
        try {

            const oldData =
                await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company event name not found'
                );

            }

            const exists =
                await this.companyEventNameDao
                    .findOneByWhere({
                        event_name:
                            body.event_name,
                        event_type:
                            normalizeEventType(body.event_type),
                        is_deleted: false,
                        e_id: {
                            [Op.ne]: id
                        }
                    });

            if (exists) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company event name already exists'
                );

            }

            if (
                body.event_name &&
                body.event_name !== oldData.event_name
            ) {
                body.event_slug = await generateUniqueSlug(
                    this.companyEventNameDao.Model,
                    body.event_name,
                    'event_slug',
                    'e_id',
                    id
                );
            } else if (!oldData.event_slug && body.event_name) {
                body.event_slug = await generateUniqueSlug(
                    this.companyEventNameDao.Model,
                    body.event_name,
                    'event_slug',
                    'e_id',
                    id
                );
            }

            if (oldData.is_system_event) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'System event names cannot be updated'
                );
            }

            body.event_type = normalizeEventType(body.event_type);
            this._normalizeRecurringPayload(body);
            this._normalizeCompliancePayload(body);

            await this.companyEventNameDao
                .updateWhere(
                    {
                        ...body,
                        updated_date: new Date(),
                    },
                    {
                        e_id: id
                    }
                );

            const updatedData =
                await this.companyEventNameDao
                    .findOneByWhere({
                        e_id: id,
                    });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company event name updated successfully',
                this._toResponse(updatedData)
            );

        } catch (err) {

            logger.error(
                'Update company event name error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error updating company event name'
            );

        }
    };

    delete = async (id) => {
        try {

            const oldData =
                await this._checkExists(id);

            if (!oldData) {

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company event name not found'
                );

            }

            if (oldData.is_system_event) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'System event names cannot be deleted'
                );
            }

            await this.companyEventNameDao
                .updateWhere(
                    {
                        is_deleted: true,
                        updated_date: new Date(),
                    },
                    {
                        e_id: id
                    }
                );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company event name deleted successfully'
            );

        } catch (err) {

            logger.error(
                'Delete company event name error:',
                err
            );

            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message ||
                'Error deleting company event name'
            );

        }
    };

}

module.exports = CompanyEventNameService;
