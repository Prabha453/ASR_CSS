import { useCallback } from 'react';
import { useAppDispatch } from '@/app/store/hooks';
import { clearCredentials } from '@/app/store/slices/authSlice';
import { clearProfile } from '@/app/store/slices/userSlice';
import { setPortDb } from '@/shared/services/apiClient';
import { storage } from '@/shared/services/storage';
import { STORAGE_KEYS } from '@/shared/constants';

export const useLogout = () => {
  const dispatch = useAppDispatch();

  return useCallback(async () => {
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      storage.removeItem(STORAGE_KEYS.PORT_DB),
      storage.removeItem(STORAGE_KEYS.PORT_NUMBER),
    ]);

    setPortDb(null);
    dispatch(clearProfile());
    dispatch(clearCredentials());
  }, [dispatch]);
};
