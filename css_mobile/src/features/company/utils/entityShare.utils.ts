import { Company } from '../types/company.types';
import { EntityShareDecimalSettings } from '../types/entityShare.types';

export type EffectiveDecimals = {
  shares: number;
  paid: number;
  issued: number;
};

export function formatShareNumber(value?: number | null, decimals = 2): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('en-SG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatShareDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isGuaranteeCompany(company?: Company | null): boolean {
  const typeName = company?.company_type?.company_type_name ?? '';
  return /guarantee/i.test(typeName);
}

export function isAuthorizedCapitalCountry(
  company?: Company | null,
  authorizedCountries: string[] = [],
): boolean {
  const country = company?.company_detail?.country?.trim();
  if (!country) return false;
  return authorizedCountries.some((item) => item.toLowerCase() === country.toLowerCase());
}

export function getEffectiveDecimals(
  globalDecimals: EffectiveDecimals,
  entitySettings?: EntityShareDecimalSettings | null,
): EffectiveDecimals {
  return {
    shares:
      entitySettings?.no_of_share_decimal_place != null
        ? entitySettings.no_of_share_decimal_place
        : globalDecimals.shares,
    paid:
      entitySettings?.paid_up_share_decimal_place != null
        ? entitySettings.paid_up_share_decimal_place
        : globalDecimals.paid,
    issued:
      entitySettings?.issued_share_decimal_place != null
        ? entitySettings.issued_share_decimal_place
        : globalDecimals.issued,
  };
}

export function parseAuthorizedCapitalCountries(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}
