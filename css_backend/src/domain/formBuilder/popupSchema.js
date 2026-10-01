'use strict';

const CONTROL_TYPES = new Set([
    'TEXT', 'TEXTAREA', 'DATE', 'NUMBER', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'RADIO',
    // RADIO_SWITCH: a role toggle (e.g. Director / Secretary) that filters a
    // single record picker to the chosen role. Only valid with a role-bearing
    // remote source (OFFICIAL_RECORDS / SHAREHOLDERS); the stored value is still
    // just the picked record id, so no special resolution is needed downstream.
    'RADIO_SWITCH',
    'ENTITY_SELECT', 'EVENT_SELECT', 'OFFICIAL_SELECT', 'SHAREHOLDER_SELECT', 'SHARE_SELECT',
]);
const VALUE_SOURCES = new Set(['MANUAL', 'DATES', 'COMPANY', 'EVENT', 'COMPLAINANT', 'OFFICIALS', 'OFFICIAL_RECORDS', 'SHAREHOLDERS', 'SHARES', 'ALLOTMENTS', 'SHARE_TRANSACTIONS']);

const parseJson = value => {
    let result = value;
    try { while (typeof result === 'string') result = JSON.parse(result); }
    catch (error) { return []; }
    return result;
};

const slug = value => String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');

// The storage keys ("section_0", "section_1", …) were historically leaked into
// the section_name field. Treat them as "no name given".
const cleanSectionName = value => {
    const name = String(value ?? '').trim();
    return /^section_\d+$/i.test(name) ? '' : name;
};

const legacySections = value => {
    const parsed = parseJson(value);
    if (Array.isArray(parsed)) {
        return parsed.map(section => ({ ...section, section_name: cleanSectionName(section?.section_name) }));
    }
    if (!parsed || typeof parsed !== 'object') return [];
    return Object.keys(parsed).sort().map(key => ({
        // Never surface the storage key ("section_0") as a section name.
        section_name: cleanSectionName(parsed[key]?.[0]?.section_name),
        _storage_key: key,
        rows: parsed[key] || [],
    }));
};

const normalizePopupSchema = value => {
  // Field keys must be stable and unique across the whole form: template
  // shortcodes and `depends_on` reference them by name. Prefer an explicit
  // slug, then the (user-facing) label, and only then legacy identifiers.
  const usedKeys = new Set();
  const uniqueKey = base => {
    let key = base;
    let suffix = 2;
    while (usedKeys.has(key)) key = `${base}_${suffix++}`;
    usedKeys.add(key);
    return key;
  };
  return legacySections(value).map((section, sectionIndex) => ({
    section_key: slug(section.section_key || section.section_name || section._storage_key) || `section_${sectionIndex + 1}`,
    // Blank when the author gave no section name — the UI then renders no heading.
    label: section.label || section.section_name || '',
    order: Number.isInteger(section.order) ? section.order : sectionIndex,
    fields: (section.fields || section.rows || []).map((field, fieldIndex) => {
        // An explicit key is kept verbatim (duplicates are surfaced by
        // validatePopupSchema); a key derived from the label is made unique so
        // builder-authored fields never collide and drop each other's values.
        const explicitKey = slug(field.field_key || field.form_pop_up_field_slug);
        const derivedKey = slug(field.pop_up_field_label_name || field.label ||
            field.pop_up_temp_param || field.pop_up_field_id) || `field_${sectionIndex + 1}_${fieldIndex + 1}`;
        const fieldKey = explicitKey || uniqueKey(derivedKey);
        usedKeys.add(fieldKey);
        const requestedSource = String(field.value_source || 'MANUAL').toUpperCase();
        // A DATES-sourced field is always a date control.
        const requestedControl = requestedSource === 'DATES'
            ? 'DATE'
            : String(field.control_type || field.pop_up_field_type || 'TEXT').toUpperCase();
        const sourceFilter1 = String(field.source_filter_1 || 'all');
        const explicitDependsOn = Array.isArray(field.depends_on)
            ? [...new Set(field.depends_on.map(slug).filter(Boolean))] : [];
        // A Shareholder-Level-Shares field can't resolve without knowing WHICH
        // company-level share to list holders of. `child_of` (the builder's
        // parent-grouping marker — never itself part of this output shape) is
        // the only place that relationship is recorded when the author never
        // filled in "Depends on" by hand, so fall back to it here rather than
        // leaving the field permanently unable to fetch anything.
        const dependsOn = explicitDependsOn.length ? explicitDependsOn
            : (requestedSource === 'SHARES' && sourceFilter1.toUpperCase() === 'SHAREHOLDER_LEVEL_SHARES' && field.child_of
                ? [slug(field.child_of)].filter(Boolean)
                : []);
        return {
            field_key: fieldKey,
            label: field.label || field.pop_up_field_label_name || fieldKey,
            control_type: CONTROL_TYPES.has(requestedControl) ? requestedControl : 'TEXT',
            value_source: VALUE_SOURCES.has(requestedSource) ? requestedSource : 'MANUAL',
            required: field.required === true,
            multiple: field.multiple === true || requestedControl === 'MULTISELECT',
            depends_on: dependsOn,
            options: Array.isArray(field.options) ? field.options : [],
            transaction_types: Array.isArray(field.transaction_types)
                ? [...new Set(field.transaction_types.map(value => String(value).trim().toUpperCase()).filter(Boolean))]
                : [],
            official_roles: Array.isArray(field.official_roles)
                ? [...new Set(field.official_roles.map(value => slug(value)).filter(Boolean))]
                : [],
            official_statuses: Array.isArray(field.official_statuses)
                ? [...new Set(field.official_statuses.map(value => String(value).trim().toUpperCase()).filter(value => ['CURRENT', 'CEASED'].includes(value)))]
                : [],
            source_filter_1: sourceFilter1,
            source_filter_2: String(field.source_filter_2 || 'all'),
            source_filter_3: String(field.source_filter_3 || 'all'),
            // SHARES only: shareholder entity type (officials.official_type —
            // COMPANY/INDIVIDUAL/JOINT/SUB_FUND), comma-joined. Meaningless
            // (ignored) for any other data source, same as 1..3.
            source_filter_4: String(field.source_filter_4 || 'all'),
            // Which pieces make up this field's option labels, and in what
            // order — e.g. ['name', 'role_name', 'appointment_date']. Empty ⇒
            // use the data source's own default label untouched.
            option_label_fields: Array.isArray(field.option_label_fields)
                ? [...new Set(field.option_label_fields.map(value => slug(value)).filter(Boolean))]
                : [],
            order: Number.isInteger(field.order) ? field.order : fieldIndex,
        };
    }),
  }));
};

const validatePopupSchema = schema => {
    const errors = [];
    const fields = normalizePopupSchema(schema).flatMap(section => section.fields);
    const keys = new Set();
    for (const field of fields) {
        if (keys.has(field.field_key)) errors.push(`Duplicate field key: ${field.field_key}`);
        keys.add(field.field_key);
    }
    const graph = new Map();
    for (const field of fields) {
        if (!graph.has(field.field_key)) graph.set(field.field_key, field.depends_on);
    }
    for (const field of fields) for (const dependency of field.depends_on) {
        if (!keys.has(dependency)) errors.push(`Unknown dependency ${dependency} for ${field.field_key}`);
        if (dependency === field.field_key) errors.push(`Field ${field.field_key} cannot depend on itself`);
    }
    const visiting = new Set();
    const visited = new Set();
    const visit = key => {
        if (visiting.has(key)) { errors.push(`Circular dependency detected at ${key}`); return; }
        if (visited.has(key)) return;
        visiting.add(key);
        for (const dependency of graph.get(key) || []) if (graph.has(dependency)) visit(dependency);
        visiting.delete(key);
        visited.add(key);
    };
    for (const key of graph.keys()) visit(key);
    return [...new Set(errors)];
};

const mergePopupSchemas = items => {
    const sections = new Map();
    const fields = new Map();
    const conflicts = [];
    for (const item of items) for (const section of normalizePopupSchema(item.schema)) {
        if (!sections.has(section.section_key)) sections.set(section.section_key, {
            section_key: section.section_key,
            label: section.label,
            order: sections.size,
            fields: [],
        });
        for (const field of section.fields) {
            const signature = JSON.stringify({
                control_type: field.control_type,
                value_source: field.value_source,
                multiple: field.multiple,
                options: field.options,
                transaction_types: field.transaction_types,
                official_roles: field.official_roles,
                official_statuses: field.official_statuses,
            });
            const existing = fields.get(field.field_key);
            if (existing && existing.signature !== signature) {
                conflicts.push(`Conflicting field definition: ${field.field_key}`);
                continue;
            }
            if (existing) {
                existing.field.required = existing.field.required || field.required;
                existing.field.depends_on = [...new Set([...existing.field.depends_on, ...field.depends_on])];
                existing.field.origin_form_ids.push(item.form_id);
                continue;
            }
            const merged = { ...field, origin_form_ids: [item.form_id] };
            sections.get(section.section_key).fields.push(merged);
            fields.set(field.field_key, { signature, field: merged });
        }
    }
    const schema = [...sections.values()].filter(section => section.fields.length);
    return { schema, conflicts: [...new Set([...conflicts, ...validatePopupSchema(schema)])] };
};

module.exports = { CONTROL_TYPES, VALUE_SOURCES, normalizePopupSchema, validatePopupSchema, mergePopupSchemas };
