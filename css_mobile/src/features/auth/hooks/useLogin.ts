import { useMutation } from '@tanstack/react-query';
import { useAppDispatch } from '@/app/store/hooks';
import { setCredentials } from '@/app/store/slices/authSlice';
import { setProfile } from '@/app/store/slices/userSlice';
import { setPortDb } from '@/shared/services/apiClient';
import { storage } from '@/shared/services/storage';
import { STORAGE_KEYS } from '@/shared/constants';
import { authService } from '../services/auth.service';
import { LoginCredentials } from '../types';

export const useLogin = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const portResponse = await authService.resolvePort(credentials.portNumber);
      if (!portResponse.status || !portResponse.data?.port_db) {
        throw new Error(portResponse.message || 'Invalid port number');
      }

      const portDb = portResponse.data.port_db;
      const loginResponse = await authService.login(credentials, portDb);
      if (!loginResponse.status || !loginResponse.tokens?.access?.token) {
        throw new Error(loginResponse.message || 'Login failed');
      }

      const token = loginResponse.tokens.access.token;
      const user = loginResponse.data as Record<string, unknown>;

      await Promise.all([
        storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        storage.setItem(STORAGE_KEYS.PORT_DB, portDb),
        storage.setItem(STORAGE_KEYS.PORT_NUMBER, credentials.portNumber),
      ]);

      setPortDb(portDb);
      dispatch(
        setCredentials({
          token,
          portDb,
          portNumber: credentials.portNumber,
          user: {
            id: user.user_id as number | undefined,
            email: user.email as string | undefined,
            first_name: user.first_name as string | undefined,
            last_name: user.last_name as string | undefined,
            user_role: user.user_role as string | undefined,
          },
        }),
      );
      dispatch(
        setProfile({
          id: user.user_id as number | undefined,
          email: user.email as string | undefined,
          first_name: user.first_name as string | undefined,
          last_name: user.last_name as string | undefined,
          user_role: user.user_role as string | undefined,
        }),
      );

      return loginResponse;
    },
  });
};
