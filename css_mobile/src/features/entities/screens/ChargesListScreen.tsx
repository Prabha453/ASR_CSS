import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { AppHeader, ScreenShell } from '@/shared/components/layout';
import { apiClient, buildPortUrl } from '@/shared/services/apiClient';
import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'ChargesList'>;

type ChargeRow = {
  charge_id?: number;
  charge_number?: string;
  charge_type?: string;
  chargee_name?: string;
  amount?: number | string;
  company_name?: string;
  entity?: { name?: string };
  creation_date?: string;
  registration_date?: string;
};

async function fetchCharges() {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<ChargeRow>>>(
    buildPortUrl('/entity-change/list'),
    { params: { page: 1, limit: 50 } },
  );
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to load charges');
  }
  return response.data.data;
}

export function ChargesListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['charges', 'list'],
    queryFn: fetchCharges,
  });

  const rows = data?.data ?? [];

  return (
    <ScreenShell
      scrollable={false}
      contentStyle={styles.content}
      header={
        <AppHeader title="Charges" leftAction="back" onLeftPress={() => navigation.goBack()} />
      }
    >
      {isLoading ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} /> : null}
      {isError ? (
        <Pressable onPress={() => void refetch()} style={styles.center}>
          <Text style={{ color: theme.colors.danger }}>Could not load charges. Tap to retry.</Text>
        </Pressable>
      ) : null}

      {!isLoading && !isError ? (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => String(item.charge_id ?? index)}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-outline" size={24} color={theme.colors.textMuted} />
              <Text style={[textStyles.description, { color: theme.colors.textMuted, marginTop: 8 }]}>
                No registered charges found.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                {item.charge_number || `Charge #${item.charge_id}`}
              </Text>
              <Text style={[textStyles.description, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {item.entity?.name || item.company_name || 'Company'} · {item.charge_type || 'Type'}
              </Text>
              <Text style={[textStyles.description, { color: theme.colors.textMuted }]} numberOfLines={1}>
                Chargee: {item.chargee_name || '—'} · Amount: {item.amount ?? '—'}
              </Text>
            </View>
          )}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: designSystem.screenPadding, flex: 1 },
  list: { gap: 10, paddingBottom: 24 },
  center: { alignItems: 'center', paddingVertical: 40 },
  card: {
    borderWidth: 1,
    borderRadius: designSystem.cardRadius,
    padding: 14,
    gap: 4,
  },
  title: { fontSize: 15, fontWeight: '700' },
});
