// multiEventHelpers.js
// Single source of truth for date parsing, entity-id resolution, email
// validation, and payload building — shared by the wizard and every step.

export const parseFlexibleDate = (str) => {
  if (!str) return null;
  const clean = String(str).trim().split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const iso = clean.split('-');
    return new Date(parseInt(iso[0], 10), parseInt(iso[1], 10) - 1, parseInt(iso[2], 10));
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const p = clean.split('/');
    return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
  }
  return null;
};

export const formatDMY = (d) => {
  if (!d) return '';
  return String(d.getDate()).padStart(2, '0') + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    d.getFullYear();
};

export const addMonthsToDate = (str, monthsToAdd) => {
  const d = parseFlexibleDate(str);
  if (!d) return '';
  const months = parseInt(monthsToAdd, 10) || 0;
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + months + 1, 0);
  return formatDMY(monthEnd);
};

export const toDateInput = (value) => {
  if (!value) return '';
  const d = parseFlexibleDate(value);
  return d ? d.toISOString().split('T')[0] : '';
};

export const formatSourceDate = (str) => {
  const d = parseFlexibleDate(str);
  return d ? formatDMY(d) : '';
};

export const getYearFromDate = (str) => {
  const d = parseFlexibleDate(str);
  return d ? d.getFullYear() : null;
};

export const isValidDMY = (str) => /^\d{2}\/\d{2}\/\d{4}$/.test(str || '');

export const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

// ─── Entity ID / Name resolution ───
// Your API returns entity_id consistently, but some UI-only objects may only
// carry `id`. Every step goes through this one function so map keys never
// silently break.
export const getEntityId = (entity) => {
  if (!entity) return null;
  const id = entity.entity_id ?? entity.id;
  return id === undefined ? null : id;
};

export const getEntityName = (entity) => {
  if (!entity) return '';
  return entity.name || entity.company_name || `Company #${getEntityId(entity) ?? ''}`;
};

// ─── API response unwrapping ───
export const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const unwrapOne = (res) => res?.data?.data ?? res?.data ?? res ?? {};

// ─── Email configs ───
export const mapEmailConfigs = (rows = []) => rows
  .map(row => ({
    email_config_id: row.email_config_id || row.id || '',
    label: row.from_name
      ? `${row.from_name} <${row.sending_email || row.smtp_email || ''}>`
      : (row.sending_email || row.smtp_email || ''),
    from_name: row.from_name || '',
    sender_email: row.sending_email || row.smtp_email || '',
    reply_to_email: row.reply_email || '',
    group_to_recipient: Number(row.group_to_recipient) === 1 ? 'TOGETHER' : 'SEPARATE',
    is_default: Boolean(row.is_default || row.sending_default_email),
  }))
  .filter(row => row.sender_email || row.reply_to_email);

export const getDefaultEmailConfig = (configs = []) => configs.find(item => item.is_default) || configs[0] || null;

// ─── Channels ───
export const CHANNELS = ['TO', 'CC', 'BCC'];

export const emptyCustomParty = () => ({ party_type: 'Other', name: '', email: '', channel: 'TO' });

// A custom-party row only "counts" once the user has started filling it in.
export const getCustomPartyErrors = (customParties = []) => {
  const errors = [];
  customParties.forEach((row, idx) => {
    const touched = row.name || row.email || (row.party_type && row.party_type !== 'Other');
    if (!touched) return;
    if (!row.email || !isValidEmail(row.email)) {
      errors.push(`External recipient #${idx + 1}: a valid email is required.`);
    }
  });
  return errors;
};

// ─── Dynamic role support ───
// Your API's official_roles is a free-text keyed object per entity
// (e.g. "Owners", "Managers", "DP Holder", "Shareholders", "Directors" —
// no fixed enum, and it varies entity to entity). Everything below reads
// whatever roles actually exist instead of assuming a hardcoded set.

export const getRoleIcon = (roleName = '') => {
  const name = roleName.toLowerCase();
  if (name.includes('director')) return 'ri-user-star-line';
  if (name.includes('secretary')) return 'ri-user-settings-line';
  if (name.includes('shareholder') || name.includes('member')) return 'ri-team-line';
  if (name.includes('auditor')) return 'ri-file-search-line';
  if (name.includes('manager')) return 'ri-briefcase-line';
  if (name.includes('owner')) return 'ri-vip-crown-line';
  if (name.includes('control')) return 'ri-shield-check-line';
  if (name.includes('fund')) return 'ri-funds-line';
  if (name.includes('representative') || name.includes(' rep')) return 'ri-user-voice-line';
  if (name.includes('ceo')) return 'ri-vip-diamond-line';
  if (name.includes('partner')) return 'ri-hand-heart-line';
  if (name.includes('admin')) return 'ri-shield-user-line';
  if (name.includes('contact')) return 'ri-contacts-line';
  if (name.includes('proxy')) return 'ri-user-follow-line';
  if (name.includes('holder')) return 'ri-bank-card-line';
  return 'ri-user-line';
};

// Merge the distinct role names found across every selected entity.
// companyDetailsMap: { [entityId]: fullCompanyDetailFromGetCompany }
export const mergeRoleGroupsAcrossEntities = (entities = [], companyDetailsMap = {}) => {
  const groups = {};
  entities.forEach(entity => {
    const id = getEntityId(entity);
    const officialRoles = companyDetailsMap[id]?.official_roles || {};
    Object.entries(officialRoles).forEach(([roleName, records]) => {
      if (!Array.isArray(records) || records.length === 0) return;
      if (!groups[roleName]) groups[roleName] = { roleName, entityIds: new Set(), totalOfficials: 0 };
      groups[roleName].entityIds.add(id);
      groups[roleName].totalOfficials += records.filter(r => r.email).length;
    });
  });
  return Object.values(groups)
    .map(g => ({ roleName: g.roleName, entityCount: g.entityIds.size, totalOfficials: g.totalOfficials }))
    .sort((a, b) => a.roleName.localeCompare(b.roleName));
};

