'use strict';

const { Op } = require('sequelize');

const toPlain = row => (row?.toJSON ? row.toJSON() : row);

const buildSubRoleNameBySlug = async (models) => {
    if (!models.official_master) return {};

    const rows = await models.official_master.findAll({
        attributes: ['official_master_name', 'official_master_slug'],
    });

    return rows.reduce((acc, row) => {
        const plain = toPlain(row);
        if (plain.official_master_slug) {
            acc[plain.official_master_slug] = plain.official_master_name;
        }
        return acc;
    }, {});
};

const buildPrimaryEmailByEntityId = async (models, entityIds = []) => {
    if (!models.entity_contact) return {};

    const ids = [...new Set((entityIds || []).map(Number).filter(Boolean))];
    if (!ids.length) return {};

    const rows = await models.entity_contact.findAll({
        attributes: ['entity_id', 'contact_value', 'is_primary'],
        where: {
            entity_id: { [Op.in]: ids },
            contact_type: 'EMAIL',
            is_deleted: false,
        },
        order: [['is_primary', 'DESC'], ['contact_id', 'ASC']],
    });

    return rows.reduce((acc, row) => {
        const plain = toPlain(row);
        if (!acc[plain.entity_id] && plain.contact_value) {
            acc[plain.entity_id] = plain.contact_value;
        }
        return acc;
    }, {});
};

const officialInclude = (models) => [
    ...(models.official_master ? [{
        model: models.official_master,
        as: 'official_master',
        required: false,
        attributes: ['official_master_id', 'official_master_name', 'official_master_slug'],
    }] : []),
    ...(models.entities ? [{
        model: models.entities,
        as: 'entity',
        required: false,
        attributes: ['entity_id', 'name', 'client_no', 'entity_type'],
    }, {
        model: models.entities,
        as: 'official_entity',
        required: false,
        attributes: ['entity_id', 'name', 'client_no', 'entity_type'],
    }] : []),
    ...(models.officials_date ? [{
        model: models.officials_date,
        as: 'date_records',
        required: false,
        where: { is_deleted: 0 },
        attributes: [
            'official_date_id',
            'official_id',
            'official_master_slug',
            'is_main_role',
            'appointment_date',
            'ceased_date',
            'is_appt_proposed',
            'is_ceased_proposed',
            'officials_appt_from',
            'officials_ceased_from',
            'remarks',
        ],
    }] : []),
];

const formatOfficialRecord = (row, subRoleNameBySlug = {}, emailByEntityId = {}) => {
    const plain = toPlain(row);
    const master = plain.official_master || {};
    const company = plain.entity || {};
    const officialEntity = plain.official_entity || {};
    const officialEmail = emailByEntityId[plain.official_entity_id] || plain.email || '';

    return {
        official_id: plain.official_id,
        entity_id: plain.entity_id,
        company_name: company.name || '',
        official_entity_id: plain.official_entity_id,
        official_entity_name: officialEntity.name || '',
        official_entity_type: officialEntity.entity_type || '',
        email: officialEmail,

        official_master_id: plain.official_master_id || master.official_master_id || null,
        official_master_slug: plain.official_master_slug || master.official_master_slug || null,
        role_name: master.official_master_name || plain.official_master_slug || '',

        official_type: plain.official_type,
        identification_id: plain.identification_id,
        shareholder_type: plain.shareholder_type,
        shareholder_property_type: plain.shareholder_property_type,
        company_contact_id: plain.company_contact_id,
        reference_official_id: plain.reference_official_id,

        is_current: plain.is_current,
        source_from: plain.source_from,

        dates: (plain.date_records || plain.official_dates || []).map(dateRow => {
            const date = toPlain(dateRow);
            const isMain = String(date.is_main_role) === '1';
            const subRoleName = !isMain
                ? (subRoleNameBySlug[date.official_master_slug] || date.official_master_slug || '')
                : null;

            return {
                official_date_id: date.official_date_id,
                official_id: date.official_id,
                entity_id: plain.entity_id,
                official_entity_id: plain.official_entity_id,
                official_entity_name: officialEntity.name || '',
                official_entity_type: officialEntity.entity_type || '',
                email: officialEmail,
                is_main_role: date.is_main_role,
                official_master_slug: date.official_master_slug,
                sub_role_name: subRoleName,
                appointment_date: date.appointment_date,
                ceased_date: date.ceased_date,
                appointment_status: date.officials_appt_from,
                cessation_status: date.officials_ceased_from,
                is_appt_proposed: date.is_appt_proposed,
                is_ceased_proposed: date.is_ceased_proposed,
                remarks: date.remarks,
            };
        }),
    };
};

const groupOfficialRoleRecords = (records = []) => {
    const grouped = {};

    const flattenDateFields = date => {
        if (!date) {
            return {
                official_date_id: null,
                appointment_date: null,
                ceased_date: null,
                appointment_status: null,
                cessation_status: null,
                is_appt_proposed: null,
                is_ceased_proposed: null,
                remarks: null,
            };
        }

        return {
            official_date_id: date.official_date_id || null,
            appointment_date: date.appointment_date || null,
            ceased_date: date.ceased_date || null,
            appointment_status: date.appointment_status || null,
            cessation_status: date.cessation_status || null,
            is_appt_proposed: date.is_appt_proposed ?? null,
            is_ceased_proposed: date.is_ceased_proposed ?? null,
            remarks: date.remarks || null,
        };
    };

    records.forEach(record => {
        const roleName = record.role_name || record.official_master_slug || '';
        if (!roleName) return;

        if (!grouped[roleName]) grouped[roleName] = [];

        const mainDate = (record.dates || []).find(date => String(date.is_main_role) === '1') || null;
        const { dates, ...recordWithoutDates } = record;

        const roleRecord = {
            ...recordWithoutDates,
            role_name: roleName,
            ...flattenDateFields(mainDate),
            sub_roles: {},
        };

        (record.dates || []).forEach(date => {
            const isMainRoleDate = String(date.is_main_role) === '1';

            if (isMainRoleDate) {
                return;
            }

            if (date.sub_role_name || date.official_master_slug) {
                const subRoleName = date.sub_role_name || date.official_master_slug;
                if (!roleRecord.sub_roles[subRoleName]) {
                    roleRecord.sub_roles[subRoleName] = [];
                }

                roleRecord.sub_roles[subRoleName].push({
                    sub_role_name: subRoleName,
                    official_id: record.official_id,
                    entity_id: record.entity_id,
                    official_entity_id: record.official_entity_id,
                    official_entity_name: record.official_entity_name,
                    official_entity_type: record.official_entity_type,
                    email: record.email || '',
                    official_master_slug: date.official_master_slug || null,
                    ...flattenDateFields(date),
                });
            }
        });

        grouped[roleName].push(roleRecord);
    });

    return grouped;
};

const groupOfficialRows = async (models, rows = []) => {
    const subRoleNameBySlug = await buildSubRoleNameBySlug(models);
    const plainRows = rows.map(row => toPlain(row));
    const officialEntityIds = plainRows.map(row => Number(row.official_entity_id)).filter(Boolean);
    const emailByEntityId = await buildPrimaryEmailByEntityId(models, officialEntityIds);
    const records = plainRows.map(row => formatOfficialRecord(row, subRoleNameBySlug, emailByEntityId));
    return groupOfficialRoleRecords(records);
};

const getOfficialRoleGroupsByEntityIds = async (models, entityIds = [], options = {}) => {
    const ids = [...new Set((entityIds || []).map(Number).filter(Boolean))];
    const entityKey = options.entityKey || 'entity_id';

    if (!ids.length || !models.officials) return {};

    const [subRoleNameBySlug, rows] = await Promise.all([
        buildSubRoleNameBySlug(models),
        models.officials.findAll({
            where: {
                [entityKey]: { [Op.in]: ids },
                is_deleted: 0,
            },
            include: officialInclude(models),
            order: [['official_id', 'DESC']],
        }),
    ]);

    const plainRows = rows.map(row => toPlain(row));
    const officialEntityIds = plainRows.map(row => Number(row.official_entity_id)).filter(Boolean);
    const emailByEntityId = await buildPrimaryEmailByEntityId(models, officialEntityIds);
    const officialIds = plainRows.map(row => Number(row.official_id)).filter(Boolean);
    const dateRows = models.officials_date && officialIds.length
        ? await models.officials_date.findAll({
            where: {
                official_id: { [Op.in]: officialIds },
                is_deleted: 0,
            },
            order: [['official_id', 'ASC'], ['is_main_role', 'DESC'], ['official_date_id', 'ASC']],
        })
        : [];

    const datesByOfficialId = {};
    dateRows.forEach(row => {
        const plain = toPlain(row);
        if (!datesByOfficialId[plain.official_id]) datesByOfficialId[plain.official_id] = [];
        datesByOfficialId[plain.official_id].push(plain);
    });

    const recordsByEntity = {};
    plainRows.forEach(row => {
        const plain = {
            ...row,
            date_records: datesByOfficialId[row.official_id] || row.date_records || [],
        };
        const key = Number(plain[entityKey]);
        if (!recordsByEntity[key]) recordsByEntity[key] = [];
        recordsByEntity[key].push(formatOfficialRecord(plain, subRoleNameBySlug, emailByEntityId));
    });

    return ids.reduce((acc, id) => {
        acc[id] = groupOfficialRoleRecords(recordsByEntity[id] || []);
        return acc;
    }, {});
};

const getOfficialRoleGroupsByEntityId = async (models, entityId, options = {}) => {
    const grouped = await getOfficialRoleGroupsByEntityIds(models, [entityId], options);
    return grouped[Number(entityId)] || {};
};

module.exports = {
    formatOfficialRecord,
    getOfficialRoleGroupsByEntityId,
    getOfficialRoleGroupsByEntityIds,
    groupOfficialRoleRecords,
    groupOfficialRows,
    officialInclude,
};
