import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  type?: ToastType;
  duration?: number;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

type ToastState = {
  message: string;
  type: ToastType;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type: options?.type ?? 'info' });
      opacity.setValue(0);
      translateY.setValue(20);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 14 }),
      ]).start();
      hideTimer.current = setTimeout(hide, options?.duration ?? 2600);
    },
    [opacity, translateY, hide],
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const accent =
    toast?.type === 'success'
      ? theme.colors.success
      : toast?.type === 'error'
        ? theme.colors.danger
        : theme.colors.primary;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              bottom: insets.bottom + 24,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${accent}1A` }]}>
              <Ionicons name={ICONS[toast.type]} size={20} color={accent} />
            </View>
            <Text style={[styles.message, { color: theme.colors.text }]} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: 460,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});
