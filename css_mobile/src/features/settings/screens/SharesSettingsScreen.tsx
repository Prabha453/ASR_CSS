import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SettingsStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { SettingsSwitchRow } from '@/shared/components/common/SettingsSwitchRow';
import { useToast } from '@/shared/components/common/ToastProvider';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  SettingsDetailLayout,
  SettingsField,
  SettingsGroupSection,
  SettingsPageSummary,
  SettingsSaveBar,
} from '../components';
import {
  DEFAULT_COMPANY_PROFILE_ID,
  SHARES_SETTINGS_SCREEN_TITLES,
  SharesSettingsTabId,
} from '../constants/settings.constants';
import { settingsService } from '../services/settings.service';
import { CompanyProfileRecord } from '../types/settings.types';
import { buildShareTransactionDefaults, generateTransactionFieldName } from '../utils/shares.utils';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SharesSettings'>;

type ShareToggleField =
  | 'cp_share_certificate_payment'
  | 'cp_allotment_partial_payment_share_cert'
  | 'cp_transfer_partial_payment_share_cert'
  | 'cp_each_partial_payment_share_cert';

type SharesForm = {
  cp_share_certificate_payment: number;
  cp_allotment_partial_payment_share_cert: number;
  cp_transfer_partial_payment_share_cert: number;
  cp_each_partial_payment_share_cert: number;
  cp_share_transaction_no: Record<string, string>;
  cp_authorized_captial_countries: string[];
};

export function SharesSettingsScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const portDb = useAppSelector((state) => state.auth.portDb);
  const activeTab: SharesSettingsTabId = route.params?.tab ?? 'certificate';
  const [profile, setProfile] = useState<CompanyProfileRecord>({});
  const [countrySearch, setCountrySearch] = useState('');
  const [form, setForm] = useState<SharesForm>({
    cp_share_certificate_payment: 0,
    cp_allotment_partial_payment_share_cert: 0,
    cp_transfer_partial_payment_share_cert: 0,
    cp_each_partial_payment_share_cert: 0,
    cp_share_transaction_no: {},
    cp_authorized_captial_countries: [],
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['settings', 'shares', portDb],
    queryFn: async () => {
      const [profileData, transactions] = await Promise.all([
        settingsService.getCompanyProfile(DEFAULT_COMPANY_PROFILE_ID, portDb),
        settingsService.getTransactionTypes(),
      ]);
      const nextProfile = profileData?.profile ?? {};
      setProfile(nextProfile);
      const defaults = buildShareTransactionDefaults(transactions);
      const saved = settingsService.parseShareTransactionNo(nextProfile.cp_share_transaction_no);
      setForm({
        cp_share_certificate_payment: Number(nextProfile.cp_share_certificate_payment ?? 0),
        cp_allotment_partial_payment_share_cert: Number(
          nextProfile.cp_allotment_partial_payment_share_cert ?? 0,
        ),
        cp_transfer_partial_payment_share_cert: Number(
          nextProfile.cp_transfer_partial_payment_share_cert ?? 0,
        ),
        cp_each_partial_payment_share_cert: Number(nextProfile.cp_each_partial_payment_share_cert ?? 0),
        cp_share_transaction_no: { ...defaults, ...saved },
        cp_authorized_captial_countries: settingsService.parseAuthorizedCapitalCountries(
          nextProfile.cp_authorized_captial_countries,
        ),
      });
      return { profile: nextProfile, transactions };
    },
    enabled: Boolean(portDb),
  });

  const countriesQuery = useQuery({
    queryKey: ['settings', 'countries'],
    queryFn: () => settingsService.getCountriesList({ page: 1, limit: 300 }),
    enabled: activeTab === 'authorized-capital',
  });

  const transactions = data?.transactions ?? [];
  const enabledCertificates = useMemo(
    () =>
      [
        form.cp_share_certificate_payment,
        form.cp_allotment_partial_payment_share_cert,
        form.cp_transfer_partial_payment_share_cert,
        form.cp_each_partial_payment_share_cert,
      ].filter((value) => value === 1).length,
    [form],
  );

  const companyTransactions = useMemo(
    () => transactions.filter((item) => String(item.t_type) === '1'),
    [transactions],
  );
  const shareholderTransactions = useMemo(
    () => transactions.filter((item) => String(item.t_type) === '2'),
    [transactions],
  );

  const countryOptions = useMemo(() => {
    const list = (countriesQuery.data ?? [])
      .map((item) => item.name || item.country_name || '')
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const query = countrySearch.trim().toLowerCase();
    if (!query) return list;
    return list.filter((name) => name.toLowerCase().includes(query));
  }, [countriesQuery.data, countrySearch]);

  const userId = useAppSelector((state) => state.auth.user?.id);

  const saveMutation = useMutation({
    mutationFn: () => {
      const shareFields =
        activeTab === 'authorized-capital'
          ? { cp_authorized_captial_countries: form.cp_authorized_captial_countries }
          : activeTab === 'certificate'
            ? {
                cp_share_certificate_payment: form.cp_share_certificate_payment,
                cp_allotment_partial_payment_share_cert: form.cp_allotment_partial_payment_share_cert,
                cp_transfer_partial_payment_share_cert: form.cp_transfer_partial_payment_share_cert,
                cp_each_partial_payment_share_cert: form.cp_each_partial_payment_share_cert,
              }
            : {
                cp_share_transaction_no: form.cp_share_transaction_no,
              };

      return settingsService.updateSharesSettings(
        DEFAULT_COMPANY_PROFILE_ID,
        settingsService.buildShareSettingsPayload(profile, {
          ...shareFields,
          ...(activeTab !== 'authorized-capital'
            ? { cp_authorized_captial_countries: form.cp_authorized_captial_countries }
            : {}),
        }),
        portDb,
        userId,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      await queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      showToast('Shares settings updated successfully.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const setField = (field: ShareToggleField, enabled: boolean) => {
    setForm((current) => ({
      ...current,
      [field]: enabled ? 1 : 0,
    }));
  };

  const updateTransactionValue = (fieldName: string, value: string) => {
    setForm((current) => ({
      ...current,
      cp_share_transaction_no: {
        ...current.cp_share_transaction_no,
        [fieldName]: value,
      },
    }));
  };

  const toggleCountry = (name: string) => {
    setForm((current) => {
      const exists = current.cp_authorized_captial_countries.includes(name);
      return {
        ...current,
        cp_authorized_captial_countries: exists
          ? current.cp_authorized_captial_countries.filter((item) => item !== name)
          : [...current.cp_authorized_captial_countries, name],
      };
    });
  };

  const renderTransactionGroup = (title: string, items: typeof transactions) => (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.colors.primary }]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          No transaction types configured.
        </Text>
      ) : (
        items.map((item) => {
          const fieldName = generateTransactionFieldName(item.t_name ?? '');
          return (
            <View key={item.t_id}>
              <SettingsField
                label={`${item.t_name} Number`}
                value={form.cp_share_transaction_no[fieldName] ?? ''}
                onChangeText={(value) => updateTransactionValue(fieldName, value)}
              />
              <SettingsField
                label={`${item.t_name} Color`}
                value={form.cp_share_transaction_no[`${fieldName}_color`] ?? ''}
                onChangeText={(value) => updateTransactionValue(`${fieldName}_color`, value)}
                placeholder="#3788D8"
              />
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <SettingsDetailLayout
      title={SHARES_SETTINGS_SCREEN_TITLES[activeTab]}
      onBack={() => navigation.goBack()}
      hero={
        isLoading ? (
          <View style={styles.summaryLoader}>
            <ActivityIndicator color="#405189" />
          </View>
        ) : (
          <SettingsPageSummary
            icon="pie-chart-outline"
            iconToken="shares"
            title="Share Configuration"
            subtitle="Certificate, transfer and authorized capital"
            chips={[
              { label: 'Enabled Rules', value: String(enabledCertificates) },
              { label: 'Countries', value: String(form.cp_authorized_captial_countries.length) },
            ]}
          />
        )
      }
    >
      {isError ? (
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>
          Could not load shares settings.
        </Text>
      ) : null}

      {activeTab === 'certificate' ? (
        <SettingsGroupSection title="PAYMENT RULES">
          <SettingsSwitchRow
            label="Share Certificate Payment"
            value={form.cp_share_certificate_payment === 1}
            onValueChange={(enabled) => setField('cp_share_certificate_payment', enabled)}
          />
          <SettingsSwitchRow
            label="Allotment Partial Payment Share Cert"
            value={form.cp_allotment_partial_payment_share_cert === 1}
            onValueChange={(enabled) => setField('cp_allotment_partial_payment_share_cert', enabled)}
          />
          <SettingsSwitchRow
            label="Transfer Partial Payment Share Cert"
            value={form.cp_transfer_partial_payment_share_cert === 1}
            onValueChange={(enabled) => setField('cp_transfer_partial_payment_share_cert', enabled)}
          />
          <SettingsSwitchRow
            label="Each Partial Payment Share Cert"
            value={form.cp_each_partial_payment_share_cert === 1}
            onValueChange={(enabled) => setField('cp_each_partial_payment_share_cert', enabled)}
            showDivider={false}
          />
        </SettingsGroupSection>
      ) : null}

      {activeTab === 'transfer' ? (
        <>
          {renderTransactionGroup('Company Level', companyTransactions)}
          {renderTransactionGroup('Shareholder Level', shareholderTransactions)}
        </>
      ) : null}

      {activeTab === 'authorized-capital' ? (
        <SettingsGroupSection title="AUTHORIZED CAPITAL COUNTRIES">
          <Text style={[textStyles.description, styles.hint, { color: theme.colors.textMuted }]}>
            Select countries where authorized capital fields appear on entity shares.
          </Text>

          {form.cp_authorized_captial_countries.length > 0 ? (
            <View style={styles.selectedWrap}>
              {form.cp_authorized_captial_countries.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => toggleCountry(name)}
                  style={[styles.chip, { backgroundColor: `${theme.colors.primary}14` }]}
                >
                  <Text style={[styles.chipText, { color: theme.colors.primary }]}>{name}</Text>
                  <Ionicons name="close" size={14} color={theme.colors.primary} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <TextInput
            value={countrySearch}
            onChangeText={setCountrySearch}
            placeholder="Search countries…"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.search,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              },
            ]}
          />

          {countriesQuery.isLoading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <ScrollView style={styles.countryList} nestedScrollEnabled>
              {countryOptions.map((name) => {
                const selected = form.cp_authorized_captial_countries.includes(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => toggleCountry(name)}
                    style={[
                      styles.countryRow,
                      { borderBottomColor: theme.colors.border },
                      selected && { backgroundColor: `${theme.colors.primary}08` },
                    ]}
                  >
                    <Text style={[textStyles.body, { color: theme.colors.text, flex: 1 }]}>{name}</Text>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={selected ? theme.colors.primary : theme.colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Text style={[textStyles.description, { color: theme.colors.textMuted, marginTop: 8 }]}>
            {form.cp_authorized_captial_countries.length}{' '}
            {form.cp_authorized_captial_countries.length === 1 ? 'country' : 'countries'} selected
          </Text>
        </SettingsGroupSection>
      ) : null}

      <SettingsSaveBar loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
    </SettingsDetailLayout>
  );
}

const styles = StyleSheet.create({
  errorText: { marginBottom: 12, fontSize: 13 },
  summaryLoader: { paddingVertical: 20, alignItems: 'center', backgroundColor: '#fff' },
  group: { marginBottom: 16 },
  groupTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 13, marginBottom: 8 },
  hint: { marginBottom: 12, paddingHorizontal: 4 },
  selectedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  search: {
    borderWidth: 1,
    borderRadius: designSystem.formRadius,
    height: designSystem.formHeight,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  countryList: {
    maxHeight: 320,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
});
