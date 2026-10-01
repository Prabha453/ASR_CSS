import { AuthUser } from '@/app/store/slices/authSlice';
import { SettingsOverview } from '../types/settings.types';

export function getProfileInitials(profile: AuthUser | null, fallback = 'AS'): string {
  const name =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name ?? '';

  if (!name.trim()) return fallback;

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getSettingsMenuMeta(sectionId: string, overview?: SettingsOverview): string | undefined {
  if (!overview) return undefined;

  const company = overview.companyProfile?.profile;
  const theme = overview.themeSettings;

  switch (sectionId) {
    case 'company-profile':
      return company?.cp_company_name
        ? `${company.cp_company_name}${company.cp_port_title ? ` · ${company.cp_port_title}` : ''}`
        : undefined;
    case 'shares-settings': {
      const cert = company?.cp_share_certificate_payment ? 'Certificate on' : 'Certificate off';
      const transfer = company?.cp_transfer_partial_payment_share_cert ? 'Transfer on' : 'Transfer off';
      return `${cert} · ${transfer}`;
    }
    case 'user-settings':
      return overview.userCount > 0
        ? `${overview.userCount} user${overview.userCount === 1 ? '' : 's'} in system`
        : theme?.default_page_size
          ? `Page size ${theme.default_page_size}`
          : undefined;
    case 'master-settings':
      return overview.masterCount > 0
        ? `${overview.masterCount}+ master records configured`
        : 'Salutations, regions, tags & more';
    default:
      return undefined;
  }
}
