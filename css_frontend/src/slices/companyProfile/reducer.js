import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  decimals: { shares: 0, paid: 2, issued: 2 },
};

const CompanyProfileSlice = createSlice({
  name: 'CompanyProfile',
  initialState,
  reducers: {
    setCompanyProfileAction(state, action) {
      const p = action.payload;
      state.profile = p;
      state.decimals = {
        shares: p.cp_no_of_share_decimal_place  ?? 0,
        paid:   p.cp_paid_up_share_decimal_place ?? 2,
        issued: p.cp_issued_share_decimal_place  ?? 2,
      };
    },
  },
});

export const { setCompanyProfileAction } = CompanyProfileSlice.actions;
export default CompanyProfileSlice.reducer;
