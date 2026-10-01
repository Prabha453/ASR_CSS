import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { useTheme } from '@/shared/theme/ThemeContext';
import { EditIcon, isEditGlyph } from '@/shared/components/common/EditIcon';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export type EntityShareActionId = 'history' | 'edit' | 'delete';

type EntityShareActionSheetProps = {
  visible: boolean;
  shareLabel?: string;
  onClose: () => void;
  onAction: (action: EntityShareActionId) => void;
};

const ACTIONS: { id: EntityShareActionId; label: string; icon: IoniconsName; destructive?: boolean }[] = [
  { id: 'history', label: 'View History', icon: 'time-outline' },
  { id: 'edit', label: 'Edit Share', icon: 'create-outline' },
  { id: 'delete', label: 'Delete Share', icon: 'trash-outline', destructive: true },
];

export function EntityShareActionSheet({
  visible,
  shareLabel,
  onClose,
  onAction,
}: EntityShareActionSheetProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Share Actions</Text>
          {shareLabel ? (
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {shareLabel}
            </Text>
          ) : null}

          {ACTIONS.map((action) => {
            const iconColor = action.destructive ? theme.colors.danger : theme.colors.primary;
            return (
            <Pressable
              key={action.id}
              style={[styles.row, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                onClose();
                onAction(action.id);
              }}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: action.destructive
                      ? 'rgba(240,101,72,0.1)'
                      : 'rgba(64,81,137,0.1)',
                  },
                ]}
              >
                {isEditGlyph(action.icon) || action.id === 'edit' ? (
                  <EditIcon size={18} color={iconColor} />
                ) : (
                  <Ionicons name={action.icon} size={18} color={iconColor} />
                )}
              </View>
              <Text
                style={{
                  color: action.destructive ? theme.colors.danger : theme.colors.text,
                  fontSize: 14,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d9dce3',
    marginTop: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
