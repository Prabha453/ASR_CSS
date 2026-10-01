import { IconTokenKey } from '@/shared/theme/iconTokens';
import { SettingsIconName } from '../types/settings.types';

export const DEFAULT_COMPANY_PROFILE_ID = 1;

export const COMPANY_PROFILE_TABS = [
  { id: 'company', label: 'Company' },
  { id: 'decimal', label: 'Decimals' },
  { id: 'contact', label: 'Contacts' },
  { id: 'email', label: 'Email' },
] as const;

export type CompanyProfileTabId = (typeof COMPANY_PROFILE_TABS)[number]['id'];

export const COMPANY_PROFILE_SCREEN_TITLES: Record<CompanyProfileTabId, string> = {
  company: 'Company Profile',
  contact: 'Contact Information',
  email: 'Email Configuration',
  decimal: 'Decimal Settings',
};

export const SHARES_SETTINGS_TABS = [
  { id: 'certificate', label: 'Certificate' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'authorized-capital', label: 'Auth Capital' },
] as const;

export type SharesSettingsTabId = (typeof SHARES_SETTINGS_TABS)[number]['id'];

export const SHARES_SETTINGS_SCREEN_TITLES: Record<SharesSettingsTabId, string> = {
  certificate: 'Share Certificate Settings',
  transfer: 'Transaction Settings',
  'authorized-capital': 'Authorized Capital Countries',
};

export const USER_SETTINGS_TABS = [
  { id: 'preferences', label: 'Preferences' },
  { id: 'account', label: 'Account' },
] as const;

export type UserSettingsTabId = (typeof USER_SETTINGS_TABS)[number]['id'];

export const THEME_STYLE_OPTIONS = [
  { label: 'Custom', value: 'custom' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

export type SettingsMenuGroupItem = {
  id: string;
  title: string;
  description: string;
  icon: SettingsIconName;
  iconToken: IconTokenKey;
  route: keyof import('../types/settings.types').SettingsScreenRoutes | 'MasterDataList';
  masterResourceId?: string;
  initialTab?: CompanyProfileTabId | SharesSettingsTabId;
  comingSoon?: boolean;
};

export type SettingsMenuGroup = {
  id: string;
  title: string;
  items: SettingsMenuGroupItem[];
};

export const SETTINGS_MENU_GROUPS: SettingsMenuGroup[] = [
  {
    id: 'general',
    title: 'GENERAL',
    items: [
      {
        id: 'company-profile',
        title: 'Company Profile',
        description: 'Manage company profile and branding',
        icon: 'business-outline',
        iconToken: 'company',
        route: 'CompanyProfile',
        initialTab: 'company',
      },
      {
        id: 'contact-info',
        title: 'Contact Information',
        description: 'Manage contact details and phone numbers',
        icon: 'call-outline',
        iconToken: 'info',
        route: 'CompanyProfile',
        initialTab: 'contact',
      },
      {
        id: 'email-config',
        title: 'Email Configuration',
        description: 'Manage SMTP and email settings',
        icon: 'mail-outline',
        iconToken: 'primary',
        route: 'CompanyProfile',
        initialTab: 'email',
      },
      {
        id: 'decimal-settings',
        title: 'Decimal Settings',
        description: 'Configure share decimal places',
        icon: 'calculator-outline',
        iconToken: 'purple',
        route: 'CompanyProfile',
        initialTab: 'decimal',
      },
    ],
  },
  {
    id: 'shares',
    title: 'SHARES',
    items: [
      {
        id: 'share-certificates',
        title: 'Share Certificate Settings',
        description: 'Certificate setup and numbering',
        icon: 'document-text-outline',
        iconToken: 'shares',
        route: 'SharesSettings',
        initialTab: 'certificate',
      },
      {
        id: 'transaction-settings',
        title: 'Transaction Settings',
        description: 'Configure share transaction defaults',
        icon: 'swap-horizontal-outline',
        iconToken: 'shares',
        route: 'SharesSettings',
        initialTab: 'transfer',
      },
      {
        id: 'authorized-capital',
        title: 'Authorized Capital',
        description: 'Countries that require authorized capital',
        icon: 'globe-outline',
        iconToken: 'purple',
        route: 'SharesSettings',
        initialTab: 'authorized-capital',
      },
    ],
  },
  {
    id: 'user',
    title: 'USER',
    items: [
      {
        id: 'user-profile',
        title: 'Profile',
        description: 'Manage user profile and preferences',
        icon: 'person-outline',
        iconToken: 'user',
        route: 'UserSettings',
      },
      {
        id: 'change-password',
        title: 'Change Password',
        description: 'Update account password',
        icon: 'lock-closed-outline',
        iconToken: 'security',
        route: 'ChangePassword',
      },
    ],
  },
  {
    id: 'master',
    title: 'MASTER DATA',
    items: [
      {
        id: 'company-types',
        title: 'Company Types',
        description: 'Manage company type masters',
        icon: 'briefcase-outline',
        iconToken: 'company',
        route: 'MasterDataList',
        masterResourceId: 'company-type',
      },
      {
        id: 'regions',
        title: 'Regions',
        description: 'Manage regional lookup data',
        icon: 'globe-outline',
        iconToken: 'success',
        route: 'MasterDataList',
        masterResourceId: 'region',
      },
      {
        id: 'business-entities',
        title: 'Business Entities',
        description: 'Manage business entity masters',
        icon: 'business-outline',
        iconToken: 'purple',
        route: 'MasterDataList',
        masterResourceId: 'business-entity',
      },
      {
        id: 'tags',
        title: 'Tags',
        description: 'Manage system tags and colors',
        icon: 'pricetag-outline',
        iconToken: 'masterData',
        route: 'MasterDataList',
        masterResourceId: 'tag',
      },
      {
        id: 'member-types',
        title: 'Member Types',
        description: 'Manage member identification types',
        icon: 'id-card-outline',
        iconToken: 'security',
        route: 'MasterDataList',
        masterResourceId: 'member-id-type',
      },
      {
        id: 'official-roles',
        title: 'Official Roles',
        description: 'Manage official role masters',
        icon: 'people-outline',
        iconToken: 'purple',
        route: 'MasterSettings',
        comingSoon: true,
      },
    ],
  },
];

export const SETTINGS_QUICK_ACTIONS = [
  { id: 'add-company', label: 'Add Company', icon: 'document-text-outline' as const, color: '#405189' },
  { id: 'upload-logo', label: 'Upload Logo', icon: 'cloud-upload-outline' as const, color: '#0ab39c' },
  { id: 'manage-users', label: 'Manage Users', icon: 'people-outline' as const, color: '#6559cc' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' as const, color: '#f7b84b' },
] as const;

export const MASTER_SETTING_GROUPS = [
  {
    id: 'common',
    title: 'Common Masters',
    description: 'Salutations, regions, races, tags',
  },
  {
    id: 'company',
    title: 'Company & Entity',
    description: 'Types, segregations, SSIC, events',
  },
  {
    id: 'share',
    title: 'Share & Financial',
    description: 'Share classes, fees, transaction types',
  },
  {
    id: 'official',
    title: 'Official / Member',
    description: 'Member types, officials, sub roles',
  },
] as const;

export const MASTER_RESOURCE_VISUALS: Record<
  string,
  { icon: SettingsIconName; iconToken: IconTokenKey }
> = {
  salutation: { icon: 'person-outline', iconToken: 'user' },
  region: { icon: 'globe-outline', iconToken: 'success' },
  race: { icon: 'people-outline', iconToken: 'warning' },
  tag: { icon: 'pricetag-outline', iconToken: 'masterData' },
  'company-type': { icon: 'briefcase-outline', iconToken: 'company' },
  'company-segregation': { icon: 'layers-outline', iconToken: 'primary' },
  'company-ssic-code': { icon: 'bar-chart-outline', iconToken: 'info' },
  'company-event-name': { icon: 'calendar-outline', iconToken: 'warning' },
  'business-entity': { icon: 'business-outline', iconToken: 'purple' },
  'entity-status': { icon: 'checkmark-circle-outline', iconToken: 'success' },
  'share-class': { icon: 'pie-chart-outline', iconToken: 'shares' },
  'transaction-type': { icon: 'swap-horizontal-outline', iconToken: 'primary' },
  'member-id-type': { icon: 'id-card-outline', iconToken: 'security' },
};
