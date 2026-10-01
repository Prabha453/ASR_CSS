import {
  INDIVIDUAL_ADDRESS_LABELS,
  INDIVIDUAL_AVATAR_COLORS,
  IndividualSortOption,
} from '../constants/individual.constants';
import {
  Individual,
  IndividualAddress,
  IndividualAddressForm,
  IndividualContact,
  IndividualFormData,
  IndividualIdEntryForm,
  IndividualPayload,
} from '../types/individual.types';

export function getIndividualInitials(name = ''): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function getIndividualAvatarColor(name = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return INDIVIDUAL_AVATAR_COLORS[Math.abs(hash) % INDIVIDUAL_AVATAR_COLORS.length];
}

export function formatIndividualDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getPrimaryIdNumber(individual: Individual): string | undefined {
  const primary =
    individual.identifications?.find((row) => row.is_primary === true || row.is_primary === 1) ??
    individual.identifications?.[0];
  return primary?.id_number || undefined;
}

export function getPrimaryEmail(individual: Individual): string | undefined {
  const email =
    individual.contacts?.find(
      (row) => row.contact_type === 'EMAIL' && (row.is_primary === true || row.is_primary === 1),
    ) ?? individual.contacts?.find((row) => row.contact_type === 'EMAIL');
  return email?.contact_value || undefined;
}

export function getPrimaryMobile(individual: Individual): string | undefined {
  const mobile =
    individual.contacts?.find(
      (row) => row.contact_type === 'MOBILE' && (row.is_primary === true || row.is_primary === 1),
    ) ?? individual.contacts?.find((row) => row.contact_type === 'MOBILE');
  if (!mobile?.contact_value) return undefined;
  const code = mobile.phone_country_code?.trim();
  return code ? `${code} ${mobile.contact_value}` : mobile.contact_value;
}

export function getAddressTypeLabel(addressType?: string): string {
  if (!addressType) return 'Address';
  return INDIVIDUAL_ADDRESS_LABELS[addressType] ?? addressType.replace(/_/g, ' ');
}

export function formatAddressLines(address: IndividualAddress): string {
  return [
    address.block_no,
    address.street_name,
    address.building_name,
    address.level_no ? `Lvl ${address.level_no}` : null,
    address.unit_no ? `#${address.unit_no}` : null,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function formatContactValue(contact: IndividualContact): string {
  if (contact.contact_type === 'MOBILE' || contact.contact_type === 'OFFICE' || contact.contact_type === 'FAX') {
    const code = contact.phone_country_code?.trim();
    const value = contact.contact_value?.trim();
    if (code && value) return `${code} ${value}`;
  }
  return contact.contact_value?.trim() || '—';
}

export function getIndividualSortParams(sort: IndividualSortOption): {
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

const emptyAddress = (): IndividualAddressForm => ({
  block_no: '',
  street_name: '',
  building_name: '',
  level_no: '',
  unit_no: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Singapore',
});

const emptyIdEntry = (): IndividualIdEntryForm => ({
  id_type: '',
  id_number: '',
  id_country: 'Singapore',
  id_issued_date: '',
  id_expiry_date: '',
  is_primary: true,
});

export const EMPTY_INDIVIDUAL_FORM: IndividualFormData = {
  name: '',
  former_name: '',
  alias: '',
  gender: '',
  dob: '',
  country_of_birth: '',
  nationality: '',
  status: 'ACTIVE',
  risk_rating: '',
  notes: '',
  father_name: '',
  mother_name: '',
  spouse_name: '',
  id_entries: [emptyIdEntry()],
  contact_address: emptyAddress(),
  residential_address: emptyAddress(),
  foreign_address: emptyAddress(),
  default_address: 'contact',
  email: '',
  mobile: '',
  mobile_code: '+65',
  telephone: '',
  telephone_code: '+65',
  fax: '',
  fax_code: '+65',
  skype: '',
  notice_email: true,
  notice_app: false,
  notice_whatsapp: false,
};

function mapAddress(address?: IndividualAddress): IndividualAddressForm {
  if (!address) return emptyAddress();
  return {
    address_id: address.address_id,
    block_no: address.block_no ?? '',
    street_name: address.street_name ?? '',
    building_name: address.building_name ?? '',
    level_no: address.level_no ?? '',
    unit_no: address.unit_no ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    postal_code: address.postal_code ?? '',
    country: address.country ?? 'Singapore',
  };
}

function hasAddressContent(address: IndividualAddressForm): boolean {
  return Boolean(
    address.block_no.trim() ||
      address.street_name.trim() ||
      address.building_name.trim() ||
      address.city.trim() ||
      address.postal_code.trim() ||
      address.level_no.trim() ||
      address.unit_no.trim() ||
      address.state.trim(),
  );
}

export function mapIndividualToForm(individual: Individual): IndividualFormData {
  const detail = individual.individual_detail;
  const emails = (individual.contacts ?? []).filter((row) => row.contact_type === 'EMAIL');
  const mobiles = (individual.contacts ?? []).filter((row) => row.contact_type === 'MOBILE');
  const office = (individual.contacts ?? []).find((row) => row.contact_type === 'OFFICE');
  const fax = (individual.contacts ?? []).find((row) => row.contact_type === 'FAX');
  const contactAddr = individual.addresses?.find((row) => row.address_type === 'CONTACT');
  const residentialAddr = individual.addresses?.find((row) => row.address_type === 'RESIDENTIAL');
  const foreignAddr = individual.addresses?.find((row) => row.address_type === 'FOREIGN');
  const primaryAddress = individual.addresses?.find((row) => row.is_primary === true || row.is_primary === 1);

  let defaultAddress: IndividualFormData['default_address'] = 'contact';
  if (primaryAddress?.address_type === 'RESIDENTIAL') defaultAddress = 'residential';
  if (primaryAddress?.address_type === 'FOREIGN') defaultAddress = 'foreign';

  const idEntries =
    individual.identifications && individual.identifications.length > 0
      ? individual.identifications.map((row, index) => ({
          identification_id: row.identification_id,
          id_type:
            row.member_id_type?.member_id_type_name ??
            (row.m_identification_id != null ? String(row.m_identification_id) : ''),
          id_number: row.id_number ?? '',
          id_country: row.id_issued_country ?? 'Singapore',
          id_issued_date: row.id_issued_date ? String(row.id_issued_date).slice(0, 10) : '',
          id_expiry_date: row.id_expired_date ? String(row.id_expired_date).slice(0, 10) : '',
          is_primary: Boolean(row.is_primary ?? index === 0),
        }))
      : [emptyIdEntry()];

  return {
    name: individual.name ?? '',
    former_name: detail?.former_name ?? individual.former_name ?? '',
    alias: detail?.member_alias_name ?? '',
    gender: detail?.member_gender ?? '',
    dob: detail?.member_dob ? String(detail.member_dob).slice(0, 10) : '',
    country_of_birth: detail?.country_of_birth ?? '',
    nationality: detail?.member_nationality ?? '',
    status: individual.status ?? 'ACTIVE',
    risk_rating: detail?.member_assessment_rating ?? '',
    notes: detail?.additional_notes ?? '',
    father_name: detail?.father_name ?? '',
    mother_name: detail?.mother_name ?? '',
    spouse_name: detail?.spouse_name ?? '',
    id_entries: idEntries,
    contact_address: mapAddress(contactAddr),
    residential_address: mapAddress(residentialAddr),
    foreign_address: mapAddress(foreignAddr),
    default_address: defaultAddress,
    email: emails[0]?.contact_value ?? '',
    email_contact_id: emails[0]?.contact_id,
    mobile: mobiles[0]?.contact_value ?? '',
    mobile_code: mobiles[0]?.phone_country_code ?? '+65',
    mobile_contact_id: mobiles[0]?.contact_id,
    telephone: office?.contact_value ?? '',
    telephone_code: office?.phone_country_code ?? '+65',
    telephone_contact_id: office?.contact_id,
    fax: fax?.contact_value ?? '',
    fax_code: fax?.phone_country_code ?? '+65',
    fax_contact_id: fax?.contact_id,
    skype: detail?.skype_id ?? '',
    notice_email: detail?.notice_from_email !== false && detail?.notice_from_email !== 0,
    notice_app: Boolean(detail?.notice_from_mobile_notify),
    notice_whatsapp: Boolean(detail?.notice_from_whatsapp),
  };
}

export function buildIndividualPayload(
  form: IndividualFormData,
  userId?: number,
  isEdit = false,
): IndividualPayload {
  const addresses: Array<Record<string, unknown>> = [];
  const addressMap: Array<{ key: IndividualFormData['default_address']; type: string; data: IndividualAddressForm }> = [
    { key: 'contact', type: 'CONTACT', data: form.contact_address },
    { key: 'residential', type: 'RESIDENTIAL', data: form.residential_address },
    { key: 'foreign', type: 'FOREIGN', data: form.foreign_address },
  ];

  addressMap.forEach(({ key, type, data }) => {
    if (!hasAddressContent(data)) return;
    addresses.push({
      ...(data.address_id ? { address_id: data.address_id } : {}),
      address_type: type,
      is_primary: form.default_address === key,
      block_no: data.block_no.trim() || null,
      street_name: data.street_name.trim() || null,
      building_name: data.building_name.trim() || null,
      level_no: data.level_no.trim() || null,
      unit_no: data.unit_no.trim() || null,
      city: data.city.trim() || null,
      state: data.state.trim() || null,
      postal_code: data.postal_code.trim() || null,
      country: data.country.trim() || 'Singapore',
    });
  });

  const contacts: Array<Record<string, unknown>> = [];
  if (form.email.trim()) {
    contacts.push({
      ...(form.email_contact_id ? { contact_id: form.email_contact_id } : {}),
      contact_type: 'EMAIL',
      contact_value: form.email.trim(),
      is_primary: true,
    });
  }
  if (form.mobile.trim()) {
    contacts.push({
      ...(form.mobile_contact_id ? { contact_id: form.mobile_contact_id } : {}),
      contact_type: 'MOBILE',
      contact_value: form.mobile.trim(),
      phone_country_code: form.mobile_code.trim() || '+65',
      is_primary: true,
    });
  }
  if (form.telephone.trim()) {
    contacts.push({
      ...(form.telephone_contact_id ? { contact_id: form.telephone_contact_id } : {}),
      contact_type: 'OFFICE',
      contact_value: form.telephone.trim(),
      phone_country_code: form.telephone_code.trim() || '+65',
      is_primary: false,
    });
  }
  if (form.fax.trim()) {
    contacts.push({
      ...(form.fax_contact_id ? { contact_id: form.fax_contact_id } : {}),
      contact_type: 'FAX',
      contact_value: form.fax.trim(),
      phone_country_code: form.fax_code.trim() || '+65',
      is_primary: false,
    });
  }

  const identifications = form.id_entries
    .filter((entry) => entry.id_number.trim())
    .map((entry) => {
      const typeId = Number.parseInt(entry.id_type, 10);
      return {
        ...(entry.identification_id ? { identification_id: entry.identification_id } : {}),
        m_identification_id: Number.isFinite(typeId) ? typeId : null,
        id_number: entry.id_number.trim(),
        id_issued_country: entry.id_country.trim() || null,
        id_issued_date: entry.id_issued_date || null,
        id_expired_date: entry.id_expiry_date || null,
        is_primary: entry.is_primary,
      };
    });

  return {
    name: form.name.trim(),
    former_name: form.former_name.trim() || null,
    member_alias_name: form.alias.trim() || null,
    member_gender: form.gender || null,
    member_dob: form.dob || null,
    country_of_birth: form.country_of_birth.trim() || null,
    member_nationality: form.nationality.trim() || null,
    status: form.status || 'ACTIVE',
    member_assessment_rating: form.risk_rating || null,
    additional_notes: form.notes.trim() || null,
    father_name: form.father_name.trim() || null,
    mother_name: form.mother_name.trim() || null,
    spouse_name: form.spouse_name.trim() || null,
    skype_id: form.skype.trim() || null,
    notice_from_email: form.notice_email,
    notice_from_mobile_notify: form.notice_app,
    notice_from_whatsapp: form.notice_whatsapp,
    identifications,
    addresses,
    contacts,
    ...(userId
      ? isEdit
        ? { updated_by: userId }
        : { created_by: userId, updated_by: userId }
      : {}),
  };
}
