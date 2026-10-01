import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';

type RememberMeRowProps = {
  checked: boolean;
  onToggle: () => void;
  onForgotPassword: () => void;
};

export function RememberMeRow({ checked, onToggle, onForgotPassword }: RememberMeRowProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable style={styles.remember} onPress={onToggle}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: checked ? theme.colors.primary : theme.colors.border,
              backgroundColor: checked ? theme.colors.primary : '#fff',
            },
          ]}
        >
          {checked ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
        </View>
        <Text style={[styles.rememberText, { color: theme.colors.textMuted }]}>Remember me</Text>
      </Pressable>

      <Pressable onPress={onForgotPassword}>
        <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot Password?</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 13,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
