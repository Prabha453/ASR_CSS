import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
} from '../constants/permissions.constants';
import { PermissionAction, PermissionsMap } from '../types/userGroup.types';

type PermissionMatrixProps = {
  value: PermissionsMap;
  onChange: (next: PermissionsMap) => void;
};

function clone(map: PermissionsMap): PermissionsMap {
  return JSON.parse(JSON.stringify(map));
}

export function PermissionMatrix({ value, onChange }: PermissionMatrixProps) {
  const { theme } = useTheme();

  const toggle = (moduleKey: string, action: PermissionAction) => {
    const next = clone(value);
    if (!next[moduleKey]) next[moduleKey] = {};
    next[moduleKey][action] = !next[moduleKey][action];
    onChange(next);
  };

  const toggleModule = (moduleKey: string, actions: PermissionAction[], enable: boolean) => {
    const next = clone(value);
    if (!next[moduleKey]) next[moduleKey] = {};
    actions.forEach((action) => {
      next[moduleKey][action] = enable;
    });
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      {PERMISSION_MODULES.map((module) => {
        const moduleValue = value[module.key] ?? {};
        const allOn = module.actions.every((action) => moduleValue[action]);

        return (
          <View
            key={module.key}
            style={[styles.module, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.moduleHeader}>
              <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>{module.label}</Text>
              <Pressable
                onPress={() => toggleModule(module.key, module.actions, !allOn)}
                hitSlop={8}
                style={styles.selectAll}
              >
                <Text style={[styles.selectAllText, { color: theme.colors.primary }]}>
                  {allOn ? 'Clear' : 'Select all'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.actions}>
              {module.actions.map((action) => {
                const checked = Boolean(moduleValue[action]);
                return (
                  <Pressable
                    key={action}
                    style={[
                      styles.actionChip,
                      {
                        borderColor: checked ? theme.colors.primary : theme.colors.border,
                        backgroundColor: checked ? `${theme.colors.primary}15` : 'transparent',
                      },
                    ]}
                    onPress={() => toggle(module.key, action)}
                  >
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={16}
                      color={checked ? theme.colors.primary : theme.colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        { color: checked ? theme.colors.primary : theme.colors.textMuted },
                      ]}
                    >
                      {PERMISSION_ACTION_LABELS[action]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  module: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectAll: {
    paddingVertical: 2,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
