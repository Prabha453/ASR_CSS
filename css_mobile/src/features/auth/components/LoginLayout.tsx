import { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LoginBrandHeader } from './LoginBrandHeader';

const loginHeroBg = require('@/assets/images/login-hero-bg.png');
const isAndroid = Platform.OS === 'android';

type LoginLayoutProps = {
  children: ReactNode;
};

export function LoginLayout({ children }: LoginLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.page}>
      <StatusBar style="light" hidden={isAndroid} />
      <View style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.hero}>
            <Image source={loginHeroBg} style={styles.heroImage} resizeMode="cover" />

            <LinearGradient
              colors={['rgba(42, 53, 88, 0.72)', 'rgba(54, 69, 116, 0.78)', 'rgba(64, 81, 137, 0.74)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={[styles.heroContent, { paddingTop: insets.top + 8 }]}>
              <LoginBrandHeader />
            </View>
          </View>

          <View style={styles.sheet}>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  hero: {
    minHeight: 200,
    overflow: 'hidden',
    backgroundColor: '#364574',
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    width: '100%',
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingBottom: 12,
    zIndex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    shadowColor: '#405189',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
  },
});
