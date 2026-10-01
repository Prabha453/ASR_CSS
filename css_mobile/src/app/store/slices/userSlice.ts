import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from './authSlice';

type UserState = {
  profile: AuthUser | null;
};

const initialState: UserState = {
  profile: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<AuthUser | null>) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
  },
});

export const { setProfile, clearProfile } = userSlice.actions;
export default userSlice.reducer;
