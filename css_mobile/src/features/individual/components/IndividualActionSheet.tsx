import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { useTheme } from '@/shared/theme/ThemeContext';
import { INDIVIDUAL_ACTION_ITEMS, IndividualActionId } from '../constants/individual.constants';
import { EditIcon, isEditGlyph } from '@/shared/components/common/EditIcon';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type IndividualActionSheetProps = {
  visible: boolean;
  individualName?: string;
  onClose: () => void;
  onAction: (actionId: IndividualActionId) => void;
};

export function IndividualActionSheet({
  visible,
  individualName,
  onClose,
  onAction,
}: IndividualActionSheetProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Select Action</Text>
          {individualName ? (
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {individualName}
            </Text>
          ) : null}

          {INDIVIDUAL_ACTION_ITEMS.map((item) => {
            const iconColor = item.destructive ? theme.colors.danger : theme.colors.primary;
            return (
            <Pressable
              key={item.id}
              style={[styles.row, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                onClose();
                onAction(item.id);
              }}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: item.destructive
                      ? 'rgba(240,101,72,0.1)'
                      : 'rgba(64,81,137,0.1)',
                  },
                ]}
              >
                {isEditGlyph(item.icon) || item.id === 'edit' ? (
                  <EditIcon size={18} color={iconColor} />
                ) : (
                  <Ionicons name={item.icon as IoniconsName} size={18} color={iconColor} />
                )}
              </View>
              <Text
                style={{
                  color: item.destructive ? theme.colors.danger : theme.colors.text,
                  fontSize: 14,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
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
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdropPress: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d8dce3',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
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
