import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { useToast } from '@/shared/components/common/ToastProvider';
import { TextInput } from '@/shared/components/formInputs';
import { useTheme } from '@/shared/theme/ThemeContext';
import { textStyles } from '@/shared/theme/designSystem';
import { SettingsDetailLayout, SettingsSaveBar } from '@/features/settings/components';
import { PermissionMatrix } from '../components';
import { userGroupService } from '../services/userGroup.service';
import { PermissionsMap, UserGroupFormData } from '../types/userGroup.types';
import { buildGroupPayload, EMPTY_GROUP_FORM, mapGroupToForm } from '../utils/user.utils';

type Props = NativeStackScreenProps<UsersStackParamList, 'UserGroupForm'>;

export function UserGroupFormScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const userGroupId = route.params?.userGroupId;
  const isEdit = Boolean(userGroupId);

  const [form, setForm] = useState<UserGroupFormData>(EMPTY_GROUP_FORM());
  const [nameError, setNameError] = useState<string>();

  const { data: group, isLoading } = useQuery({
    queryKey: ['user-group', 'detail', userGroupId],
    queryFn: () => userGroupService.getById(userGroupId as number),
    enabled: isEdit,
  });

  useEffect(() => {
    if (group) {
      setForm(mapGroupToForm(group));
    }
  }, [group]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = buildGroupPayload(form, currentUserId, isEdit);
      return isEdit
        ? userGroupService.update(userGroupId as number, payload)
        : userGroupService.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-group'] });
      showToast(isEdit ? 'Group updated successfully.' : 'Group created successfully.', {
        type: 'success',
      });
      navigation.goBack();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const handleSubmit = () => {
    if (!form.group_name.trim()) {
      setNameError('Group name is required');
      return;
    }
    mutation.mutate();
  };

  const setPermissions = (permissions: PermissionsMap) => {
    setForm((current) => ({ ...current, permissions }));
  };

  if (isEdit && isLoading) {
    return (
      <SettingsDetailLayout title="Edit Group" onBack={() => navigation.goBack()}>
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SettingsDetailLayout>
    );
  }

  return (
    <SettingsDetailLayout
      title={isEdit ? 'Edit Group' : 'Add Group'}
      onBack={() => navigation.goBack()}
    >
      <TextInput
        label="Group Name"
        placeholder="e.g. Manager Group"
        value={form.group_name}
        onChangeText={(value) => {
          setForm((current) => ({ ...current, group_name: value }));
          if (nameError) setNameError(undefined);
        }}
        error={nameError}
        required
      />
      <TextInput
        label="Description"
        placeholder="Brief description..."
        value={form.group_description}
        onChangeText={(value) => setForm((current) => ({ ...current, group_description: value }))}
        multiline
      />

      <Text style={[textStyles.sectionLabel, styles.sectionLabel, { color: theme.colors.textMuted }]}>
        PAGE & ACTION PERMISSIONS
      </Text>
      <PermissionMatrix value={form.permissions} onChange={setPermissions} />

      <SettingsSaveBar
        label={isEdit ? 'Update Group' : 'Create Group'}
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
  sectionLabel: {
    marginTop: 8,
    marginBottom: 10,
    marginLeft: 2,
  },
});
