import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { IconTokenKey } from '@/shared/theme/iconTokens';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export type EntityModuleRoute =
  | 'CompanyList'
  | 'IndividualList'
  | 'OfficialsDetail'
  | 'ChargesList'
  | 'ModulePlaceholder';

export type EntityModuleStatusTone = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'muted';

export type EntityModuleConfig = {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconsName;
  iconToken: IconTokenKey;
  accent: string;
  statusLabel: string;
  statusTone: EntityModuleStatusTone;
  route?: EntityModuleRoute;
  comingSoon?: boolean;
  placeholderDescription?: string;
};

export const ENTITY_MODULES: EntityModuleConfig[] = [
  {
    id: 'companies',
    title: 'Companies',
    subtitle: 'Browse corporates, subsidiaries and company profiles',
    icon: 'business-outline',
    iconToken: 'company',
    accent: '#405189',
    statusLabel: '112 Active',
    statusTone: 'info',
    route: 'CompanyList',
  },
  {
    id: 'individuals',
    title: 'Individuals',
    subtitle: 'Manage directors, shareholders and personal entities',
    icon: 'person-outline',
    iconToken: 'success',
    accent: '#0ab39c',
    statusLabel: '12 New this week',
    statusTone: 'success',
    route: 'IndividualList',
  },
  {
    id: 'officials',
    title: 'Officials',
    subtitle: 'View appointments, roles and official filings',
    icon: 'id-card-outline',
    iconToken: 'info',
    accent: '#299cdb',
    statusLabel: '6 Pending',
    statusTone: 'info',
    route: 'OfficialsDetail',
  },
  {
    id: 'charges',
    title: 'Charges',
    subtitle: 'Registered charges and security interests',
    icon: 'document-lock-outline',
    iconToken: 'warning',
    accent: '#f7b84b',
    statusLabel: '2 Expiring soon',
    statusTone: 'warning',
    route: 'ChargesList',
  },
  {
    id: 'form-builder',
    title: 'Form Builder',
    subtitle: 'Templates and pop-up fields',
    icon: 'construct-outline',
    iconToken: 'purple',
    accent: '#6559cc',
    statusLabel: 'Updated 3 days ago',
    statusTone: 'purple',
    route: 'ModulePlaceholder',
    placeholderDescription:
      'Form templates and pop-up field management are available on web. Full mobile builder screens are next.',
  },
  {
    id: 'compliance',
    title: 'Compliance',
    subtitle: 'Events, reminders and due dates',
    icon: 'shield-checkmark-outline',
    iconToken: 'success',
    accent: '#0ab39c',
    statusLabel: '8 Overdue',
    statusTone: 'danger',
    route: 'ModulePlaceholder',
    placeholderDescription:
      'Compliance events, reminders and due-date tracker are available on web. Mobile event flows are next.',
  },
];
