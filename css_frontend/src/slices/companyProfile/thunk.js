import { getCompanyProfile } from "../../helpers/backend_helper";
import { setCompanyProfileAction } from "./reducer";

export const loadCompanyProfile = () => async (dispatch) => {
  try {
    const r = await getCompanyProfile(1);
    const p = r?.data?.profile || {};
    dispatch(setCompanyProfileAction(p));
  } catch (_) {}
};
