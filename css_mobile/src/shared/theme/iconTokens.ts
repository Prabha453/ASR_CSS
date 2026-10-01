import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type IconTokenKey =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'disabled'
  | 'company'
  | 'shares'
  | 'user'
  | 'security'
  | 'masterData';

export type IconToken = {
  background: string;
  color: string;
};

export const iconTokens: Record<IconTokenKey, IconToken> = {
  primary: { background: '#EEF4FF', color: '#405189' },
  success: { background: '#EAFBF7', color: '#0ab39c' },
  warning: { background: '#FFF4E8', color: '#f7b84b' },
  danger: { background: '#FFE8E5', color: '#f06548' },
  info: { background: '#E8F4FD', color: '#299cdb' },
  purple: { background: '#F3EEFF', color: '#6559cc' },
  disabled: { background: '#f3f6f9', color: '#878a99' },
  company: { background: '#EEF4FF', color: '#405189' },
  shares: { background: '#EAFBF7', color: '#0ab39c' },
  user: { background: '#F3EEFF', color: '#6559cc' },
  security: { background: '#FFF4E8', color: '#f7b84b' },
  masterData: { background: '#EEF4FF', color: '#3577f1' },
};

export const actionIconColors = {
  edit: '#3577f1',
  delete: '#f06548',
  view: '#299cdb',
  active: '#0ab39c',
  pending: '#f7b84b',
  primary: '#405189',
  disabled: '#878a99',
} as const;
