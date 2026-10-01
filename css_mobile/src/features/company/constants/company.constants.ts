import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { IconTokenKey } from '@/shared/theme/iconTokens';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export const COMPANY_PAGE_SIZE = 15;

export const COMPANY_AVATAR_COLORS = [
  '#405189',
  '#0ab39c',
  '#f06548',
  '#f7b84b',
  '#299cdb',
  '#6559cc',
  '#e83e8c',
  '#20c997',
];

export const COMPANY_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  ACTIVE: { label: 'Active', color: '#0ab39c', bg: '#EAFBF7' },
  INACTIVE: { label: 'Inactive', color: '#878a99', bg: '#F4F4F4' },
  PENDING: { label: 'Pending', color: '#f7b84b', bg: '#FFF4E8' },
};

export const COMPANY_RISK_META: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low Risk', color: '#0ab39c' },
  MEDIUM: { label: 'Medium Risk', color: '#f7b84b' },
  HIGH: { label: 'High Risk', color: '#f06548' },
  VERY_HIGH: { label: 'Very High Risk', color: '#c0392b' },
};

export const COMPANY_STATUS_TABS = [
  {
    id: '',
    label: 'All',
    countKey: 'total' as const,
    icon: 'business-outline' as IoniconsName,
    iconToken: 'primary' as IconTokenKey,
  },
  {
    id: 'ACTIVE',
    label: 'Active',
    countKey: 'active' as const,
    icon: 'checkmark-circle-outline' as IoniconsName,
    iconToken: 'success' as IconTokenKey,
  },
  {
    id: 'INACTIVE',
    label: 'Inactive',
    countKey: 'inactive' as const,
    icon: 'pause-circle-outline' as IoniconsName,
    iconToken: 'disabled' as IconTokenKey,
  },
  {
    id: 'PENDING',
    label: 'Pending',
    countKey: 'pending' as const,
    icon: 'time-outline' as IoniconsName,
    iconToken: 'warning' as IconTokenKey,
  },
];

/** @deprecated Use COMPANY_STATUS_TABS */
export const COMPANY_STATUS_TAB_ITEMS = COMPANY_STATUS_TABS.filter((tab) => tab.id !== '');

export const COMPANY_KPI_ITEMS = [
  {
    key: 'total' as const,
    label: 'Total Companies',
    icon: 'business-outline' as IoniconsName,
    color: '#405189',
    bg: '#EEF1F8',
  },
  {
    key: 'active' as const,
    label: 'Active',
    icon: 'checkmark-circle-outline' as IoniconsName,
    color: '#0ab39c',
    bg: '#EAFBF7',
  },
  {
    key: 'inactive' as const,
    label: 'Inactive',
    icon: 'pause-circle-outline' as IoniconsName,
    color: '#878a99',
    bg: '#F4F4F4',
  },
  {
    key: 'pending' as const,
    label: 'Pending',
    icon: 'time-outline' as IoniconsName,
    color: '#f7b84b',
    bg: '#FFF4E8',
  },
];

export const COMPANY_STATUS_FILTERS = [
  { id: '', label: 'All Status' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'INACTIVE', label: 'Inactive' },
  { id: 'PENDING', label: 'Pending' },
];

export const COMPANY_RISK_FILTERS = [
  { id: '', label: 'All Risk' },
  { id: 'LOW', label: 'Low' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'HIGH', label: 'High' },
  { id: 'VERY_HIGH', label: 'Very High' },
];

export const COMPANY_ADDRESS_LABELS: Record<string, string> = {
  REGISTERED: 'Registered',
  MAILING: 'Mailing',
  BUSINESS: 'Business',
  FOREIGN: 'Foreign',
  CONTACT: 'Contact',
  RESIDENTIAL: 'Residential',
  OTHER: 'Other',
  REGISTER_OF_MEMBERS: 'Register of Members',
};

export const COMPANY_CONTACT_ICONS: Record<string, string> = {
  EMAIL: 'mail-outline',
  MOBILE: 'phone-portrait-outline',
  OFFICE: 'call-outline',
  FAX: 'print-outline',
  HOME: 'home-outline',
  OTHER: 'globe-outline',
};

export const COMPANY_SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'name_asc', label: 'Name A-Z' },
  { id: 'name_desc', label: 'Name Z-A' },
] as const;

export type CompanySortOption = (typeof COMPANY_SORT_OPTIONS)[number]['id'];
