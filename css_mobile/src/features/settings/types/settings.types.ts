import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type SettingsIconName = ComponentProps<typeof Ionicons>['name'];

export type SettingsMenuItem = {
  id: string;
  title: string;
  description: string;
  icon: SettingsIconName;
  color: string;
  route: keyof SettingsScreenRoutes;
};

export type SettingsQuickAction = {
  id: string;
  label: string;
  icon: SettingsIconName;
  color: string;
};

export type SettingsScreenRoutes = {
  CompanyProfile: { tab?: 'company' | 'decimal' | 'contact' | 'email' } | undefined;
  SharesSettings: { tab?: 'certificate' | 'transfer' | 'authorized-capital' } | undefined;
  UserSettings: { tab?: 'profile' | 'preferences' } | undefined;
  MasterSettings: undefined;
  ChangePassword: undefined;
  AppPreferences: undefined;
};

export type CompanyProfileContact = {
  email_id?: string;
  reply_id?: string;
  phone_no?: string;
};

export type CompanyEmailConfig = {
  email_config_id?: number;
  from_name?: string;
  sending_email?: string;
  smtp_email?: string;
  reply_email?: string;
  aws_ses?: number | boolean;
  is_default?: number | boolean;
  sending_default_email?: boolean;
  group_to_recipient?: number | boolean;
};

export type CompanyProfileRecord = {
  cp_id?: number;
  cp_company_name?: string;
  cp_registration_no?: string;
  cp_country?: string;
  cp_registered_client?: number | boolean;
  cp_mailling_address?: number | boolean;
  cp_reg_add_block?: string;
  cp_registered_address?: string;
  cp_reg_add_building?: string;
  cp_reg_add_level?: string;
  cp_reg_add_unit?: string;
  cp_reg_add_pcode?: string;
  cp_port_title?: string;
  cp_currency?: string;
  cp_gst?: string | number;
  cp_default_level_held_time?: string;
  cp_theme_style?: string;
  cp_caps_proper?: number | boolean;
  cp_no_of_share_decimal_place?: number;
  cp_paid_up_share_decimal_place?: number;
  cp_issued_share_decimal_place?: number;
  cp_timezone_user?: string;
  cp_share_certificate_payment?: number;
  cp_allotment_partial_payment_share_cert?: number;
  cp_transfer_partial_payment_share_cert?: number;
  cp_each_partial_payment_share_cert?: number;
  cp_authorized_captial_countries?: string[] | string;
  cp_share_transaction_no?: Record<string, string> | string;
  cp_company_logo_url?: string;
  cp_port_logo_url?: string;
  cp_port_fav_icon_url?: string;
  cp_login_bg_image_url?: string;
  documents?: unknown[];
};

export type CompanyProfileData = {
  profile?: CompanyProfileRecord;
  contacts?: CompanyProfileContact[];
  emailConfigs?: CompanyEmailConfig[];
};

export type ThemeSettingsData = {
  theme_setting_id?: number;
  user_id?: number;
  layout_type?: string;
  layout_mode_type?: string;
  left_sidebar_type?: string;
  layout_width_type?: string;
  layout_position_type?: string;
  topbar_theme_type?: string;
  leftsidbar_size_type?: string;
  left_sidebar_view_type?: string;
  left_sidebar_image_type?: string;
  preloader?: string;
  sidebar_visibility_type?: string;
  breadcrumbs_visibility?: string;
  footer_visibility?: string;
  default_page_size?: number;
};

export type TransactionType = {
  t_id: number;
  t_type?: number | string;
  t_name?: string;
  t_order?: number;
};

export type SettingsOverview = {
  companyProfile?: CompanyProfileData;
  themeSettings?: ThemeSettingsData;
  userCount: number;
  masterCount: number;
};

export type MasterFieldType = 'text' | 'number' | 'select' | 'color';

export type MasterFieldConfig = {
  key: string;
  label: string;
  type?: MasterFieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

export type MasterResourceConfig = {
  id: string;
  title: string;
  group: string;
  listPath: string;
  createPath: string;
  updatePath: (id: number) => string;
  deletePath: string;
  idField: string;
  labelField: string;
  fields: MasterFieldConfig[];
  order?: string;
};

export type MasterRecord = Record<string, unknown>;
