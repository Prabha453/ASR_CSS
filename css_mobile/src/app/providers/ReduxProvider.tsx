import { ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import { setHydrated, setCredentials } from '@/app/store/slices/authSlice';
import { setPortDb } from '@/shared/services/apiClient';
import { storage } from '@/shared/services/storage';
import { STORAGE_KEYS } from '@/shared/constants';

type ReduxProviderProps = {
  children: ReactNode;
};

function AuthHydrator({ children }: { children: ReactNode }) {
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [token, portDb, portNumber] = await Promise.all([
          storage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          storage.getItem(STORAGE_KEYS.PORT_DB),
          storage.getItem(STORAGE_KEYS.PORT_NUMBER),
        ]);

        if (token && portDb && portNumber) {
          setPortDb(portDb);
          store.dispatch(
            setCredentials({
              token,
              portDb,
              portNumber,
            }),
          );
        }
      } catch (error) {
        console.warn('Failed to restore auth session', error);
      } finally {
        store.dispatch(setHydrated(true));
      }
    };

    store.dispatch(setHydrated(false));
    void restoreSession();
  }, []);

  return children;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <AuthHydrator>{children}</AuthHydrator>
    </Provider>
  );
}
