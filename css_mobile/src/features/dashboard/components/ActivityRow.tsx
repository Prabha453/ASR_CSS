import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { DashboardActivityItem } from '../services/dashboard.service';

export function formatActivityUser(item: {
  user?: { first_name?: string; last_name?: string; user_name?: string } | null;
}) {
  const name = [item.user?.first_name, item.user?.last_name].filter(Boolean).join(' ');
  return name || item.user?.user_name || 'System';
}

export function formatActivityWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type ActivityRowProps = {
  item: DashboardActivityItem;
};

export function ActivityRow({ item }: ActivityRowProps) {
  const { theme } = useTheme();
  const success = String(item.status || 'SUCCESS').toUpperCase() === 'SUCCESS';

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: success ? `${theme.colors.success}1a` : `${theme.colors.danger}1a` },
        ]}
      >
        <Ionicons
          name={success ? 'checkmark-circle-outline' : 'alert-circle-outline'}
          size={18}
          color={success ? theme.colors.success : theme.colors.danger}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {item.module || 'Module'} · {item.action || 'Action'}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {formatActivityUser(item)} · {formatActivityWhen(item.created_at)}
        </Text>
        {item.table_name || item.record_id != null ? (
          <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {[item.table_name, item.record_id != null ? `#${item.record_id}` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}
        {!success && item.error_message ? (
          <Text style={[styles.error, { color: theme.colors.danger }]} numberOfLines={2}>
            {item.error_message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  error: { fontSize: 11, fontWeight: '500', marginTop: 4 },
});
