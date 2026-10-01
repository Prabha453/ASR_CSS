import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { useToast } from '@/shared/components/common/ToastProvider';
import { CustomSelect, PasswordInput, SelectOption, TextInput } from '@/shared/components/formInputs';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SettingsDetailLayout, SettingsSaveBar } from '@/features/settings/components';
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../constants/user.constants';
import { useUserGroups } from '../hooks/useUserGroups';
import { userService } from '../services/user.service';
import { UserFormData } from '../types/user.types';
import { buildUserPayload, EMPTY_USER_FORM, mapUserToForm } from '../utils/user.utils';

type Props = NativeStackScreenProps<UsersStackParamList, 'UserForm'>;

type FieldErrors = Partial<Record<keyof UserFormData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserFormScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const userId = route.params?.userId;
  const isEdit = Boolean(userId);

  const [form, setForm] = useState<UserFormData>(EMPTY_USER_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});

  const { data: groups } = useUserGroups();
  const groupOptions = useMemo<SelectOption[]>(
    () => [
      { label: 'No Group', value: '' },
      ...(groups ?? []).map((group) => ({
        label: group.group_name ?? `Group ${group.user_group_id}`,
        value: String(group.user_group_id),
      })),
    ],
    [groups],
  );

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'detail', userId],
    queryFn: () => userService.getById(userId as number),
    enabled: isEdit,
  });

  useEffect(() => {
    if (user) {
      setForm(mapUserToForm(user));
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = buildUserPayload(form, currentUserId, isEdit);
      return isEdit ? userService.update(userId as number, payload) : userService.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      showToast(isEdit ? 'User updated successfully.' : 'User created successfully.', {
        type: 'success',
      });
      navigation.goBack();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const updateField = (field: keyof UserFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }) as UserFormData);
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.first_name.trim()) next.first_name = 'First name is required';
    if (!form.last_name.trim()) next.last_name = 'Last name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Enter a valid email';
    if (!form.user_name.trim()) next.user_name = 'Username is required';
    else if (form.user_name.trim().length < 3) next.user_name = 'Username must be at least 3 characters';

    if (!isEdit && !form.user_password.trim()) {
      next.user_password = 'Password is required';
    }
    if (form.user_password.trim()) {
      if (form.user_password.trim().length < 6) {
        next.user_password = 'Password must be at least 6 characters';
      } else if (form.user_password !== form.confirm_password) {
        next.confirm_password = 'Passwords do not match';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    mutation.mutate();
  };

  if (isEdit && isLoading) {
    return (
      <SettingsDetailLayout title="Edit User" onBack={() => navigation.goBack()}>
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SettingsDetailLayout>
    );
  }

  return (
    <SettingsDetailLayout title={isEdit ? 'Edit User' : 'Add User'} onBack={() => navigation.goBack()}>
      <TextInput
        label="First Name"
        placeholder="Enter first name"
        value={form.first_name}
        onChangeText={(value) => updateField('first_name', value)}
        error={errors.first_name}
        required
      />
      <TextInput
        label="Last Name"
        placeholder="Enter last name"
        value={form.last_name}
        onChangeText={(value) => updateField('last_name', value)}
        error={errors.last_name}
        required
      />
      <TextInput
        label="Email"
        placeholder="Enter email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={form.email}
        onChangeText={(value) => updateField('email', value)}
        error={errors.email}
        required
      />
      <TextInput
        label="Username"
        placeholder="Enter username"
        autoCapitalize="none"
        autoCorrect={false}
        value={form.user_name}
        onChangeText={(value) => updateField('user_name', value)}
        error={errors.user_name}
        required
      />
      <PasswordInput
        label={isEdit ? 'New Password' : 'Password'}
        placeholder={isEdit ? 'Leave blank to keep current' : 'Enter password'}
        value={form.user_password}
        onChangeText={(value) => updateField('user_password', value)}
        error={errors.user_password}
        required={!isEdit}
      />
      <PasswordInput
        label="Confirm Password"
        placeholder="Re-enter password"
        value={form.confirm_password}
        onChangeText={(value) => updateField('confirm_password', value)}
        error={errors.confirm_password}
      />

      <CustomSelect
        label="Role"
        options={USER_ROLE_OPTIONS}
        value={form.user_role}
        onChange={(value) => updateField('user_role', value)}
      />
      <CustomSelect
        label="User Group"
        placeholder="Select group..."
        options={groupOptions}
        value={form.user_group_id}
        onChange={(value) => updateField('user_group_id', value)}
      />
      <CustomSelect
        label="Status"
        options={USER_STATUS_OPTIONS}
        value={form.user_status}
        onChange={(value) => updateField('user_status', value)}
      />

      <TextInput
        label="Department"
        placeholder="Enter department"
        value={form.department}
        onChangeText={(value) => updateField('department', value)}
      />
      <TextInput
        label="Designation"
        placeholder="Enter designation"
        value={form.designation}
        onChangeText={(value) => updateField('designation', value)}
      />

      <SettingsSaveBar
        label={isEdit ? 'Update User' : 'Create User'}
        loading={mutation.isPending}
        onPress={handleSubmit}
      />
    </SettingsDetailLayout>
  );
}

const styles = StyleSheet.create({
  loader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
