import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { DEFAULT_COMPANY_PROFILE_ID } from '@/features/settings/constants/settings.constants';
import { settingsService } from '@/features/settings/services/settings.service';
import { Company } from '../types/company.types';
import { entityShareService } from '../services/entityShare.service';
import {
  getEffectiveDecimals,
  isAuthorizedCapitalCountry,
  isGuaranteeCompany,
  parseAuthorizedCapitalCountries,
} from '../utils/entityShare.utils';

export function useEntityShareContext(company?: Company | null) {
  const portDb = useAppSelector((state) => state.auth.portDb);

  const profileQuery = useQuery({
    queryKey: ['company-profile', 'decimals', portDb],
    queryFn: () => settingsService.getCompanyProfile(DEFAULT_COMPANY_PROFILE_ID, portDb),
  });

  const entityDecimalsQuery = useQuery({
    queryKey: ['entity-share-decimals', company?.entity_id],
    queryFn: () => entityShareService.getDecimalSettings(company!.entity_id),
    enabled: Boolean(company?.entity_id),
  });

  const profile = profileQuery.data?.profile;
  const authorizedCountries = parseAuthorizedCapitalCountries(
    profile?.cp_authorized_captial_countries,
  );

  const globalDecimals = {
    shares: profile?.cp_no_of_share_decimal_place ?? 0,
    paid: profile?.cp_paid_up_share_decimal_place ?? 0,
    issued: profile?.cp_issued_share_decimal_place ?? 0,
  };

  const effectiveDecimals = getEffectiveDecimals(globalDecimals, entityDecimalsQuery.data);

  return {
    isLoading: profileQuery.isLoading || entityDecimalsQuery.isLoading,
    isGuarantee: isGuaranteeCompany(company),
    isAuthorizedCapital: isAuthorizedCapitalCountry(company, authorizedCountries),
    effectiveDecimals,
    globalDecimals,
    entityDecimals: entityDecimalsQuery.data ?? null,
    authorizedCountries,
  };
}
