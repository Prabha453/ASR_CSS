import { EntityShareType } from '../types/entityShare.types';

export const ENTITY_SHARE_PAGE_SIZE = 20;

export const ENTITY_SHARE_TYPE_META: Record<
  EntityShareType,
  { label: string; color: string; bg: string }
> = {
  NORMAL: { label: 'Normal', color: '#405189', bg: 'rgba(64,81,137,0.12)' },
  BONUS: { label: 'Bonus', color: '#299cdb', bg: 'rgba(41,156,219,0.12)' },
  GUARANTEE: { label: 'Guarantee', color: '#6559cc', bg: 'rgba(101,89,204,0.12)' },
};

export const ENTITY_SHARE_TYPE_OPTIONS = [
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Bonus', value: 'BONUS' },
] as const;

export const ENTITY_SHARE_TRANSACTION_TYPES = [
  { label: 'Allotment', value: 'allotment' },
  { label: 'Share Increase', value: 'share-increase' },
  { label: 'Share Decrease', value: 'share-decrease' },
  { label: 'Transfer', value: 'transfer' },
] as const;
