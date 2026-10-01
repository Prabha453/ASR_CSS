import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export const DASHBOARD_DATE_LABEL = '01 May - 31 May 2025';

// ----- Top stat cards -----

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  icon: IoniconsName;
  color: string;
};

export const DASHBOARD_STATS: DashboardStat[] = [
  {
    id: 'earnings',
    label: 'Total Earnings',
    value: '₹24,58,900',
    change: '12.5% vs last month',
    icon: 'wallet-outline',
    color: '#405189',
  },
  {
    id: 'orders',
    label: 'Orders',
    value: '1,245',
    change: '8.3% vs last month',
    icon: 'cart-outline',
    color: '#0ab39c',
  },
  {
    id: 'customers',
    label: 'Customers',
    value: '532',
    change: '6.2% vs last month',
    icon: 'people-outline',
    color: '#f7b84b',
  },
  {
    id: 'balance',
    label: 'My Balance',
    value: '₹8,76,540',
    change: '9.8% vs last month',
    icon: 'card-outline',
    color: '#6559cc',
  },
];

// ----- Quick actions -----

export type QuickActionId =
  | 'add-company'
  | 'add-individual'
  | 'add-official'
  | 'add-user'
  | 'reports';

export type QuickAction = {
  id: QuickActionId;
  label: string;
  icon: IoniconsName;
  color: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'add-company', label: 'Add Company', icon: 'business-outline', color: '#405189' },
  { id: 'add-individual', label: 'Add Individual', icon: 'person-outline', color: '#0ab39c' },
  { id: 'add-official', label: 'Add Official', icon: 'people-outline', color: '#f7b84b' },
  { id: 'add-user', label: 'Add User', icon: 'person-add-outline', color: '#6559cc' },
  { id: 'reports', label: 'Reports', icon: 'document-text-outline', color: '#299cdb' },
];

// ----- Earnings overview (area chart) -----

export const EARNINGS_OVERVIEW = {
  value: '₹24,58,900',
  change: '+12.5%',
  period: 'This Month',
  points: [8, 11, 9, 14, 12, 18, 15, 21, 19, 25, 23, 30, 34, 40],
  labels: ['01 May', '15 May', '31 May'],
};

export type DonutSlice = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

// ----- Recent entities -----

export type RecentEntity = {
  id: string;
  name: string;
  type: string;
  date: string;
  icon: IoniconsName;
  color: string;
};

export const RECENT_ENTITIES: RecentEntity[] = [
  { id: '1', name: 'ABC Pvt Ltd', type: 'Company', date: '12 May 2025', icon: 'business', color: '#405189' },
  { id: '2', name: 'Rahul Sharma', type: 'Individual', date: '11 May 2025', icon: 'person', color: '#0ab39c' },
  { id: '3', name: 'Jane Cooper', type: 'Official', date: '10 May 2025', icon: 'people', color: '#f7b84b' },
];

// ----- Compliance status (donut + banner) -----

export const COMPLIANCE_STATUS: {
  percent: number;
  attention: number;
  slices: DonutSlice[];
} = {
  percent: 78,
  attention: 15,
  slices: [
    { label: 'Compliant', value: 78, percent: 78, color: '#0ab39c' },
    { label: 'Pending', value: 15, percent: 15, color: '#f7b84b' },
    { label: 'Overdue', value: 7, percent: 7, color: '#f06548' },
  ],
};
