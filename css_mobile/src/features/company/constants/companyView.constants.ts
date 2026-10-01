import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export const COMPANY_VIEW_TABS = [
  { id: 'overview', label: 'Overview', icon: 'home-outline' as IoniconsName },
  { id: 'contacts', label: 'Contacts', icon: 'call-outline' as IoniconsName },
  { id: 'addresses', label: 'Addresses', icon: 'location-outline' as IoniconsName },
  { id: 'shares', label: 'Shares', icon: 'pie-chart-outline' as IoniconsName },
  { id: 'corp', label: 'Corp Sec', icon: 'briefcase-outline' as IoniconsName },
  { id: 'documents', label: 'Documents', icon: 'folder-outline' as IoniconsName },
] as const;

export type CompanyViewTabId = (typeof COMPANY_VIEW_TABS)[number]['id'];

export const COMPANY_WIZARD_STEPS = [
  { id: 1, label: 'Basic Info', shortLabel: 'Basic', icon: 'business-outline' as IoniconsName },
  { id: 2, label: 'Address', shortLabel: 'Address', icon: 'location-outline' as IoniconsName },
  { id: 3, label: 'Contacts', shortLabel: 'Contacts', icon: 'call-outline' as IoniconsName },
  { id: 4, label: 'Review', shortLabel: 'Review', icon: 'checkmark-circle-outline' as IoniconsName },
] as const;

export const COMPANY_ACTION_ITEMS = [
  { id: 'edit', label: 'Edit Company', icon: 'create-outline' as IoniconsName, destructive: false },
  { id: 'documents', label: 'View Documents', icon: 'folder-open-outline' as IoniconsName, destructive: false },
  { id: 'officials', label: 'View Officials', icon: 'people-outline' as IoniconsName, destructive: false },
  { id: 'deactivate', label: 'Deactivate Company', icon: 'ban-outline' as IoniconsName, destructive: true },
] as const;

export type CompanyActionId = (typeof COMPANY_ACTION_ITEMS)[number]['id'];
