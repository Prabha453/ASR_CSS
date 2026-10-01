import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryStore.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const storage = {
  setItem,
  getItem,
  removeItem,
};
