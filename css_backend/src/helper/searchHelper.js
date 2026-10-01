const { Op } = require('sequelize');
const { decryptRow } = require('../utils/crypto');
/**
 * Build dynamic search where clause
 * @param {string} search - Search term
 * @param {Array<string>} fields - Fields to search in
 * @param {string} operator - Search operator ('like', 'equal', 'ilike')
 * @returns {Object} Sequelize where clause
 */
const buildSearchWhere = (search, fields = [], operator = 'like') => {
    if (!search || !fields || fields.length === 0) {
        return {};
    }

    const searchTerm = search.trim();

    if (!searchTerm) {
        return {};
    }

    // Build conditions based on operator
    const conditions = fields.map(field => {
        switch (operator) {
            case 'like':
                return { [field]: { [Op.like]: `%${searchTerm}%` } };
            
            case 'ilike': // Case-insensitive (PostgreSQL)
                return { [field]: { [Op.iLike]: `%${searchTerm}%` } };
            
            case 'equal':
                return { [field]: searchTerm };
            
            case 'startsWith':
                return { [field]: { [Op.like]: `${searchTerm}%` } };
            
            case 'endsWith':
                return { [field]: { [Op.like]: `%${searchTerm}` } };
            
            default:
                return { [field]: { [Op.like]: `%${searchTerm}%` } };
        }
    });

    return { [Op.or]: conditions };
};

/**
 * Build advanced search with multiple search terms and fields
 * @param {Object} searchParams - { field1: 'term1', field2: 'term2' }
 * @param {string} operator - Search operator
 * @returns {Object} Sequelize where clause
 */
const buildAdvancedSearch = (searchParams = {}, operator = 'like') => {
    const conditions = [];

    Object.entries(searchParams).forEach(([field, value]) => {
        if (value) {
            const searchTerm = value.trim();
            
            switch (operator) {
                case 'like':
                    conditions.push({ [field]: { [Op.like]: `%${searchTerm}%` } });
                    break;
                
                case 'equal':
                    conditions.push({ [field]: searchTerm });
                    break;
                
                case 'startsWith':
                    conditions.push({ [field]: { [Op.like]: `${searchTerm}%` } });
                    break;
                
                case 'endsWith':
                    conditions.push({ [field]: { [Op.like]: `%${searchTerm}` } });
                    break;
                
                default:
                    conditions.push({ [field]: { [Op.like]: `%${searchTerm}%` } });
            }
        }
    });

    return conditions.length > 0 ? { [Op.and]: conditions } : {};
};

/**
 * Build filter where clause from query params
 * @param {Object} query - Query parameters
 * @param {Array<string>} filterFields - Fields to filter
 * @param {Object} baseWhere - Base where clause (e.g., { is_deleted: 0 })
 * @returns {Object} Complete where clause
 */
const buildFilterWhere = (query = {}, filterFields = [], baseWhere = {}) => {
    const where = { ...baseWhere };

    // Apply exact match filters
    filterFields.forEach(field => {
        if (query[field] !== undefined && query[field] !== '') {
            where[field] = query[field];
        }
    });

    return where;
};

/**
 * Build date range where clause
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {string} dateField - Date field name (default: 'created_date')
 * @returns {Object} Date range where clause
 */
const buildDateRangeWhere = (startDate, endDate, dateField = 'created_date') => {
    if (!startDate || !endDate) {
        return {};
    }

    return {
        [dateField]: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        }
    };
};

/**
 * Build complete where clause with all filters
 * @param {Object} options - { query, searchFields, filterFields, baseWhere, dateField }
 * @returns {Object} Complete where clause
 */
const buildCompleteWhere = (options = {}) => {
    const {
        query = {},
        searchFields = [],
        filterFields = [],
        baseWhere = {},
        dateField = 'created_date',
        searchOperator = 'like'
    } = options;

    let where = { ...baseWhere };

    // Apply exact match filters
    where = { ...where, ...buildFilterWhere(query, filterFields, {}) };

    // Apply search
    if (query.search && searchFields.length > 0) {
        const searchWhere = buildSearchWhere(query.search, searchFields, searchOperator);
        where = { ...where, ...searchWhere };
    }

    // Apply date range
    if (query.start_date && query.end_date) {
        const dateWhere = buildDateRangeWhere(query.start_date, query.end_date, dateField);
        where = { ...where, ...dateWhere };
    }

    return where;
};

/**
 * Build order clause from query
 * @param {string|Array} orderParam - Order parameter (e.g., 'created_date:DESC' or [['id', 'ASC']])
 * @param {Array} defaultOrder - Default order (e.g., [['created_date', 'DESC']])
 * @returns {Array} Sequelize order clause
 */
const buildOrderClause = (orderParam, defaultOrder = [['created_date', 'DESC']]) => {
    if (!orderParam) {
        return defaultOrder;
    }

    // If already an array, return it
    if (Array.isArray(orderParam)) {
        return orderParam;
    }

    // Parse string format: 'field:direction'
    if (typeof orderParam === 'string') {
        const [field, direction = 'ASC'] = orderParam.split(':');
        return [[field, direction.toUpperCase()]];
    }

    return defaultOrder;
};

/**
 * Get pagination params from query
 * @param {Object} query - Query parameters
 * @param {number} defaultLimit - Default limit (default: 10)
 * @returns {Object} { page, limit, offset }
 */
const getPaginationParams = (query = {}, defaultLimit = 10) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || defaultLimit;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};


/**
 * Fetch records with support for encrypted field search + pagination
 *
 * For plain (non-encrypted) fields  → SQL LIKE handles search in DB
 * For encrypted fields              → fetch all → decrypt → JS .includes() filter → paginate
 *
 * @param {Object}   options
 * @param {Function} options.fetchAll          - () => DAO/Model.findAll(opts)         — for encrypted search (MODE B)
 * @param {Function} options.fetchPage         - () => DAO/Model.findAndCountAll(opts) — for no-search (MODE A)
 * @param {boolean}  options.hasSearch         - whether a search keyword is present
 * @param {string}   options.keyword           - lowercase trimmed search keyword
 * @param {Array}    options.encryptedFields   - fields to decrypt before JS filter  e.g. ['name']
 * @param {Array}    options.searchFields      - fields to match keyword against after decrypt e.g. ['name', 'client_no']
 * @param {number}   options.page
 * @param {number}   options.limit
 * @param {number}   options.offset
 *
 * @returns {Object} { totalItems, totalPages, currentPage, data }
 */

  const fetchWithEncryptedSearch = async ({
    fetchAll,
    fetchPage,
    hasSearch,
    keyword         = '',
    encryptedFields = [],
    searchFields    = [],
    page   = 1,
    limit  = 10,
    offset = 0,
}) => {
    // ── MODE A: no search → DB pagination, decrypt only current page ──────
    if (!hasSearch) {
        const result = await fetchPage();
        if (!result || result.count === 0) {
            return { totalItems: 0, totalPages: 0, currentPage: page, data: [] };
        }

        const data = result.rows.map(row => decryptRow(row, encryptedFields));

        return {
            totalItems:  result.count,
            totalPages:  Math.ceil(result.count / limit),
            currentPage: page,
            data,
        };
    }

    // ── MODE B: search → fetch ALL → decrypt → JS filter → paginate ───────
    const allRows = await fetchAll();

    if (!allRows || !allRows.length) {
        return { totalItems: 0, totalPages: 0, currentPage: page, data: [] };
    }

    const decrypted = allRows.map(row => decryptRow(row, encryptedFields));

    const kw = keyword.toLowerCase().trim();
    const filtered = decrypted.filter(row =>
        searchFields.some(field =>
            row[field] && String(row[field]).toLowerCase().includes(kw)
        )
    );

    if (!filtered.length) {
        return { totalItems: 0, totalPages: 0, currentPage: page, data: [] };
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginated  = filtered.slice(offset, offset + limit);

    return { totalItems, totalPages, currentPage: page, data: paginated };
};

module.exports = {
    buildSearchWhere,
    buildAdvancedSearch,
    buildFilterWhere,
    buildDateRangeWhere,
    buildCompleteWhere,
    buildOrderClause,
    getPaginationParams,
    fetchWithEncryptedSearch,
};