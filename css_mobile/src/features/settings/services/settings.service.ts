import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { DEFAULT_COMPANY_PROFILE_ID } from '../constants/settings.constants';
import {
  CompanyProfileData,
  CompanyProfileRecord,
  SettingsOverview,
  ThemeSettingsData,
  TransactionType,
} from '../types/settings.types';

function extractTotalItems(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return 0;
  const data = payload as PaginatedResponse<unknown> & { totalItems?: number };
  if (typeof data.totalItems === 'number') return data.totalItems;
  if (Array.isArray(data.data)) return data.data.length;
  return 0;
}

function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([childKey, childValue]) => {
          appendFormValue(formData, `${key}[${index}][${childKey}]`, childValue);
        });
      } else {
        formData.append(`${key}[]`, String(item));
      }
    });
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      appendFormValue(formData, `${key}[${childKey}]`, childValue);
    });
    return;
  }
  formData.append(key, String(value));
}

function parseShareTransactionNo(value: CompanyProfileRecord['cp_share_transaction_no']) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

function parseAuthorizedCapitalCountries(
  value: CompanyProfileRecord['cp_authorized_captial_countries'],
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function buildShareSettingsPayload(
  profile: CompanyProfileRecord,
  shareFields: Record<string, unknown>,
): Record<string, unknown> {
  return {
    cp_company_name: profile.cp_company_name ?? '',
    cp_currency: profile.cp_currency ?? 'SGD',
    cp_no_of_share_decimal_place: profile.cp_no_of_share_decimal_place ?? 0,
    cp_paid_up_share_decimal_place: profile.cp_paid_up_share_decimal_place ?? 0,
    cp_issued_share_decimal_place: profile.cp_issued_share_decimal_place ?? 0,
    cp_authorized_captial_countries: parseAuthorizedCapitalCountries(
      profile.cp_authorized_captial_countries,
    ),
    ...shareFields,
  };
}

export const settingsService = {
  getCompanyProfile: async (cpId = DEFAULT_COMPANY_PROFILE_ID, portDb?: string | null) => {
    const response = await apiClient.get<ApiResponse<CompanyProfileData>>(
      buildPortUrl(`/company-profile/get/${cpId}`),
      {
        params: portDb ? { port_name: portDb } : undefined,
      },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load company profile');
    }

    return response.data.data;
  },

  updateCompanyProfile: async (
    cpId: number,
    values: Record<string, unknown>,
    portDb?: string | null,
    userId?: number,
  ) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => appendFormValue(formData, key, value));
    if (portDb) formData.append('port_name', portDb);
    if (userId) formData.append('user_id', String(userId));

    const response = await apiClient.put<ApiResponse<CompanyProfileData>>(
      buildPortUrl(`/company-profile/update/${cpId}`),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update company profile');
    }

    return response.data.data;
  },

  // Share certificate settings are now part of the standard company-profile
  // update endpoint (the dedicated /update-shares route was removed on the backend).
  updateSharesSettings: async (
    cpId: number,
    values: Record<string, unknown>,
    portDb?: string | null,
    userId?: number,
  ) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => appendFormValue(formData, key, value));
    if (portDb) formData.append('port_name', portDb);
    if (userId) formData.append('user_id', String(userId));

    const response = await apiClient.put<ApiResponse<CompanyProfileData>>(
      buildPortUrl(`/company-profile/update/${cpId}`),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update shares settings');
    }

    return response.data.data;
  },

  getTransactionTypes: async () => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<TransactionType>>>(
      buildPortUrl('/transaction-type/list'),
      { params: { page: 1, limit: 100, order: 't_order:ASC' } },
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load transaction types');
    }

    return response.data.data?.data ?? [];
  },

  getCountriesList: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<
      ApiResponse<
        PaginatedResponse<{
          id: number;
          name?: string;
          country_name?: string;
          nationality?: string;
          currency_code?: string;
          iso?: string;
          phonecode?: string | number;
        }>
      >
    >(buildPortUrl('/common/country_list'), {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 300,
        ...(params?.search ? { search: params.search } : {}),
      },
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load countries');
    }

    return response.data.data?.data ?? [];
  },

  getThemeSettings: async () => {
    const response = await apiClient.get<ApiResponse<ThemeSettingsData>>(
      buildPortUrl('/theme-settings/get'),
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to load theme settings');
    }

    return response.data.data;
  },

  saveThemeSettings: async (values: Record<string, unknown>) => {
    const response = await apiClient.put<ApiResponse<ThemeSettingsData>>(
      buildPortUrl('/theme-settings/save'),
      values,
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to save theme settings');
    }

    return response.data.data;
  },

  getUsersPage: async () => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>(
      buildPortUrl('/user/list'),
      { params: { page: 1, limit: 1 } },
    );
    return response.data;
  },

  getSalutationsPage: async () => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<unknown>>>(
      buildPortUrl('/salutation/list'),
      { params: { page: 1, limit: 1 } },
    );
    return response.data;
  },

  getOverview: async (portDb?: string | null): Promise<SettingsOverview> => {
    const [companyProfileRes, themeSettingsRes, usersRes, salutationsRes] = await Promise.allSettled([
      settingsService.getCompanyProfile(DEFAULT_COMPANY_PROFILE_ID, portDb),
      settingsService.getThemeSettings(),
      settingsService.getUsersPage(),
      settingsService.getSalutationsPage(),
    ]);

    const companyProfile =
      companyProfileRes.status === 'fulfilled' ? companyProfileRes.value : undefined;

    const themeSettings =
      themeSettingsRes.status === 'fulfilled' ? themeSettingsRes.value : undefined;

    const userCount =
      usersRes.status === 'fulfilled' && usersRes.value.status
        ? extractTotalItems(usersRes.value.data)
        : 0;

    const masterCount =
      salutationsRes.status === 'fulfilled' && salutationsRes.value.status
        ? extractTotalItems(salutationsRes.value.data)
        : 0;

    return {
      companyProfile,
      themeSettings,
      userCount,
      masterCount,
    };
  },

  parseShareTransactionNo,
  parseAuthorizedCapitalCountries,
  buildShareSettingsPayload,
};
