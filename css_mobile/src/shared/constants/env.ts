import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = '5002';

/** The Mac's host/IP that Expo Metro is served from (e.g. "192.168.1.3"). */
function getDevMachineHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  const expoGoHost = Constants.expoGoConfig?.debuggerHost;
  if (expoGoHost) {
    return expoGoHost.split(':')[0];
  }

  return null;
}

function isPrivateLanHost(host: string): boolean {
  return /^(192\.168\.|10\.(?!0\.2\.2)|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host);
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1';
}

function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;

  // An explicit, non-localhost override always wins.
  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured;
  }

  const devHost = getDevMachineHost();

  if (__DEV__ && devHost) {
    // Expo connected over the Mac's LAN IP. Both the Android emulator AND a
    // physical phone load JS from this address, so they can also reach the
    // backend here (it binds to 0.0.0.0:5002). This avoids guessing
    // emulator-vs-device, which is unreliable in Expo Go.
    if (isPrivateLanHost(devHost)) {
      return `http://${devHost}:${API_PORT}`;
    }

    // devHost is localhost/127.0.0.1 (tunnel or USB). The emulator reaches the
    // Mac via its 10.0.2.2 alias; a USB device relies on `adb reverse`.
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${API_PORT}`;
    }

    if (!isLocalHost(devHost)) {
      return `http://${devHost}:${API_PORT}`;
    }
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return configured ?? `http://localhost:${API_PORT}`;
}

const apiUrl = resolveApiUrl();

if (__DEV__) {
  console.log('[API] resolved URL:', apiUrl);
  console.log('[API] platform:', Platform.OS, '| isDevice:', Constants.isDevice);
  console.log('[API] expo dev host:', getDevMachineHost() ?? 'n/a');
}

export const env = {
  apiUrl,
} as const;
