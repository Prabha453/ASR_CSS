import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from '@/shared/components/formInputs/TextInput';
import { PasswordInput } from '@/shared/components/formInputs/PasswordInput';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useToast } from '@/shared/components/common/ToastProvider';
import { useTheme } from '@/shared/theme/ThemeContext';
import { AuthStackParamList } from '@/app/navigation/types';
import { LoginLayout } from '../components/LoginLayout';
import { RememberMeRow } from '../components/RememberMeRow';
import { useLogin } from '../hooks/useLogin';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<LoginNav>();
  const loginMutation = useLogin();
  const { showToast } = useToast();

  const [portNumber, setPortNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ portNumber?: string; email?: string; password?: string }>(
    {},
  );

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!portNumber.trim()) nextErrors.portNumber = 'Port number is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    if (!password.trim()) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field: keyof typeof errors, value: string) => {
    if (field === 'portNumber') setPortNumber(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = () => {
    if (!validate()) return;
    loginMutation.mutate(
      { portNumber: portNumber.trim(), email: email.trim(), password },
      {
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Login failed', { type: 'error' });
        },
      },
    );
  };

  return (
    <LoginLayout>
      <Text style={[styles.welcome, { color: theme.colors.text }]}>Welcome Back! </Text>
      <Text style={[styles.subtext, { color: theme.colors.textMuted }]}>
        Sign in to continue to ASR CSS.
      </Text>

      <TextInput
        label="Port Number"
        placeholder="Enter port number"
        value={portNumber}
        onChangeText={(value) => updateField('portNumber', value)}
        error={errors.portNumber}
        keyboardType="number-pad"
        required
      />
      <TextInput
        label="Email"
        placeholder="Enter email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={(value) => updateField('email', value)}
        error={errors.email}
        required
      />
      <PasswordInput
        label="Password"
        placeholder="Enter password"
        value={password}
        onChangeText={(value) => updateField('password', value)}
        error={errors.password}
        required
      />

      <RememberMeRow
        checked={rememberMe}
        onToggle={() => setRememberMe((prev) => !prev)}
        onForgotPassword={() => navigation.navigate('ForgotPassword')}
      />

      <PrimaryButton
        label="Sign In"
        loading={loginMutation.isPending}
        onPress={handleSubmit}
        style={styles.button}
      />

      <Text style={styles.registerFooter}>
        <Text style={[styles.registerMuted, { color: theme.colors.textMuted }]}>
          Don&apos;t have an account?{' '}
        </Text>
        <Text
          style={[styles.registerLink, { color: theme.colors.primary }]}
          onPress={() => navigation.navigate('Register')}
        >
          Register
        </Text>
      </Text>
    </LoginLayout>
  );
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtext: {
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 4,
  },
  registerFooter: {
    marginTop: 22,
    textAlign: 'center',
    fontSize: 14,
  },
  registerMuted: {
    fontSize: 14,
  },
  registerLink: {
    fontWeight: '700',
    fontSize: 14,
  },
});
