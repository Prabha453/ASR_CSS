import { postLogin, postLogout, resolvePort } from "../../../helpers/backend_helper";
import { setAuthorization, setApiBaseURL } from "../../../helpers/api_helper";
import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag } from './reducer';
import useBranding from '../../../hooks/useBranding';
import { _applyBranding } from '../../../hooks/useBranding';

 export const loginUser = (credentials, navigate) => async (dispatch) => {
  try {
    // Step 1: Resolve port_number → port_name
    const portResponse = await resolvePort(credentials.port_number);
    if (!portResponse.status) {
      dispatch(apiError({ data: portResponse.message || 'Invalid port number' }));
      return;
    }
    const portName = portResponse.data.port_db;

    // Step 2: Point all API calls at resolved database
    setApiBaseURL(portName);

    // Step 3: Login — send port_number so backend scopes document images
    const response = await postLogin({
      email:       credentials.email,
      password:    credentials.password,
      port_number: credentials.port_number,  // ✅ sent to backend for image scoping
    });

    const accessToken    = response.tokens.access.token;
    const refreshToken   = response.tokens.refresh.token;
    const user           = response.data;

    // ✅ company_profile embedded in login response
    const companyProfile = user.company_profile ?? {};

    // Step 4: Persist session
    localStorage.setItem('authUser', JSON.stringify({
      ...user,
      token:           accessToken,
      refreshToken:    refreshToken,
      portName:        portName
    }));

    setAuthorization(accessToken);
    _applyBranding(companyProfile);

    dispatch(loginSuccess({
      ...user,
      token:           accessToken,
      refreshToken:    refreshToken,
      portName:        portName,
    }));

    navigate('/dashboard');

  } catch (error) {
    dispatch(apiError({ data: error }));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    const session = JSON.parse(localStorage.getItem("authUser") || "{}");

    // Hit backend so it can stamp logout_at in login_history and write audit_log.
    // Fire-and-forget — local cleanup always proceeds regardless of backend result.
    postLogout({
      access_token:  session.token        ?? null,
      refresh_token: session.refreshToken ?? null,
    }).catch(() => {});

    _applyBranding({});
    localStorage.removeItem("authUser");
    dispatch(logoutUserSuccess(true));
  } catch (error) {
    dispatch(apiError({ data: error }));
  }
};

export const resetLoginFlag = () => async (dispatch) => {
  try {
    dispatch(reset_login_flag());
  } catch (error) {
    dispatch(apiError({ data: error }));
  }
};