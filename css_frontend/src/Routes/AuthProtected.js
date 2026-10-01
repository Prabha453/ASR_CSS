import React, { useEffect } from "react";
import { Navigate, Route } from "react-router-dom";
import { setAuthorization } from "../helpers/api_helper";
import { expireAuthSession, getTokenExpirationMs, isAccessTokenExpired } from "../helpers/auth_session";

import { useProfile } from "../Components/Hooks/UserHooks";

const AuthProtected = (props) =>{
  const { userProfile, loading, token } = useProfile();
  
  useEffect(() => {
    if (userProfile && !loading && token) {
      if (isAccessTokenExpired(token)) {
        expireAuthSession();
        return undefined;
      }
      setAuthorization(token);

      const checkSession = () => {
        if (isAccessTokenExpired(token)) expireAuthSession();
      };
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') checkSession();
      };
      const expiration = getTokenExpirationMs(token);
      const timeoutId = window.setTimeout(checkSession, Math.max((expiration || Date.now()) - Date.now(), 0));

      window.addEventListener('focus', checkSession);
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener('focus', checkSession);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }
    return undefined;
  }, [token, userProfile, loading]);

  /*
    Navigate is un-auth access protected routes via url
    */

  if (!loading && token && isAccessTokenExpired(token)) {
    expireAuthSession({ redirect: false });
    return <Navigate to="/login?reason=session-expired" replace />;
  }

  if (!userProfile || !token) {
    return (
      <Navigate to="/login" replace />
    );
  }

  return <>{props.children}</>;
};

const AccessRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props => {
        return (<> <Component {...props} /> </>);
      }}
    />
  );
};

export { AuthProtected, AccessRoute };
