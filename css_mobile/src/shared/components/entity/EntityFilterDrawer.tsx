import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type EntityFilterDrawerProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function EntityFilterDrawer({
  visible,
  title = 'Filters',
  onClose,
  children,
}: EntityFilterDrawerProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.drawer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawer: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});
