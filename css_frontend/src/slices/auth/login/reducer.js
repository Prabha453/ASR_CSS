import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  user: {},
  error: "",
  loading: false,
  isUserLogout: false,
  errorMsg: false,
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    apiError(state, action) {
      state.error = action.payload.data;
      state.loading = false;                // ✅ was true, should be false
      state.isUserLogout = false;
      state.errorMsg = true;
    },
    loginSuccess(state, action) {
      state.user = action.payload;
      state.loading = false;
      state.errorMsg = false;
    },
    logoutUserSuccess(state) {              // ✅ removed unused action param
      state.isUserLogout = true;
    },
    reset_login_flag(state) {
      state.error = null;
      state.loading = false;
      state.errorMsg = false;
    },
  },
});

export const {
  apiError,
  loginSuccess,
  logoutUserSuccess,
  reset_login_flag,
} = loginSlice.actions;

export default loginSlice.reducer;