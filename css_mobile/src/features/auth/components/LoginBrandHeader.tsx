import { Image, StyleSheet, Text, View } from 'react-native';

const logoLight = require('@/assets/images/logo-light.png');

export function LoginBrandHeader() {
  return (
    <View style={styles.container}>
      <Image source={logoLight} style={styles.logo} resizeMode="contain" />
      <Text style={styles.subtitle}>ASR CSS Management System</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  logo: {
    width: 120,
    height: 28,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
});
