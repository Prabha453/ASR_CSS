import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PermissionMap = Record<string, Record<string, boolean>>;

type PermissionState = {
  permissions: PermissionMap;
};

const initialState: PermissionState = {
  permissions: {},
};

const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    setPermissions: (state, action: PayloadAction<PermissionMap>) => {
      state.permissions = action.payload;
    },
    clearPermissions: (state) => {
      state.permissions = {};
    },
  },
});

export const { setPermissions, clearPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;
