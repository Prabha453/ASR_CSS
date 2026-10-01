import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SelectOption } from '@/shared/components/formInputs';
import { settingsService } from '@/features/settings/services/settings.service';

export type CountryRecord = {
  id: number;
  name?: string;
  country_name?: string;
  nationality?: string;
  currency_code?: string;
  iso?: string;
  phonecode?: string | number;
};

export const COUNTRIES_QUERY_KEY = ['countries-list'] as const;

function getCountryLabel(item: CountryRecord) {
  return (item.country_name || item.name || '').trim();
}

export function useCountriesOptions() {
  const query = useQuery({
    queryKey: COUNTRIES_QUERY_KEY,
    queryFn: () => settingsService.getCountriesList({ page: 1, limit: 300 }) as Promise<CountryRecord[]>,
    staleTime: 1000 * 60 * 30,
  });

  const countries = query.data ?? [];

  const countryOptions = useMemo<SelectOption[]>(() => {
    const labels = countries
      .map(getCountryLabel)
      .filter(Boolean);
    return [...new Set(labels)]
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ label, value: label }));
  }, [countries]);

  const nationalityOptions = useMemo<SelectOption[]>(() => {
    const labels = countries
      .map((item) => (item.nationality || '').trim())
      .filter(Boolean);
    return [...new Set(labels)]
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ label, value: label }));
  }, [countries]);

  return {
    countries,
    countryOptions,
    nationalityOptions,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
