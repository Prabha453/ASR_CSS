import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { SettingsStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { authService } from '@/features/auth/services/auth.service';
import { IconCircle } from '@/shared/components/common/IconCircle';
import { useToast } from '@/shared/components/common/ToastProvider';
import { PasswordInput } from '@/shared/components/formInputs';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SettingsDetailLayout, SettingsSaveBar } from '../components';

type Props = NativeStackScreenProps<SettingsStackParamList, 'ChangePassword'>;

type FormState = {
  old_password: string;
  password: string;
  confirm_password: string;
};

function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    complex: /\d/.test(password) && /[^A-Za-z0-9]/.test(password),
  };
}

export function ChangePasswordScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [form, setForm] = useState<FormState>({
    old_password: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const checks = useMemo(() => getPasswordChecks(form.password), [form.password]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('User not found');
      return authService.changePassword(userId, form);
    },
    onSuccess: (data) => {
      if (data?.status === false) {
        showToast(data.message ?? 'Could not update password.', { type: 'error' });
        return;
      }
      showToast('Your password has been changed successfully.', { type: 'success' });
      navigation.goBack();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const validate = () => {
    const nextErrors: Partial<FormState> = {};
    if (!form.old_password.trim()) nextErrors.old_password = 'Current password is required';
    if (!form.password.trim()) nextErrors.password = 'New password is required';
    if (form.password !== form.confirm_password) nextErrors.confirm_password = 'Passwords do not match';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = () => {
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <SettingsDetailLayout title="Change Password" onBack={() => navigation.goBack()}>
      <View style={styles.heroIconWrap}>
        <IconCircle name="lock-closed-outline" token="security" size={72} />
      </View>

      <PasswordInput
        label="Current Password"
        placeholder="Enter current password"
        value={form.old_password}
        onChangeText={(value) => updateField('old_password', value)}
        error={errors.old_password}
      />
      <PasswordInput
        label="New Password"
        placeholder="Enter new password"
        value={form.password}
        onChangeText={(value) => updateField('password', value)}
        error={errors.password}
      />
      <PasswordInput
        label="Confirm New Password"
        placeholder="Confirm new password"
        value={form.confirm_password}
        onChangeText={(value) => updateField('confirm_password', value)}
        error={errors.confirm_password}
      />

      <View style={[styles.checklist, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.checklistTitle, { color: theme.colors.text }]}>Password Requirements</Text>
        <ChecklistItem label="At least 8 characters long" passed={checks.length} />
        <ChecklistItem label="Includes uppercase and lowercase letters" passed={checks.case} />
        <ChecklistItem label="Includes numbers and special characters" passed={checks.complex} />
      </View>

      <SettingsSaveBar
        label="Update Password"
        loading={mutation.isPending}
        onPress={handleSubmit}
      />
    </SettingsDetailLayout>
  );
}

function ChecklistItem({ label, passed }: { label: string; passed: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={passed ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={passed ? theme.colors.success : theme.colors.textMuted}
      />
      <Text style={[styles.checkLabel, { color: passed ? theme.colors.text : theme.colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroIconWrap: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  checklist: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 10,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
