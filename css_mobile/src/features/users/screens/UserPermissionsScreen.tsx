import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersStackParamList } from '@/app/navigation/types';
import { useToast } from '@/shared/components/common/ToastProvider';
import { useTheme } from '@/shared/theme/ThemeContext';
import { textStyles } from '@/shared/theme/designSystem';
import { SettingsDetailLayout, SettingsSaveBar } from '@/features/settings/components';
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
} from '../constants/permissions.constants';
import { userService } from '../services/user.service';
import { PermissionAction, PermissionsMap } from '../types/userGroup.types';
import { parsePermissions } from '../utils/user.utils';

type Props = NativeStackScreenProps<UsersStackParamList, 'UserPermissions'>;

type OverrideState = boolean | undefined;

function getOverride(map: PermissionsMap, moduleKey: string, action: PermissionAction): OverrideState {
  const value = map?.[moduleKey]?.[action];
  return value === undefined ? undefined : Boolean(value);
}

function pruneOverrides(map: PermissionsMap): PermissionsMap {
  const next: PermissionsMap = {};
  Object.keys(map).forEach((moduleKey) => {
    const actions = map[moduleKey];
    const kept: Partial<Record<PermissionAction, boolean>> = {};
    (Object.keys(actions) as PermissionAction[]).forEach((action) => {
      if (actions[action] !== undefined) kept[action] = actions[action];
    });
    if (Object.keys(kept).length > 0) next[moduleKey] = kept;
  });
  return next;
}

export function UserPermissionsScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { userId, name } = route.params;

  const [overrides, setOverrides] = useState<PermissionsMap>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-permission', userId],
    queryFn: () => userService.getPermissions(userId),
  });

  useEffect(() => {
    if (data?.user_overrides) {
      setOverrides(JSON.parse(JSON.stringify(data.user_overrides)));
    }
  }, [data]);

  const groupPermissions = useMemo(
    () => parsePermissions(data?.group_permissions ?? {}),
    [data],
  );

  const saveMutation = useMutation({
    mutationFn: () => userService.savePermissions(userId, pruneOverrides(overrides)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-permission', userId] });
      showToast('Permissions saved successfully.', { type: 'success' });
      navigation.goBack();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const clearMutation = useMutation({
    mutationFn: () => userService.clearPermissions(userId),
    onSuccess: async () => {
      setOverrides({});
      await queryClient.invalidateQueries({ queryKey: ['user-permission', userId] });
      showToast('Overrides cleared.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const cycleCell = (moduleKey: string, action: PermissionAction) => {
    setOverrides((current) => {
      const next: PermissionsMap = JSON.parse(JSON.stringify(current));
      if (!next[moduleKey]) next[moduleKey] = {};
      const value = next[moduleKey][action];
      if (value === undefined) {
        next[moduleKey][action] = true;
      } else if (value === true) {
        next[moduleKey][action] = false;
      } else {
        delete next[moduleKey][action];
      }
      return next;
    });
  };

  const handleClear = () => {
    Alert.alert('Clear Overrides', 'Reset this user to group permissions?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearMutation.mutate() },
    ]);
  };

  if (isLoading) {
    return (
      <SettingsDetailLayout title="Permissions" onBack={() => navigation.goBack()}>
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SettingsDetailLayout>
    );
  }

  if (isError) {
    return (
      <SettingsDetailLayout title="Permissions" onBack={() => navigation.goBack()}>
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>
          Could not load permissions.
        </Text>
      </SettingsDetailLayout>
    );
  }

  return (
    <SettingsDetailLayout title="Permissions" onBack={() => navigation.goBack()}>
      {name ? (
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Overrides for {name}. Tap a cell to inherit, grant, or revoke.
        </Text>
      ) : null}

      <View style={styles.legend}>
        <LegendItem color={theme.colors.textMuted} icon="remove-circle-outline" label="Inherit" />
        <LegendItem color="#0ab39c" icon="checkmark-circle" label="Grant" />
        <LegendItem color="#f06548" icon="close-circle" label="Revoke" />
      </View>

      <View style={styles.matrix}>
        {PERMISSION_MODULES.map((module) => (
          <View
            key={module.key}
            style={[styles.module, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>{module.label}</Text>
            <View style={styles.cells}>
              {module.actions.map((action) => {
                const override = getOverride(overrides, module.key, action);
                const groupValue = Boolean(groupPermissions?.[module.key]?.[action]);
                const effective = override === undefined ? groupValue : override;

                const icon =
                  override === undefined
                    ? 'remove-circle-outline'
                    : override
                      ? 'checkmark-circle'
                      : 'close-circle';
                const color =
                  override === undefined
                    ? theme.colors.textMuted
                    : override
                      ? '#0ab39c'
                      : '#f06548';

                return (
                  <Pressable
                    key={action}
                    style={[
                      styles.cell,
                      {
                        borderColor: override === undefined ? theme.colors.border : color,
                        backgroundColor: override === undefined ? 'transparent' : `${color}12`,
                      },
                    ]}
                    onPress={() => cycleCell(module.key, action)}
                  >
                    <Ionicons name={icon} size={16} color={color} />
                    <Text style={[styles.cellLabel, { color: theme.colors.text }]}>
                      {PERMISSION_ACTION_LABELS[action]}
                    </Text>
                    <Text style={[styles.cellHint, { color: effective ? '#0ab39c' : theme.colors.textMuted }]}>
                      {effective ? 'allowed' : 'denied'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <Pressable onPress={handleClear} style={styles.clearBtn} disabled={clearMutation.isPending}>
        <Ionicons name="refresh-outline" size={16} color={theme.colors.danger} />
        <Text style={[styles.clearText, { color: theme.colors.danger }]}>
          Clear all overrides
        </Text>
      </Pressable>

      <SettingsSaveBar
        label="Save Permissions"
        loading={saveMutation.isPending}
        onPress={() => saveMutation.mutate()}
      />
    </SettingsDetailLayout>
  );
}

function LegendItem({ color, icon, label }: { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.legendItem}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.legendLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { paddingVertical: 40, alignItems: 'center' },
  errorText: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  matrix: {
    gap: 10,
  },
  module: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  moduleTitle: {
    ...textStyles.cardTitle,
    fontWeight: '700',
  },
  cells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cellLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  cellHint: {
    fontSize: 10,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 12,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
