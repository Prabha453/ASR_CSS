import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { IconCircle } from '@/shared/components/common/IconCircle';
import { AuthShell } from '@/shared/components/layout';
import { useTheme } from '@/shared/theme/ThemeContext';
import { AuthStackParamList } from '@/app/navigation/types';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<RegisterNav>();

  return (
    <AuthShell title="Create Account" subtitle="Join ASR CSS">
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <IconCircle name="person-add-outline" token="primary" size={64} style={styles.icon} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Coming soon</Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Registration screen will be implemented next.
        </Text>
        <Text style={[styles.link, { color: theme.colors.primary }]} onPress={() => navigation.goBack()}>
          Back to Sign In
        </Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
    fontWeight: '600',
  },
});
