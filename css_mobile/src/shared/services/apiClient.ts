import axios from 'axios';
import { env } from '@/shared/constants';
import { storage } from '@/shared/services/storage';
import { STORAGE_KEYS } from '@/shared/constants';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let portDb: string | null = null;

export const setPortDb = (db: string | null) => {
  portDb = db;
};

export const getPortDb = () => portDb;

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      throw new Error(
        `Network error — cannot reach backend at ${env.apiUrl}. Make sure css_backend is running on port 5001.`,
      );
    }

    const message = error.response?.data?.message;
    throw new Error(message || error.message || 'Request failed');
  },
);

export const buildPortUrl = (path: string) => {
  if (!portDb) {
    throw new Error('Port database not configured');
  }
  return `/${portDb}${path.startsWith('/') ? path : `/${path}`}`;
};
