import {
  COMPANY_ADDRESS_LABELS,
  COMPANY_AVATAR_COLORS,
  COMPANY_CONTACT_ICONS,
  CompanySortOption,
} from '../constants/company.constants';
import {
  Company,
  CompanyAddress,
  CompanyContact,
  CompanyFormData,
  CompanyPayload,
} from '../types/company.types';

export function getCompanyInitials(name = ''): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function getCompanyAvatarColor(name = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % COMPANY_AVATAR_COLORS.length;
  return COMPANY_AVATAR_COLORS[index];
}

export function formatCompanyDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getCompanyUen(company: Company): string | undefined {
  const ident = company.identifications?.[0];
  return ident?.uen_no || ident?.fbrn_reg_no || ident?.id_number;
}

export function getCompanySortParams(sort: CompanySortOption): {
  sort: string;
  order: 'ASC' | 'DESC';
} {
  switch (sort) {
    case 'oldest':
      return { sort: 'created_date', order: 'ASC' };
    case 'name_asc':
      return { sort: 'name', order: 'ASC' };
    case 'name_desc':
      return { sort: 'name', order: 'DESC' };
    case 'latest':
    default:
      return { sort: 'created_date', order: 'DESC' };
  }
}

export function getAddressTypeLabel(addressType?: string): string {
  if (!addressType) return 'Address';
  return COMPANY_ADDRESS_LABELS[addressType] ?? addressType.replace(/_/g, ' ');
}

export function formatAddressLines(address: CompanyAddress): string[] {
  const line = [
    address.block_no,
    address.street_name,
    address.building_name,
    address.level_no ? `Level ${address.level_no}` : null,
    address.unit_no ? `#${address.unit_no}` : null,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  return line ? [line] : [];
}

export function formatContactValue(contact: CompanyContact): string {
  if (contact.contact_type === 'MOBILE' || contact.contact_type === 'OFFICE' || contact.contact_type === 'FAX') {
    const code = contact.phone_country_code?.trim();
    const value = contact.contact_value?.trim();
    if (code && value) return `${code} ${value}`;
  }
  return contact.contact_value?.trim() || '—';
}

export function getContactIcon(contactType?: string): string {
  if (!contactType) return 'call-outline';
  return COMPANY_CONTACT_ICONS[contactType] ?? 'call-outline';
}

export function getContactTypeLabel(contactType?: string): string {
  if (contactType === 'OTHER') return 'Website';
  return contactType?.replace(/_/g, ' ') ?? 'Contact';
}

export function isTruthyFlag(value?: number | boolean): boolean {
  return value === true || value === 1;
}

export const EMPTY_COMPANY_FORM: CompanyFormData = {
  name: '',
  former_name: '',
  client_no: '',
  status: 'ACTIVE',
  uen_no: '',
  country: 'Singapore',
  remarks: '',
  street_name: '',
  block_no: '',
  building_name: '',
  postal_code: '',
  city: '',
  state: '',
  email: '',
  phone: '',
  phone_country_code: '+65',
};

export function mapCompanyToForm(company: Company): CompanyFormData {
  const registered =
    company.addresses?.find((address) => address.address_type === 'REGISTERED') ??
    company.addresses?.[0];
  const emailContact =
    company.contacts?.find((contact) => contact.contact_type === 'EMAIL' && isTruthyFlag(contact.is_primary)) ??
    company.contacts?.find((contact) => contact.contact_type === 'EMAIL');
  const phoneContact =
    company.contacts?.find((contact) => contact.contact_type === 'MOBILE' && isTruthyFlag(contact.is_primary)) ??
    company.contacts?.find((contact) => contact.contact_type === 'MOBILE') ??
    company.contacts?.find((contact) => contact.contact_type === 'OFFICE');

  return {
    name: company.name ?? '',
    former_name: company.former_name ?? '',
    client_no: company.client_no ?? '',
    status: company.status ?? 'ACTIVE',
    uen_no: getCompanyUen(company) ?? '',
    country: company.company_detail?.country ?? registered?.country ?? 'Singapore',
    remarks: company.remarks ?? company.company_detail?.remarks ?? '',
    street_name: registered?.street_name ?? '',
    block_no: registered?.block_no ?? '',
    building_name: registered?.building_name ?? '',
    postal_code: registered?.postal_code ?? '',
    city: registered?.city ?? '',
    state: registered?.state ?? '',
    email: emailContact?.contact_value ?? '',
    phone: phoneContact?.contact_value ?? '',
    phone_country_code: phoneContact?.phone_country_code ?? '+65',
    registered_address_id: registered?.address_id,
    email_contact_id: emailContact?.contact_id,
    phone_contact_id: phoneContact?.contact_id,
  };
}

export function buildCompanyPayload(
  form: CompanyFormData,
  userId?: number,
  isEdit = false,
): CompanyPayload {
  const addresses: CompanyAddress[] = [];
  if (form.street_name.trim() || form.block_no.trim() || form.postal_code.trim()) {
    addresses.push({
      ...(form.registered_address_id ? { address_id: form.registered_address_id } : {}),
      address_type: 'REGISTERED',
      block_no: form.block_no.trim() || undefined,
      street_name: form.street_name.trim() || undefined,
      building_name: form.building_name.trim() || undefined,
      postal_code: form.postal_code.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || 'Singapore',
      is_primary: true,
    });
  }

  const contacts: CompanyContact[] = [];
  if (form.email.trim()) {
    contacts.push({
      ...(form.email_contact_id ? { contact_id: form.email_contact_id } : {}),
      contact_type: 'EMAIL',
      contact_value: form.email.trim(),
      is_primary: true,
    });
  }
  if (form.phone.trim()) {
    contacts.push({
      ...(form.phone_contact_id ? { contact_id: form.phone_contact_id } : {}),
      contact_type: 'MOBILE',
      phone_country_code: form.phone_country_code.trim() || '+65',
      contact_value: form.phone.trim(),
      is_primary: true,
    });
  }

  return {
    name: form.name.trim(),
    former_name: form.former_name.trim() || null,
    client_no: form.client_no.trim() || null,
    status: form.status || 'ACTIVE',
    uen_no: form.uen_no.trim() || null,
    country: form.country.trim() || 'Singapore',
    remarks: form.remarks.trim() || null,
    addresses,
    contacts,
    tag_ids: [],
    ...(userId
      ? isEdit
        ? { updated_by: userId }
        : { created_by: userId, updated_by: userId }
      : {}),
  };
}
