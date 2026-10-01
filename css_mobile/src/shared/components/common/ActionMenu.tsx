import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

export type ActionMenuItem = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type ActionMenuProps = {
  visible: boolean;
  items: ActionMenuItem[];
  onClose: () => void;
};

export function ActionMenu({ visible, items, onClose }: ActionMenuProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
          {items.map((item) => (
            <Pressable
              key={item.label}
              style={styles.item}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              <Text
                style={{
                  color: item.destructive ? theme.colors.danger : theme.colors.text,
                  fontWeight: '600',
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  item: {
    paddingVertical: 14,
  },
});
