import { apiClient, buildPortUrl, setPortDb } from '@/shared/services/apiClient';
import { ApiResponse } from '@/shared/types';
import { LoginCredentials, LoginResponse, PortResolveData } from '../types';

export const authService = {
  resolvePort: async (portNumber: string) => {
    const response = await apiClient.get<ApiResponse<PortResolveData>>('/port/resolve', {
      params: { port_number: portNumber },
    });
    return response.data;
  },

  login: async (credentials: LoginCredentials, portDb: string) => {
    setPortDb(portDb);
    const response = await apiClient.post<LoginResponse>(
      buildPortUrl('/auth/login'),
      {
        email: credentials.email,
        password: credentials.password,
        port_number: credentials.portNumber,
      },
    );
    return response.data;
  },

  changePassword: async (
    userId: number,
    payload: { old_password: string; password: string; confirm_password: string },
  ) => {
    const response = await apiClient.put<ApiResponse<unknown>>(
      buildPortUrl(`/auth/change-password/${userId}`),
      payload,
    );
    return response.data;
  },
};
