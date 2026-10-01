import { CompanySortOption } from '../constants/company.constants';

export type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | string;

export type CompanyDetail = {
  e_status_id?: number;
  corp_sec_id?: number;
  risk_assessment_rating?: string;
  company_incorporation_date?: string;
  company_fin_date?: string;
  company_takeover_date?: string;
  region_id?: number;
  country?: string;
  remarks?: string;
  additional_remarks?: string;
  person_in_charge?: string;
  holding_company_name?: string;
  source_from?: string;
  ssic_id?: number;
  ssic_user_description?: string;
  ssic_id_secondary?: number;
  ssic_user_description_secondary?: string;
  mail_redirection?: number | boolean;
  company_xbrl_required?: number | boolean;
  public_interest_company?: number | boolean;
  status_effective_date?: string;
  dormant_date?: string;
  strike_off_date?: string;
  admin_access?: string;
  group_access?: string;
  user_access?: string;
};

export type CompanyIdentification = {
  id_number?: string;
  uen_no?: string;
  fbrn_reg_no?: string;
  uf_no?: string;
  domes_bus_no?: string;
  acra_no?: string;
};

export type CompanyAddress = {
  address_id?: number;
  address_type?: string;
  block_no?: string;
  street_name?: string;
  building_name?: string;
  level_no?: string;
  unit_no?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  country_code?: string;
  effective_from?: string;
  effective_to?: string;
  is_primary?: number | boolean;
};

export type CompanyContact = {
  contact_id?: number;
  contact_type?: string;
  contact_value?: string;
  phone_country_code?: string;
  is_primary?: number | boolean;
};

export type CompanyTag = {
  tag_id?: number;
  tag_info?: {
    tag_name?: string;
    tag_color?: string;
  };
};

export type CompanyType = {
  company_type_id?: number;
  company_type_name?: string;
};

export type Company = {
  entity_id: number;
  name?: string;
  former_name?: string;
  client_no?: string;
  status?: CompanyStatus;
  company_type_id?: number;
  remarks?: string;
  additional_remarks?: string;
  created_date?: string;
  company_detail?: CompanyDetail;
  identifications?: CompanyIdentification[];
  addresses?: CompanyAddress[];
  contacts?: CompanyContact[];
  tags?: CompanyTag[];
  company_type?: CompanyType;
};

export type CompanyListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  risk?: string;
  company_type_id?: number;
  country?: string;
  region_id?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
};

export type CompanyListResult = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: Company[];
};

export type CompanyKpis = {
  total: number;
  active: number;
  inactive: number;
  pending: number;
};

export type CompanyListFilters = {
  search: string;
  status: string;
  risk: string;
  sort: CompanySortOption;
};

export type CompanyFormData = {
  name: string;
  former_name: string;
  client_no: string;
  status: CompanyStatus;
  uen_no: string;
  country: string;
  remarks: string;
  street_name: string;
  block_no: string;
  building_name: string;
  postal_code: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  phone_country_code: string;
  registered_address_id?: number;
  email_contact_id?: number;
  phone_contact_id?: number;
};

export type CompanyPayload = {
  name: string;
  former_name?: string | null;
  client_no?: string | null;
  status?: CompanyStatus;
  uen_no?: string | null;
  country?: string;
  remarks?: string | null;
  addresses?: CompanyAddress[];
  contacts?: CompanyContact[];
  tag_ids?: number[];
  created_by?: number;
  updated_by?: number;
};
