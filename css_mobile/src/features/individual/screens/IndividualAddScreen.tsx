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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { SettingsSwitchRow } from '@/shared/components/common';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useToast } from '@/shared/components/common/ToastProvider';
import { OptionPicker, DatePickerField, SearchableSelect, TextInput } from '@/shared/components/formInputs';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { KeyboardAwareForm } from '@/shared/components/layout/KeyboardAwareForm';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useCountriesOptions } from '@/features/settings/hooks/useCountriesOptions';
import {
  INDIVIDUAL_WIZARD_STEPS,
} from '../constants/individual.constants';
import {
  IndividualGenderPicker,
  IndividualRiskPicker,
  IndividualStatusPicker,
  IndividualWizardStepper,
} from '../components';
import { INDIVIDUAL_KPIS_QUERY_KEY } from '../hooks/useIndividualKpis';
import { individualService } from '../services/individual.service';
import { IndividualAddressForm, IndividualFormData } from '../types/individual.types';
import {
  buildIndividualPayload,
  EMPTY_INDIVIDUAL_FORM,
  formatIndividualDate,
  mapIndividualToForm,
} from '../utils/individual.utils';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'IndividualAdd'>;

export function IndividualAddScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const entityId = route.params?.entityId;
  const isEdit = Boolean(entityId);
  const { countryOptions, nationalityOptions } = useCountriesOptions();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IndividualFormData>(EMPTY_INDIVIDUAL_FORM);
  const [nameError, setNameError] = useState<string | undefined>();
  const [addressTab, setAddressTab] = useState<'contact' | 'residential' | 'foreign'>('contact');

  const { data: existing, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['individual', 'detail', entityId],
    queryFn: () => individualService.getById(entityId as number),
    enabled: isEdit && Boolean(entityId),
  });

  useEffect(() => {
    if (existing) setForm(mapIndividualToForm(existing));
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildIndividualPayload(form, userId, isEdit);
      if (isEdit && entityId) return individualService.update(entityId, payload);
      return individualService.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['individual'] });
      await queryClient.invalidateQueries({ queryKey: INDIVIDUAL_KPIS_QUERY_KEY });
      if (isEdit && entityId) {
        await queryClient.invalidateQueries({ queryKey: ['individual', 'detail', entityId] });
      }
      showToast(
        isEdit ? 'Individual details were saved.' : 'Individual was created successfully.',
        { type: 'success' },
      );
      navigation.goBack();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const updateForm = (patch: Partial<IndividualFormData>) => {
    setForm((current) => ({ ...current, ...patch }));
    if ('name' in patch && nameError) setNameError(undefined);
  };

  const updateAddress = (
    key: 'contact_address' | 'residential_address' | 'foreign_address',
    patch: Partial<IndividualAddressForm>,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  };

  const updateIdEntry = (index: number, patch: Partial<(typeof form.id_entries)[number]>) => {
    setForm((current) => ({
      ...current,
      id_entries: current.id_entries.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setNameError('Full name is required');
      setStep(1);
      return;
    }
    saveMutation.mutate();
  };

  const handleNext = () => {
    if (step === 1 && !form.name.trim()) {
      setNameError('Full name is required');
      return;
    }
    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }
    saveMutation.mutate();
  };

  const stepMeta = INDIVIDUAL_WIZARD_STEPS[step - 1];
  const activeAddressKey =
    addressTab === 'contact'
      ? 'contact_address'
      : addressTab === 'residential'
        ? 'residential_address'
        : 'foreign_address';
  const activeAddress = form[activeAddressKey];
  const idEntry = form.id_entries[0];

  const ReviewRow = ({ label, value }: { label: string; value?: string | null }) => (
    <View style={styles.reviewRow}>
      <Text style={[styles.reviewLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.reviewValue, { color: theme.colors.text }]}>
        {value?.trim() ? value : '—'}
      </Text>
    </View>
  );

  const renderStep = () => {
    if (step === 1) {
      return (
        <>
          <TextInput
            label="Full Name"
            required
            error={nameError}
            value={form.name}
            onChangeText={(name) => updateForm({ name })}
            placeholder="Enter full name"
          />
          <TextInput
            label="Former Name"
            value={form.former_name}
            onChangeText={(former_name) => updateForm({ former_name })}
          />
          <TextInput
            label="Alias"
            value={form.alias}
            onChangeText={(alias) => updateForm({ alias })}
          />
          <IndividualGenderPicker
            value={form.gender}
            onChange={(gender) => updateForm({ gender })}
          />
          <DatePickerField
            label="Date of Birth"
            required
            value={form.dob}
            onChange={(dob) => updateForm({ dob })}
            placeholder="Select date of birth"
            maximumDate={new Date()}
          />
          <View style={styles.row}>
            <SearchableSelect
              label="Nationality"
              required
              value={form.nationality}
              options={nationalityOptions}
              onChange={(nationality) => updateForm({ nationality })}
              placeholder="Select nationality…"
              containerStyle={styles.half}
            />
            <SearchableSelect
              label="Country of Birth"
              value={form.country_of_birth}
              options={countryOptions}
              onChange={(country_of_birth) => updateForm({ country_of_birth })}
              placeholder="Select country…"
              containerStyle={styles.half}
            />
          </View>
          <IndividualStatusPicker
            value={form.status}
            onChange={(status) => updateForm({ status })}
          />
          <IndividualRiskPicker
            value={form.risk_rating}
            onChange={(risk_rating) => updateForm({ risk_rating })}
          />
          <TextInput
            label="Father's Name"
            value={form.father_name}
            onChangeText={(father_name) => updateForm({ father_name })}
          />
          <TextInput
            label="Mother's Name"
            value={form.mother_name}
            onChangeText={(mother_name) => updateForm({ mother_name })}
          />
          <TextInput
            label="Spouse's Name"
            value={form.spouse_name}
            onChangeText={(spouse_name) => updateForm({ spouse_name })}
          />
          <TextInput
            label="Notes"
            value={form.notes}
            onChangeText={(notes) => updateForm({ notes })}
            multiline
          />
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <TextInput
            label="ID Type ID"
            value={idEntry.id_type}
            onChangeText={(id_type) => updateIdEntry(0, { id_type })}
            placeholder="Member ID type id (optional)"
            keyboardType="number-pad"
          />
          <TextInput
            label="ID Number"
            required
            value={idEntry.id_number}
            onChangeText={(id_number) => updateIdEntry(0, { id_number })}
            placeholder="NRIC / Passport / etc."
          />
          <SearchableSelect
            label="Issued Country"
            value={idEntry.id_country}
            options={countryOptions}
            onChange={(id_country) => updateIdEntry(0, { id_country })}
            placeholder="Select country…"
          />
          <View style={styles.row}>
            <DatePickerField
              label="Issued Date"
              value={idEntry.id_issued_date}
              onChange={(id_issued_date) => updateIdEntry(0, { id_issued_date })}
              placeholder="Select date"
              containerStyle={styles.half}
            />
            <DatePickerField
              label="Expiry Date"
              value={idEntry.id_expiry_date}
              onChange={(id_expiry_date) => updateIdEntry(0, { id_expiry_date })}
              placeholder="Select date"
              containerStyle={styles.half}
            />
          </View>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <TextInput
            label="Email"
            value={form.email}
            onChangeText={(email) => updateForm({ email })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.row}>
            <TextInput
              label="Code"
              value={form.mobile_code}
              onChangeText={(mobile_code) => updateForm({ mobile_code })}
              containerStyle={styles.code}
            />
            <TextInput
              label="Mobile"
              value={form.mobile}
              onChangeText={(mobile) => updateForm({ mobile })}
              keyboardType="phone-pad"
              containerStyle={styles.half}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              label="Code"
              value={form.telephone_code}
              onChangeText={(telephone_code) => updateForm({ telephone_code })}
              containerStyle={styles.code}
            />
            <TextInput
              label="Telephone"
              value={form.telephone}
              onChangeText={(telephone) => updateForm({ telephone })}
              keyboardType="phone-pad"
              containerStyle={styles.half}
            />
          </View>
          <TextInput
            label="Skype"
            value={form.skype}
            onChangeText={(skype) => updateForm({ skype })}
          />

          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 8 }]}>
            Address
          </Text>
          <View style={styles.addressTabs}>
            {(['contact', 'residential', 'foreign'] as const).map((tab) => {
              const active = addressTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setAddressTab(tab)}
                  style={[
                    styles.addressTab,
                    {
                      backgroundColor: active ? theme.colors.primary : theme.colors.background,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? '#fff' : theme.colors.textMuted,
                      fontSize: 12,
                      fontWeight: '700',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <OptionPicker
            label="Default address"
            value={form.default_address}
            options={[
              { label: 'Contact', value: 'contact' },
              { label: 'Residential', value: 'residential' },
              { label: 'Foreign', value: 'foreign' },
            ]}
            onChange={(value) =>
              updateForm({ default_address: value as IndividualFormData['default_address'] })
            }
          />
          <TextInput
            label="Block / House No."
            value={activeAddress.block_no}
            onChangeText={(block_no) => updateAddress(activeAddressKey, { block_no })}
          />
          <TextInput
            label="Street Name"
            value={activeAddress.street_name}
            onChangeText={(street_name) => updateAddress(activeAddressKey, { street_name })}
          />
          <TextInput
            label="Building"
            value={activeAddress.building_name}
            onChangeText={(building_name) => updateAddress(activeAddressKey, { building_name })}
          />
          <View style={styles.row}>
            <TextInput
              label="Postal Code"
              value={activeAddress.postal_code}
              onChangeText={(postal_code) => updateAddress(activeAddressKey, { postal_code })}
              containerStyle={styles.half}
            />
            <SearchableSelect
              label="Country"
              value={activeAddress.country}
              options={countryOptions}
              onChange={(country) => updateAddress(activeAddressKey, { country })}
              placeholder="Select country…"
              containerStyle={styles.half}
            />
          </View>
          <TextInput
            label="City"
            value={activeAddress.city}
            onChangeText={(city) => updateAddress(activeAddressKey, { city })}
          />
        </>
      );
    }

    return (
      <>
        <View style={[styles.reviewCard, { backgroundColor: theme.colors.card }]}>
          <ReviewRow label="Full Name" value={form.name} />
          <ReviewRow label="Gender" value={form.gender} />
          <ReviewRow label="Date of Birth" value={formatIndividualDate(form.dob)} />
          <ReviewRow label="Nationality" value={form.nationality} />
          <ReviewRow label="Status" value={form.status} />
          <ReviewRow label="Risk" value={form.risk_rating} />
          <ReviewRow label="ID Number" value={idEntry.id_number} />
          <ReviewRow label="Email" value={form.email} />
          <ReviewRow
            label="Mobile"
            value={form.mobile ? `${form.mobile_code} ${form.mobile}` : ''}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notice preferences</Text>
        <View style={[styles.consentCard, { backgroundColor: theme.colors.card }]}>
          <SettingsSwitchRow
            label="Email notices"
            value={form.notice_email}
            onValueChange={(notice_email) => updateForm({ notice_email })}
          />
          <SettingsSwitchRow
            label="App notifications"
            value={form.notice_app}
            onValueChange={(notice_app) => updateForm({ notice_app })}
          />
          <SettingsSwitchRow
            label="WhatsApp notices"
            value={form.notice_whatsapp}
            onValueChange={(notice_whatsapp) => updateForm({ notice_whatsapp })}
            showDivider={false}
          />
        </View>
      </>
    );
  };

  if (isEdit && isLoadingExisting) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <AppHeader
          title="Edit Individual"
          leftAction="back"
          onLeftPress={() => navigation.goBack()}
        />
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title={isEdit ? 'Edit Individual' : 'Add Individual'}
        subtitle={isEdit ? 'Update individual details' : 'Create a new individual'}
        titleAlign="left"
        leftAction="back"
        onLeftPress={() => navigation.goBack()}
        rightAction={
          <Pressable onPress={handleSave} hitSlop={8}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save</Text>
          </Pressable>
        }
      />

      <KeyboardAwareForm
        contentContainerStyle={{
          ...styles.content,
          paddingBottom: insets.bottom + 24,
        }}
        footer={
          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.card,
                borderTopColor: theme.colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            {step > 1 ? (
              <Pressable
                style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
                onPress={() => setStep((current) => current - 1)}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Back</Text>
              </Pressable>
            ) : null}
            <PrimaryButton
              onPress={handleNext}
              loading={saveMutation.isPending}
              style={styles.primaryBtn}
              label={step < 4 ? 'Next' : isEdit ? 'Save Changes' : 'Create Individual'}
            />
          </View>
        }
      >
        <IndividualWizardStepper currentStep={step} />
        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{stepMeta.label}</Text>
        <Text style={[styles.stepHint, { color: theme.colors.textMuted }]}>
          Step {step} of {INDIVIDUAL_WIZARD_STEPS.length}
        </Text>
        {renderStep()}
      </KeyboardAwareForm>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: designSystem.screenPadding,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  code: {
    width: 88,
  },
  addressTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addressTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  reviewCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef0f2',
  },
  reviewLabel: {
    fontSize: 13,
  },
  reviewValue: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  consentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: designSystem.screenPadding,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtn: {
    minWidth: 88,
    height: designSystem.formHeight,
    borderWidth: 1,
    borderRadius: designSystem.formRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtn: {
    flex: 1,
  },
});
