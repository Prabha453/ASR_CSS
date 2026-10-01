import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthUser = {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  user_role?: string;
};

type AuthState = {
  token: string | null;
  portDb: string | null;
  portNumber: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  user: AuthUser | null;
};

const initialState: AuthState = {
  token: null,
  portDb: null,
  portNumber: null,
  isAuthenticated: false,
  isHydrated: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setHydrated: (state, action: PayloadAction<boolean>) => {
      state.isHydrated = action.payload;
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        portDb: string;
        portNumber: string;
        user?: AuthUser | null;
      }>,
    ) => {
      state.token = action.payload.token;
      state.portDb = action.payload.portDb;
      state.portNumber = action.payload.portNumber;
      state.user = action.payload.user ?? null;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.token = null;
      state.portDb = null;
      state.portNumber = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setHydrated, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
