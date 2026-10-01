import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ColorScheme } from '@/shared/theme';

type ThemeState = {
  scheme: ColorScheme;
};

const initialState: ThemeState = {
  scheme: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setScheme: (state, action: PayloadAction<ColorScheme>) => {
      state.scheme = action.payload;
    },
    toggleScheme: (state) => {
      state.scheme = state.scheme === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setScheme, toggleScheme } = themeSlice.actions;
export default themeSlice.reducer;
