const decodeJwtPayload = (token) => {
  try {
    const payload = String(token || '').split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

export const getTokenExpirationMs = (token) => {
  const exp = Number(decodeJwtPayload(token)?.exp);
  return exp ? exp * 1000 : null;
};

export const isAccessTokenExpired = (token, now = Date.now()) => {
  const expiration = getTokenExpirationMs(token);
  return !token || !expiration || now >= expiration;
};

export const clearAuthSession = () => {
  localStorage.removeItem('authUser');
  sessionStorage.removeItem('authUser');
  sessionStorage.setItem('sessionExpired', 'true');
};

export const expireAuthSession = ({ redirect = true } = {}) => {
  clearAuthSession();
  if (redirect && window.location.pathname !== '/login') {
    window.location.replace('/login?reason=session-expired');
  }
};

