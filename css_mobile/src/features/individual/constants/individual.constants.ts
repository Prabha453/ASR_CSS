import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export const INDIVIDUAL_PAGE_SIZE = 15;

export const INDIVIDUAL_AVATAR_COLORS = [
  '#405189',
  '#0ab39c',
  '#f06548',
  '#f7b84b',
  '#299cdb',
  '#6559cc',
  '#e83e8c',
  '#20c997',
];

export const INDIVIDUAL_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active', color: '#0ab39c', bg: '#EAFBF7' },
  INACTIVE: { label: 'Inactive', color: '#878a99', bg: '#F4F4F4' },
  PENDING: { label: 'Pending', color: '#f7b84b', bg: '#FFF4E8' },
};

export const INDIVIDUAL_RISK_META: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low Risk', color: '#0ab39c' },
  MEDIUM: { label: 'Medium Risk', color: '#f7b84b' },
  HIGH: { label: 'High Risk', color: '#f06548' },
  VERY_HIGH: { label: 'Very High Risk', color: '#c0392b' },
};

export const INDIVIDUAL_RISK_FILTERS = [
  { id: '', label: 'All Risk' },
  { id: 'LOW', label: 'Low' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'HIGH', label: 'High' },
  { id: 'VERY_HIGH', label: 'Very High' },
];

export const INDIVIDUAL_SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'name_asc', label: 'Name A-Z' },
  { id: 'name_desc', label: 'Name Z-A' },
] as const;

export type IndividualSortOption = (typeof INDIVIDUAL_SORT_OPTIONS)[number]['id'];

export const INDIVIDUAL_ACTION_ITEMS = [
  { id: 'view', label: 'View Profile', icon: 'eye-outline' as IoniconsName, destructive: false },
  { id: 'edit', label: 'Edit Individual', icon: 'create-outline' as IoniconsName, destructive: false },
  { id: 'delete', label: 'Delete Individual', icon: 'trash-outline' as IoniconsName, destructive: true },
] as const;

export type IndividualActionId = (typeof INDIVIDUAL_ACTION_ITEMS)[number]['id'];

export const INDIVIDUAL_GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
] as const;

export const INDIVIDUAL_STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Inactive', value: 'INACTIVE' },
] as const;

export const INDIVIDUAL_RISK_OPTIONS = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Very High', value: 'VERY_HIGH' },
] as const;

export const INDIVIDUAL_STATUS_TABS = [
  { id: '', label: 'All', countKey: 'total' as const },
  { id: 'ACTIVE', label: 'Active', countKey: 'active' as const },
  { id: 'INACTIVE', label: 'Inactive', countKey: 'inactive' as const },
  { id: 'PENDING', label: 'Pending', countKey: 'pending' as const },
];

export const INDIVIDUAL_WIZARD_STEPS = [
  { id: 1, label: 'Personal Info', shortLabel: 'Personal' },
  { id: 2, label: 'ID & Docs', shortLabel: 'ID & Docs' },
  { id: 3, label: 'Contact & Address', shortLabel: 'Contact' },
  { id: 4, label: 'Review', shortLabel: 'Review' },
] as const;

export const INDIVIDUAL_VIEW_TABS = [
  { id: 'overview', label: 'Overview', icon: 'home-outline' as IoniconsName },
  { id: 'ids', label: 'ID Docs', icon: 'card-outline' as IoniconsName },
  { id: 'addresses', label: 'Addresses', icon: 'location-outline' as IoniconsName },
  { id: 'contacts', label: 'Contacts', icon: 'call-outline' as IoniconsName },
  { id: 'relationships', label: 'Family', icon: 'people-outline' as IoniconsName },
] as const;

export type IndividualViewTabId = (typeof INDIVIDUAL_VIEW_TABS)[number]['id'];

export const INDIVIDUAL_ADDRESS_LABELS: Record<string, string> = {
  CONTACT: 'Contact',
  RESIDENTIAL: 'Residential',
  FOREIGN: 'Foreign',
};
