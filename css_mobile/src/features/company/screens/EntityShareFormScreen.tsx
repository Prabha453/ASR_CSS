import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { useToast } from '@/shared/components/common/ToastProvider';
import { OptionPicker, SearchableSelect, SelectOption, TextInput } from '@/shared/components/formInputs';
import { SettingsDetailLayout, SettingsSaveBar } from '@/features/settings/components';
import { useCountriesOptions } from '@/features/settings/hooks/useCountriesOptions';
import { masterDataService } from '@/features/settings/services/masterData.service';
import { MASTER_RESOURCES } from '@/features/settings/constants/masterData.constants';
import { ENTITY_SHARE_TRANSACTION_TYPES, ENTITY_SHARE_TYPE_OPTIONS } from '../constants/entityShare.constants';
import { entityShareService } from '../services/entityShare.service';
import { EntityShareFormData, EntitySharePayload } from '../types/entityShare.types';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'EntityShareForm'>;

type FieldErrors = Partial<Record<keyof EntityShareFormData, string>>;

const EMPTY_FORM: EntityShareFormData = {
  currency: '',
  share_class_id: '',
  share_type: 'NORMAL',
  number_of_shares: '',
  authorized_share_capital: '',
  issued_share_capital: '',
  paid_up_capital: '',
  guarantee_amount: '',
  date_of_transaction: '',
  transaction_type: 'allotment',
  remarks: '',
};

const SHARE_CLASS_CONFIG = MASTER_RESOURCES.find((item) => item.id === 'share-class');

export function EntityShareFormScreen({ navigation, route }: Props) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { entityId, shareId, isGuarantee = false, isAuthorizedCapital = false } = route.params;
  const isEdit = Boolean(shareId);

  const [form, setForm] = useState<EntityShareFormData>({
    ...EMPTY_FORM,
    share_type: isGuarantee ? 'GUARANTEE' : 'NORMAL',
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const { data: share, isLoading } = useQuery({
    queryKey: ['entity-share', shareId],
    queryFn: () => entityShareService.getById(shareId as number),
    enabled: isEdit,
  });

  const { data: shareClasses = [] } = useQuery({
    queryKey: ['share-classes'],
    queryFn: async () => {
      if (!SHARE_CLASS_CONFIG) return [];
      const result = await masterDataService.getList(SHARE_CLASS_CONFIG, 1, 200);
      return result.data ?? [];
    },
  });

  const { countries } = useCountriesOptions();

  const currencyOptions = useMemo<SelectOption[]>(() => {
    const codes = [...new Set(countries.map((item) => item.currency_code).filter(Boolean))].sort();
    return codes.map((code) => ({ label: code as string, value: code as string }));
  }, [countries]);

  const shareClassOptions = useMemo<SelectOption[]>(() => {
    return shareClasses
      .filter((item) => {
        const name = String(item.sc_name ?? '');
        return isGuarantee ? /guarantee/i.test(name) : !/guarantee/i.test(name);
      })
      .map((item) => ({
        label: `${item.sc_name ?? `Class ${item.sc_id}`}${item.sc_type ? ` · ${item.sc_type}` : ''}`,
        value: String(item.sc_id),
      }));
  }, [shareClasses, isGuarantee]);

  const transactionOptions = useMemo<SelectOption[]>(
    () => ENTITY_SHARE_TRANSACTION_TYPES.map((item) => ({ label: item.label, value: item.value })),
    [],
  );

  useEffect(() => {
    if (!share) return;
    setForm({
      currency: share.currency ?? '',
      share_class_id: String(share.share_class_id ?? ''),
      share_type: share.share_type ?? 'NORMAL',
      number_of_shares: share.number_of_shares != null ? String(share.number_of_shares) : '',
      authorized_share_capital:
        share.authorized_share_capital != null ? String(share.authorized_share_capital) : '',
      issued_share_capital: share.issued_share_capital != null ? String(share.issued_share_capital) : '',
      paid_up_capital: share.paid_up_capital != null ? String(share.paid_up_capital) : '',
      guarantee_amount: share.guarantee_amount != null ? String(share.guarantee_amount) : '',
      date_of_transaction: share.date_of_transaction ?? '',
      transaction_type: isEdit ? 'share-increase' : 'allotment',
      remarks: '',
    });
  }, [share, isEdit]);

  const mutation = useMutation({
    mutationFn: (payload: EntitySharePayload) =>
      isEdit ? entityShareService.update(shareId as number, payload) : entityShareService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['entity-shares', entityId] });
      showToast(isEdit ? 'Share updated successfully.' : 'Share added successfully.', { type: 'success' });
      navigation.goBack();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const updateField = (field: keyof EntityShareFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.currency) next.currency = 'Currency is required';
    if (!form.share_class_id) next.share_class_id = 'Share class is required';
    if (!form.date_of_transaction.trim()) next.date_of_transaction = 'Date of transaction is required';

    if (isGuarantee) {
      if (!form.guarantee_amount.trim()) next.guarantee_amount = 'Guarantee amount is required';
    } else {
      if (!form.number_of_shares.trim()) next.number_of_shares = 'Number of shares is required';
      if (!form.issued_share_capital.trim()) next.issued_share_capital = 'Issued share capital is required';
      if (!form.paid_up_capital.trim()) next.paid_up_capital = 'Paid-up capital is required';
      if (isAuthorizedCapital && !form.authorized_share_capital.trim()) {
        next.authorized_share_capital = 'Authorized share capital is required';
      }
      if (
        isAuthorizedCapital &&
        form.authorized_share_capital &&
        form.issued_share_capital &&
        Number(form.authorized_share_capital) > Number(form.issued_share_capital)
      ) {
        next.authorized_share_capital =
          'Authorized share capital must be equal to or less than issued share capital';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const shares = Number(form.number_of_shares) || 0;
    const paid = Number(form.paid_up_capital) || 0;
    const issued = Number(form.issued_share_capital) || 0;

    const payload: EntitySharePayload = isGuarantee
      ? {
          entity_id: entityId,
          currency: form.currency,
          share_class_id: Number(form.share_class_id),
          share_type: 'GUARANTEE',
          number_of_shares: 0,
          authorized_share_capital: 0,
          issued_share_capital: 0,
          paid_up_capital: 0,
          guarantee_amount: Number(form.guarantee_amount) || 0,
          date_of_transaction: form.date_of_transaction,
          transaction_type: form.transaction_type,
          remarks: form.remarks || undefined,
          source_from: 'MANUAL',
        }
      : {
          entity_id: entityId,
          currency: form.currency,
          share_class_id: Number(form.share_class_id),
          share_type: form.share_type,
          number_of_shares: shares,
          authorized_share_capital: Number(form.authorized_share_capital) || 0,
          issued_share_capital: issued,
          paid_up_capital: paid,
          guarantee_amount: null,
          date_of_transaction: form.date_of_transaction,
          transaction_type: form.transaction_type,
          remarks: form.remarks || undefined,
          source_from: 'MANUAL',
        };

    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <SettingsDetailLayout title={isEdit ? 'Edit Share' : 'Add Share'} onBack={() => navigation.goBack()}>
        <ActivityIndicator style={styles.loader} />
      </SettingsDetailLayout>
    );
  }

  return (
    <SettingsDetailLayout title={isEdit ? 'Edit Share' : 'Add Share'} onBack={() => navigation.goBack()}>
      {isGuarantee ? (
        <View style={styles.badgeWrap}>
          <Text style={styles.badge}>Guarantee company</Text>
        </View>
      ) : null}

      <SearchableSelect
        label="Currency"
        placeholder="Select currency"
        value={form.currency}
        options={currencyOptions}
        onChange={(value) => updateField('currency', value)}
        error={errors.currency}
        required
      />
      <SearchableSelect
        label="Share Class"
        placeholder="Select share class"
        value={form.share_class_id}
        options={shareClassOptions}
        onChange={(value) => updateField('share_class_id', value)}
        error={errors.share_class_id}
        required
      />

      {isGuarantee ? (
        <TextInput
          label="Guarantee Amount"
          value={form.guarantee_amount}
          onChangeText={(value) => updateField('guarantee_amount', value)}
          keyboardType="numeric"
          error={errors.guarantee_amount}
        />
      ) : (
        <>
          <OptionPicker
            label="Share Type"
            value={form.share_type}
            options={ENTITY_SHARE_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
            onChange={(value) => updateField('share_type', value as EntityShareFormData['share_type'])}
          />
          <TextInput
            label="Number of Shares"
            value={form.number_of_shares}
            onChangeText={(value) => updateField('number_of_shares', value)}
            keyboardType="numeric"
            error={errors.number_of_shares}
          />
          {isAuthorizedCapital ? (
            <TextInput
              label="Authorized Share Capital"
              value={form.authorized_share_capital}
              onChangeText={(value) => updateField('authorized_share_capital', value)}
              keyboardType="numeric"
              error={errors.authorized_share_capital}
            />
          ) : null}
          <TextInput
            label="Issued Share Capital"
            value={form.issued_share_capital}
            onChangeText={(value) => updateField('issued_share_capital', value)}
            keyboardType="numeric"
            error={errors.issued_share_capital}
          />
          <TextInput
            label="Paid-up Capital"
            value={form.paid_up_capital}
            onChangeText={(value) => updateField('paid_up_capital', value)}
            keyboardType="numeric"
            error={errors.paid_up_capital}
          />
        </>
      )}

      <TextInput
        label="Date of Transaction"
        placeholder="YYYY-MM-DD"
        value={form.date_of_transaction}
        onChangeText={(value) => updateField('date_of_transaction', value)}
        error={errors.date_of_transaction}
      />
      <SearchableSelect
        label="Transaction Type"
        placeholder="Select transaction type"
        value={form.transaction_type}
        options={transactionOptions}
        onChange={(value) => updateField('transaction_type', value)}
      />
      <TextInput
        label="Remarks"
        value={form.remarks}
        onChangeText={(value) => updateField('remarks', value)}
        multiline
      />

      <SettingsSaveBar
        label={isEdit ? 'Update Share' : 'Add Share'}
        loading={mutation.isPending}
        onPress={handleSave}
      />
    </SettingsDetailLayout>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 24,
  },
  badgeWrap: {
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(101,89,204,0.12)',
    color: '#6559cc',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
});
