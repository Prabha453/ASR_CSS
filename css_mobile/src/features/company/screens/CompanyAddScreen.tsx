import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { TextInput as FormTextInput, SearchableSelect } from '@/shared/components/formInputs';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { KeyboardAwareForm } from '@/shared/components/layout/KeyboardAwareForm';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useToast } from '@/shared/components/common/ToastProvider';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useCountriesOptions } from '@/features/settings/hooks/useCountriesOptions';
import { COMPANY_STATUS_META } from '../constants/company.constants';
import { COMPANY_WIZARD_STEPS } from '../constants/companyView.constants';
import { CompanyStatusPicker } from '../components/CompanyStatusPicker';
import { CompanyWizardStepper } from '../components/CompanyWizardStepper';
import { COMPANY_KPIS_QUERY_KEY } from '../hooks/useCompanyKpis';
import { companyService } from '../services/company.service';
import { CompanyFormData } from '../types/company.types';
import {
  buildCompanyPayload,
  EMPTY_COMPANY_FORM,
  mapCompanyToForm,
} from '../utils/company.utils';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'CompanyAdd'>;

export function CompanyAddScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const entityId = route.params?.entityId;
  const isEdit = Boolean(entityId);
  const { countryOptions } = useCountriesOptions();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CompanyFormData>(EMPTY_COMPANY_FORM);
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const { data: existingCompany, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', 'detail', entityId],
    queryFn: () => companyService.getById(entityId as number),
    enabled: isEdit && Boolean(entityId),
  });

  useEffect(() => {
    if (existingCompany) {
      setForm(mapCompanyToForm(existingCompany));
    }
  }, [existingCompany]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildCompanyPayload(form, userId, isEdit);
      if (isEdit && entityId) {
        return companyService.update(entityId, payload);
      }
      return companyService.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['company'] });
      await queryClient.invalidateQueries({ queryKey: COMPANY_KPIS_QUERY_KEY });
      if (isEdit && entityId) {
        await queryClient.invalidateQueries({ queryKey: ['company', 'detail', entityId] });
      }
      showToast(
        isEdit ? 'Company details were saved successfully.' : 'The company was created successfully.',
        { type: 'success' },
      );
      navigation.goBack();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const updateForm = (patch: Partial<CompanyFormData>) => {
    setForm((current) => ({ ...current, ...patch }));
    if ('name' in patch && nameError) {
      setNameError(undefined);
    }
  };

  const stepMeta = COMPANY_WIZARD_STEPS[step - 1];
  const statusLabel = COMPANY_STATUS_META[form.status]?.label ?? form.status;

  const handleNext = () => {
    if (step === 1 && !form.name.trim()) {
      setNameError('Entity name is required');
      return;
    }

    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    saveMutation.mutate();
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <>
          <FormTextInput
            label="Entity Name"
            required
            error={nameError}
            value={form.name}
            onChangeText={(name) => updateForm({ name })}
            placeholder="Enter company name"
          />
          <FormTextInput
            label="Former Name"
            value={form.former_name}
            onChangeText={(former_name) => updateForm({ former_name })}
            placeholder="Former name"
          />
          <FormTextInput
            label="UEN / Reg No."
            value={form.uen_no}
            onChangeText={(uen_no) => updateForm({ uen_no })}
            placeholder="Enter UEN"
          />
          <FormTextInput
            label="Client No."
            value={form.client_no}
            onChangeText={(client_no) => updateForm({ client_no })}
            placeholder="Enter client no."
          />
          <SearchableSelect
            label="Country"
            value={form.country}
            options={countryOptions}
            onChange={(country) => updateForm({ country })}
            placeholder="Select country…"
          />
          <CompanyStatusPicker value={form.status} onChange={(status) => updateForm({ status })} />
          <FormTextInput
            label="Remarks"
            value={form.remarks}
            onChangeText={(remarks) => updateForm({ remarks })}
            placeholder="Optional remarks"
            multiline
          />
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <FormTextInput
            label="Block No."
            value={form.block_no}
            onChangeText={(block_no) => updateForm({ block_no })}
            placeholder="Block number"
          />
          <FormTextInput
            label="Street Name"
            value={form.street_name}
            onChangeText={(street_name) => updateForm({ street_name })}
            placeholder="Street / building"
          />
          <FormTextInput
            label="Building Name"
            value={form.building_name}
            onChangeText={(building_name) => updateForm({ building_name })}
            placeholder="Building"
          />
          <FormTextInput
            label="City"
            value={form.city}
            onChangeText={(city) => updateForm({ city })}
            placeholder="City"
          />
          <FormTextInput
            label="State"
            value={form.state}
            onChangeText={(state) => updateForm({ state })}
            placeholder="State"
          />
          <FormTextInput
            label="Postal Code"
            value={form.postal_code}
            onChangeText={(postal_code) => updateForm({ postal_code })}
            placeholder="Postal code"
            keyboardType="numeric"
          />
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <FormTextInput
            label="Email"
            value={form.email}
            onChangeText={(email) => updateForm({ email })}
            placeholder="company@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormTextInput
            label="Phone Country Code"
            value={form.phone_country_code}
            onChangeText={(phone_country_code) => updateForm({ phone_country_code })}
            placeholder="+65"
            keyboardType="phone-pad"
          />
          <FormTextInput
            label="Mobile / Phone"
            value={form.phone}
            onChangeText={(phone) => updateForm({ phone })}
            placeholder="9123 4567"
            keyboardType="phone-pad"
          />
        </>
      );
    }

    return (
      <View style={[styles.reviewCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>Review</Text>
        <Text style={[styles.reviewLine, { color: theme.colors.text }]}>Name: {form.name || '—'}</Text>
        <Text style={[styles.reviewLine, { color: theme.colors.text }]}>UEN: {form.uen_no || '—'}</Text>
        <Text style={[styles.reviewLine, { color: theme.colors.text }]}>Client No.: {form.client_no || '—'}</Text>
        <Text style={[styles.reviewLine, { color: theme.colors.text }]}>Status: {statusLabel}</Text>
        <Text style={[styles.reviewLine, { color: theme.colors.text }]}>
          Address: {[form.block_no, form.street_name, form.city, form.postal_code].filter(Boolean).join(', ') || '—'}
        </Text>
        <Text style={[styles.reviewLine, { color: theme.colors.text }]}>Email: {form.email || '—'}</Text>
        <Text style={[styles.reviewLine, { color: theme.colors.text }]}>
          Phone: {form.phone ? `${form.phone_country_code} ${form.phone}` : '—'}
        </Text>
      </View>
    );
  };

  if (isEdit && isLoadingCompany) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading company...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title={isEdit ? 'Edit Company' : 'Add Company'}
        leftAction="back"
        onLeftPress={() => navigation.goBack()}
      />

      <KeyboardAwareForm
        contentContainerStyle={styles.body}
        footer={
          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.card,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            {step > 1 ? (
              <Pressable
                style={[
                  styles.secondaryBtn,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                ]}
                onPress={() => setStep((current) => current - 1)}
              >
                <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
                <Text style={[styles.secondaryText, { color: theme.colors.text }]}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.secondaryBtnPlaceholder} />
            )}
            <PrimaryButton
              label={step === 4 ? (isEdit ? 'Update' : 'Save') : 'Continue'}
              loading={saveMutation.isPending}
              onPress={handleNext}
              disabled={saveMutation.isPending}
              style={styles.primaryBtn}
            />
          </View>
        }
      >
        <CompanyWizardStepper currentStep={step} />
        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{stepMeta.label}</Text>
        <Text style={[styles.stepHint, { color: theme.colors.textMuted }]}>
          Step {step} of {COMPANY_WIZARD_STEPS.length}
        </Text>
        {renderStep()}
      </KeyboardAwareForm>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  body: {
    padding: designSystem.screenPadding,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepHint: {
    fontSize: 11,
    marginBottom: 12,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: designSystem.cardRadius,
    padding: 14,
    gap: 8,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  reviewLine: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: designSystem.screenPadding,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderRadius: designSystem.formRadius,
    height: designSystem.formHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnPlaceholder: {
    flex: 1,
  },
  secondaryText: {
    fontSize: designSystem.formFontSize,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 2,
  },
});
