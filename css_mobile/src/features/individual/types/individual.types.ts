export type IndividualStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | string;

export type IndividualDetail = {
  salutation_id?: number | null;
  former_name?: string | null;
  member_alias_name?: string | null;
  member_gender?: string | null;
  member_dob?: string | null;
  country_of_birth?: string | null;
  member_nationality?: string | null;
  race_id?: number | null;
  member_assessment_rating?: string | null;
  additional_notes?: string | null;
  deceased_date?: string | null;
  deceased_remarks?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  spouse_name?: string | null;
  skype_id?: string | null;
  preferred_contact_mode?: string | null;
  services_to_contact?: string | null;
  notice_from_email?: boolean | number | null;
  notice_from_mobile_notify?: boolean | number | null;
  notice_from_whatsapp?: boolean | number | null;
  occupation?: string | null;
  employer_name?: string | null;
  tax_id?: string | null;
};

export type IndividualIdentification = {
  identification_id?: number;
  m_identification_id?: number | null;
  id_number?: string;
  id_issued_country?: string | null;
  id_issued_date?: string | null;
  id_expired_date?: string | null;
  document_name?: string | null;
  document_url?: string | null;
  is_primary?: boolean | number;
  member_id_type?: { member_id_type_id?: number; member_id_type_name?: string };
  scan_docs?: Array<{ file_name?: string; file_path?: string; doc_id?: number }>;
};

export type IndividualAddress = {
  address_id?: number;
  address_type?: string;
  block_no?: string | null;
  street_name?: string | null;
  building_name?: string | null;
  level_no?: string | null;
  unit_no?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_primary?: boolean | number;
  proof_docs?: Array<{ file_name?: string; file_path?: string; doc_id?: number }>;
};

export type IndividualContact = {
  contact_id?: number;
  contact_type?: string;
  contact_value?: string | null;
  phone_country_code?: string | null;
  is_primary?: boolean | number;
};

export type IndividualRelationship = {
  relationship_id?: number;
  relationship_type?: string;
  related_name?: string | null;
  related_entity_id?: number | null;
};

export type IndividualTag = {
  tag_id?: number;
  tag_info?: { tag_name?: string; tag_color?: string };
};

export type IndividualOfficialRole = {
  official_id?: number;
  company_name?: string;
  role_name?: string;
  appointment_date?: string | null;
  cessation_date?: string | null;
  status?: string;
};

export type Individual = {
  entity_id: number;
  name?: string;
  former_name?: string | null;
  client_no?: string | null;
  status?: IndividualStatus;
  created_date?: string;
  individual_detail?: IndividualDetail;
  identifications?: IndividualIdentification[];
  addresses?: IndividualAddress[];
  contacts?: IndividualContact[];
  relationships?: IndividualRelationship[];
  tags?: IndividualTag[];
  official_roles?: IndividualOfficialRole[];
  official_company_contacts?: Array<Record<string, unknown>>;
};

export type IndividualListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  risk?: string;
  nationality?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
};

export type IndividualListFilters = {
  search: string;
  status: string;
  risk: string;
  sort: 'latest' | 'oldest' | 'name_asc' | 'name_desc';
};

export type IndividualListResult = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: Individual[];
};

export type IndividualKpis = {
  total: number;
  active: number;
  inactive: number;
  pending: number;
};

export type IndividualIdEntryForm = {
  identification_id?: number;
  id_type: string;
  id_number: string;
  id_country: string;
  id_issued_date: string;
  id_expiry_date: string;
  is_primary: boolean;
};

export type IndividualAddressForm = {
  address_id?: number;
  block_no: string;
  street_name: string;
  building_name: string;
  level_no: string;
  unit_no: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export type IndividualFormData = {
  name: string;
  former_name: string;
  alias: string;
  gender: string;
  dob: string;
  country_of_birth: string;
  nationality: string;
  status: IndividualStatus;
  risk_rating: string;
  notes: string;
  father_name: string;
  mother_name: string;
  spouse_name: string;
  id_entries: IndividualIdEntryForm[];
  contact_address: IndividualAddressForm;
  residential_address: IndividualAddressForm;
  foreign_address: IndividualAddressForm;
  default_address: 'contact' | 'residential' | 'foreign';
  email: string;
  email_contact_id?: number;
  mobile: string;
  mobile_code: string;
  mobile_contact_id?: number;
  telephone: string;
  telephone_code: string;
  telephone_contact_id?: number;
  fax: string;
  fax_code: string;
  fax_contact_id?: number;
  skype: string;
  notice_email: boolean;
  notice_app: boolean;
  notice_whatsapp: boolean;
};

export type IndividualPayload = Record<string, unknown>;
