import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingsStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { EditIcon } from '@/shared/components/common/EditIcon';
import { useToast } from '@/shared/components/common/ToastProvider';
import { useTheme } from '@/shared/theme/ThemeContext';
import { designSystem } from '@/shared/theme/designSystem';
import { formInputLayout } from '@/shared/components/formInputs/formInputStyles';
import { SearchableSelect } from '@/shared/components/formInputs';
import {
  SettingsDetailLayout,
  SettingsField,
  SettingsPageSummary,
  SettingsInfoRow,
  SettingsInfoSection,
  SettingsSaveBar,
} from '../components';
import {
  COMPANY_PROFILE_SCREEN_TITLES,
  CompanyProfileTabId,
  DEFAULT_COMPANY_PROFILE_ID,
  THEME_STYLE_OPTIONS,
} from '../constants/settings.constants';
import { useCountriesOptions } from '../hooks/useCountriesOptions';
import { settingsService } from '../services/settings.service';
import {
  CompanyEmailConfig,
  CompanyProfileContact,
  CompanyProfileRecord,
} from '../types/settings.types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'CompanyProfile'>;

type CompanyProfileForm = {
  profile: CompanyProfileRecord;
  emails: string[];
  replies: string[];
  phones: string[];
  emailConfigs: CompanyEmailConfig[];
};

function toFlag(value: boolean) {
  return value ? 1 : 0;
}

function fromFlag(value?: number | boolean) {
  return value === true || value === 1;
}

function themeStyleLabel(value?: string) {
  return THEME_STYLE_OPTIONS.find((option) => option.value === (value ?? 'custom'))?.label ?? value ?? '—';
}

function mapToForm(data?: {
  profile?: CompanyProfileRecord;
  contacts?: CompanyProfileContact[];
  emailConfigs?: CompanyEmailConfig[];
}): CompanyProfileForm {
  const contacts = data?.contacts ?? [];
  const profile = data?.profile ?? {};
  return {
    profile,
    emails: contacts.map((item) => item.email_id ?? '').filter(Boolean).length
      ? contacts.map((item) => item.email_id ?? '')
      : [''],
    replies: contacts.map((item) => item.reply_id ?? '').filter(Boolean).length
      ? contacts.map((item) => item.reply_id ?? '')
      : [''],
    phones: contacts.map((item) => item.phone_no ?? '').filter(Boolean).length
      ? contacts.map((item) => item.phone_no ?? '')
      : [''],
    emailConfigs: data?.emailConfigs?.length
      ? data.emailConfigs
      : [{ from_name: '', smtp_email: '', reply_email: '', aws_ses: 0, group_to_recipient: 0 }],
  };
}

export function CompanyProfileScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const portDb = useAppSelector((state) => state.auth.portDb);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const activeTab: CompanyProfileTabId = route.params?.tab ?? 'company';
  const [form, setForm] = useState<CompanyProfileForm>(mapToForm());
  const [fieldErrors, setFieldErrors] = useState<{ cp_company_name?: string; cp_currency?: string }>({});
  const { countryOptions } = useCountriesOptions();

  const { isLoading, isError } = useQuery({
    queryKey: ['settings', 'company-profile', portDb],
    queryFn: async () => {
      const response = await settingsService.getCompanyProfile(DEFAULT_COMPANY_PROFILE_ID, portDb);
      setForm(mapToForm(response));
      return response;
    },
    enabled: Boolean(portDb),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        ...form.profile,
        cp_registered_client: toFlag(fromFlag(form.profile.cp_registered_client)),
        cp_mailling_address: toFlag(fromFlag(form.profile.cp_mailling_address)),
        cp_caps_proper: toFlag(fromFlag(form.profile.cp_caps_proper)),
        cp_email_id: form.emails.filter(Boolean),
        cp_reply_id: form.replies.filter(Boolean),
        cp_contact_number: form.phones.filter(Boolean),
        cp_email_config: form.emailConfigs
          .filter((item) => item.from_name || item.smtp_email || item.reply_email)
          .map((item) => ({
            email_config_id: item.email_config_id,
            from_name: item.from_name ?? '',
            smtp_email: item.smtp_email ?? item.sending_email ?? '',
            reply_email: item.reply_email ?? '',
            aws_ses: fromFlag(item.aws_ses),
            sending_default_email: fromFlag(item.is_default),
            group_to_recipient: Number(item.group_to_recipient ?? 0),
          })),
      };
      return settingsService.updateCompanyProfile(
        DEFAULT_COMPANY_PROFILE_ID,
        payload,
        portDb,
        userId,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsEditing(false);
      showToast('Company profile updated successfully.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const updateProfile = (patch: Partial<CompanyProfileRecord>) => {
    setForm((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
    const touched = Object.keys(patch);
    if (touched.includes('cp_company_name') || touched.includes('cp_currency')) {
      setFieldErrors((current) => {
        const next = { ...current };
        if (touched.includes('cp_company_name')) delete next.cp_company_name;
        if (touched.includes('cp_currency')) delete next.cp_currency;
        return next;
      });
    }
  };

  const handleSave = () => {
    const errors: { cp_company_name?: string; cp_currency?: string } = {};
    if (!form.profile.cp_company_name?.trim()) {
      errors.cp_company_name = 'Company name is required';
    }
    if (!form.profile.cp_currency?.trim()) {
      errors.cp_currency = 'Currency is required';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (activeTab !== 'company') {
        showToast('Please fix the required fields in Company details.', { type: 'error' });
      }
      return;
    }
    saveMutation.mutate();
  };

  const profile = form.profile;
  const heroTitle = profile.cp_company_name ?? 'Company Profile';
  const editAction = (
    <Pressable style={styles.editBtn} onPress={() => setIsEditing((current) => !current)}>
      {isEditing ? (
        <Ionicons name="close-outline" size={20} color="#fff" />
      ) : (
        <EditIcon size={20} color="#fff" />
      )}
    </Pressable>
  );

  const renderViewMode = () => (
    <>
      {activeTab === 'company' ? (
        <SettingsInfoSection title="Company Details" subtitle="Core profile and branding">
          <SettingsInfoRow label="Company Name" value={profile.cp_company_name} />
          <SettingsInfoRow label="Registration No." value={profile.cp_registration_no} />
          <SettingsInfoRow label="Port Title" value={profile.cp_port_title} />
          <SettingsInfoRow label="Currency" value={profile.cp_currency} />
          <SettingsInfoRow label="Country" value={profile.cp_country} />
          <SettingsInfoRow label="Timezone" value={profile.cp_timezone_user} />
          <SettingsInfoRow
            label="Registered Address"
            value={profile.cp_registered_address}
            multiline
          />
          <SettingsInfoRow label="Theme Style" showDivider={false}>
            <View
              style={[
                styles.themeChip,
                { backgroundColor: `${theme.colors.primary}14`, borderColor: `${theme.colors.primary}40` },
              ]}
            >
              <Text style={[styles.themeChipText, { color: theme.colors.primary }]}>
                {themeStyleLabel(profile.cp_theme_style)}
              </Text>
            </View>
          </SettingsInfoRow>
        </SettingsInfoSection>
      ) : null}

      {activeTab === 'contact' ? (
        <SettingsInfoSection title="Contact Details" subtitle="Primary communication channels">
          {(form.emails.filter(Boolean).length ? form.emails.filter(Boolean) : ['']).map((email, index, items) => (
            <SettingsInfoRow
              key={`email-${index}`}
              label={index === 0 ? 'Email' : `Email ${index + 1}`}
              value={email}
              showDivider={index < items.length - 1 || form.replies.some(Boolean) || form.phones.some(Boolean)}
            />
          ))}
          {(form.replies.filter(Boolean).length ? form.replies.filter(Boolean) : ['']).map((reply, index, items) => (
            <SettingsInfoRow
              key={`reply-${index}`}
              label={index === 0 ? 'Reply Email' : `Reply Email ${index + 1}`}
              value={reply}
              showDivider={index < items.length - 1 || form.phones.some(Boolean)}
            />
          ))}
          {(form.phones.filter(Boolean).length ? form.phones.filter(Boolean) : ['']).map((phone, index, items) => (
            <SettingsInfoRow
              key={`phone-${index}`}
              label={index === 0 ? 'Phone' : `Phone ${index + 1}`}
              value={phone}
              showDivider={index < items.length - 1}
            />
          ))}
        </SettingsInfoSection>
      ) : null}

      {activeTab === 'decimal' ? (
        <SettingsInfoSection title="Decimal Settings" subtitle="Share value precision">
          <SettingsInfoRow label="Share Decimal Places" value={String(profile.cp_no_of_share_decimal_place ?? 0)} />
          <SettingsInfoRow label="Paid-up Decimal Places" value={String(profile.cp_paid_up_share_decimal_place ?? 0)} />
          <SettingsInfoRow
            label="Issued Decimal Places"
            value={String(profile.cp_issued_share_decimal_place ?? 0)}
            showDivider={false}
          />
        </SettingsInfoSection>
      ) : null}

      {activeTab === 'email' ? (
        <SettingsInfoSection title="Email Configuration" subtitle="Outbound mail settings">
          <SettingsInfoRow label="From Name" value={form.emailConfigs[0]?.from_name} />
          <SettingsInfoRow label="SMTP Email" value={form.emailConfigs[0]?.smtp_email ?? form.emailConfigs[0]?.sending_email} />
          <SettingsInfoRow label="Reply Email" value={form.emailConfigs[0]?.reply_email} showDivider={false} />
        </SettingsInfoSection>
      ) : null}
    </>
  );

  const renderEditMode = () => (
    <>
      {activeTab === 'company' ? (
        <>
          <SettingsField label="Company Name" required error={fieldErrors.cp_company_name} value={profile.cp_company_name ?? ''} onChangeText={(cp_company_name) => updateProfile({ cp_company_name })} />
          <SettingsField label="Registration No." value={profile.cp_registration_no ?? ''} onChangeText={(cp_registration_no) => updateProfile({ cp_registration_no })} />
          <SettingsField label="Port Title" value={profile.cp_port_title ?? ''} onChangeText={(cp_port_title) => updateProfile({ cp_port_title })} />
          <SettingsField label="Currency" required error={fieldErrors.cp_currency} value={profile.cp_currency ?? ''} onChangeText={(cp_currency) => updateProfile({ cp_currency })} />
          <SearchableSelect
            label="Country"
            value={profile.cp_country ?? ''}
            options={countryOptions}
            onChange={(cp_country) => updateProfile({ cp_country })}
            placeholder="Select country…"
          />
          <SettingsField label="Registered Address" value={profile.cp_registered_address ?? ''} onChangeText={(cp_registered_address) => updateProfile({ cp_registered_address })} multiline />
          <SettingsField label="Timezone" value={profile.cp_timezone_user ?? ''} onChangeText={(cp_timezone_user) => updateProfile({ cp_timezone_user })} />
          <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Theme Style</Text>
          <View style={styles.optionRow}>
            {THEME_STYLE_OPTIONS.map((option) => {
              const active = (profile.cp_theme_style ?? 'custom') === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => updateProfile({ cp_theme_style: option.value })}
                  style={[
                    formInputLayout.chip,
                    {
                      backgroundColor: active ? theme.colors.primary : theme.colors.card,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[formInputLayout.chipText, { color: active ? '#fff' : theme.colors.text }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
      {activeTab === 'decimal' ? (
        <>
          <SettingsField label="Share Decimal Places *" value={String(profile.cp_no_of_share_decimal_place ?? 0)} onChangeText={(value) => updateProfile({ cp_no_of_share_decimal_place: Number(value || 0) })} keyboardType="numeric" />
          <SettingsField label="Paid-up Share Decimal Places *" value={String(profile.cp_paid_up_share_decimal_place ?? 0)} onChangeText={(value) => updateProfile({ cp_paid_up_share_decimal_place: Number(value || 0) })} keyboardType="numeric" />
          <SettingsField label="Issued Share Decimal Places *" value={String(profile.cp_issued_share_decimal_place ?? 0)} onChangeText={(value) => updateProfile({ cp_issued_share_decimal_place: Number(value || 0) })} keyboardType="numeric" />
        </>
      ) : null}
      {activeTab === 'contact' ? (
        <>
          <SettingsField label="Email" value={form.emails[0] ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, emails: [value] }))} keyboardType="email-address" />
          <SettingsField label="Reply Email" value={form.replies[0] ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, replies: [value] }))} keyboardType="email-address" />
          <SettingsField label="Contact Number" value={form.phones[0] ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, phones: [value] }))} />
        </>
      ) : null}
      {activeTab === 'email' ? (
        <>
          <SettingsField label="From Name" value={form.emailConfigs[0]?.from_name ?? ''} onChangeText={(from_name) => setForm((current) => ({ ...current, emailConfigs: [{ ...current.emailConfigs[0], from_name }] }))} />
          <SettingsField label="SMTP Email" value={form.emailConfigs[0]?.smtp_email ?? ''} onChangeText={(smtp_email) => setForm((current) => ({ ...current, emailConfigs: [{ ...current.emailConfigs[0], smtp_email }] }))} keyboardType="email-address" />
          <SettingsField label="Reply Email" value={form.emailConfigs[0]?.reply_email ?? ''} onChangeText={(reply_email) => setForm((current) => ({ ...current, emailConfigs: [{ ...current.emailConfigs[0], reply_email }] }))} keyboardType="email-address" />
        </>
      ) : null}
      <SettingsSaveBar loading={saveMutation.isPending} onPress={handleSave} />
    </>
  );

  return (
    <SettingsDetailLayout
      title={COMPANY_PROFILE_SCREEN_TITLES[activeTab]}
      onBack={() => navigation.goBack()}
      rightAction={editAction}
      hero={
        isLoading ? (
          <View style={styles.summaryLoader}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <SettingsPageSummary
            icon="business-outline"
            iconToken="company"
            title={heroTitle}
            badge="Active"
            subtitle={[profile.cp_currency, profile.cp_country].filter(Boolean).join(' · ') || undefined}
            chips={[
              { label: 'UEN', value: profile.cp_registration_no ?? '—' },
              {
                label: 'Client No.',
                value: profile.cp_port_title ?? `CLT${String(profile.cp_id ?? '0001').padStart(4, '0')}`,
              },
            ]}
          />
        )
      }
    >
      {isError ? <Text style={styles.errorText}>Could not load company profile.</Text> : null}
      {isEditing ? renderEditMode() : renderViewMode()}
    </SettingsDetailLayout>
  );
}

const styles = StyleSheet.create({
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#f06548',
    marginBottom: 12,
    fontSize: 13,
  },
  optionLabel: {
    fontSize: designSystem.formLabelSize,
    fontWeight: '500',
    marginBottom: designSystem.formLabelGap,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: designSystem.formFieldGap,
  },
  themeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  themeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
