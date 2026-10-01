import { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProviders } from '@/app/providers';
import { RootNavigator } from '@/app/navigation';

const isAndroid = Platform.OS === 'android';

// Keep typography consistent across devices. Without this, a phone whose system
// font/display size is set above 100% renders all text larger than the design
// (and larger than the simulator). We still allow a small amount of scaling for
// accessibility, but cap it so layouts don't break.
const MAX_FONT_SCALE = 1.15;

type ScalableComponent = { defaultProps?: Record<string, unknown> };

function clampFontScaling(component: ScalableComponent) {
  component.defaultProps = {
    ...(component.defaultProps ?? {}),
    maxFontSizeMultiplier: MAX_FONT_SCALE,
  };
}

clampFontScaling(Text as unknown as ScalableComponent);
clampFontScaling(TextInput as unknown as ScalableComponent);

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (isAndroid) {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('#405189');
      RNStatusBar.setBarStyle('light-content');
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProviders>
        <StatusBar style="light" />
        <RootNavigator />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#405189',
  },
  root: {
    flex: 1,
  },
});
