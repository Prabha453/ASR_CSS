'use strict';

const commonShortcodeCatalog = require('./commonShortcodeCatalog');
const { registry: resolverRegistry } = require('./shortcodeResolverRegistry');

// Resolver names are an implementation detail. This mapping turns the safe
// resolver registry into the domain-aware "Data Field" list exposed to the UI.
const DOMAIN_BY_RESOLVER = Object.freeze({
    ENTITY_FIELD: 'COMPANY',
    COMPANY_DETAIL_FIELD: 'COMPANY',
    PRIMARY_IDENTIFICATION: 'COMPANY',
    ENTITY_ADDRESS: 'COMPANY',
    ENTITY_CONTACT: 'COMPANY',
    COMPANY_PROFILE: 'COMPANY',
    CURRENT_OFFICIALS: 'OFFICIAL',
    SELECTED_OFFICIAL: 'OFFICIAL',
    CURRENT_SHARES: 'SHARE',
    SHARE_DETAIL: 'SHARE',
    SELECTED_SHARE: 'SHARE',
    EVENT_FIELD: 'EVENT',
    COMMON_FIELD: 'COMMON',
    SYSTEM_DATE: 'COMMON',
});

const signature = (resolverName, resolverPath) => `${resolverName}::${resolverPath}`;

const humanize = path => String(path || '')
    .split('.').pop()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const catalogByField = new Map();
for (const item of commonShortcodeCatalog) {
    const key = signature(item.resolver, item.path);
    if (!catalogByField.has(key)) catalogByField.set(key, item);
}

const dataFields = Object.freeze(Object.entries(resolverRegistry)
    .flatMap(([resolverName, paths]) => paths.map(resolverPath => {
        const catalogItem = catalogByField.get(signature(resolverName, resolverPath));
        return Object.freeze({
            id: signature(resolverName, resolverPath),
            domain: catalogItem?.domain || DOMAIN_BY_RESOLVER[resolverName] || 'COMMON',
            label: catalogItem?.label || humanize(resolverPath),
            resolver_name: resolverName,
            resolver_path: resolverPath,
            value_type: catalogItem?.type || 'STRING',
            is_collection: Boolean(catalogItem?.collection),
            selection_behavior: catalogItem?.selection || 'NONE',
            allowed_formats: catalogItem?.formats || [],
        });
    }))
    .sort((left, right) => (
        left.domain.localeCompare(right.domain)
        || left.label.localeCompare(right.label)
        || left.resolver_path.localeCompare(right.resolver_path)
    )));

const findDataField = (domain, resolverName, resolverPath) => dataFields.find(field => (
    field.domain === String(domain || '').toUpperCase()
    && field.resolver_name === String(resolverName || '').toUpperCase()
    && field.resolver_path === String(resolverPath || '')
));

module.exports = {
    DOMAIN_BY_RESOLVER,
    dataFields,
    findDataField,
    signature,
};
