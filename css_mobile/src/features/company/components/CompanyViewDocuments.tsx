import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { documentStoreService } from '../services/documentStore.service';
import { formatCompanyDate } from '../utils/company.utils';

type CompanyViewDocumentsProps = {
  entityId: number;
};

export function CompanyViewDocuments({ entityId }: CompanyViewDocumentsProps) {
  const { theme } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['company-documents', entityId],
    queryFn: () => documentStoreService.getCompanyDocuments(entityId),
    enabled: entityId > 0,
  });

  const documents = data?.data ?? [];

  if (isLoading) {
    return <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />;
  }

  if (isError) {
    return (
      <Pressable onPress={() => void refetch()} style={styles.empty}>
        <Text style={{ color: theme.colors.danger }}>Could not load documents. Tap to retry.</Text>
      </Pressable>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name="folder-open-outline" size={24} color={theme.colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No documents found</Text>
        <Text style={[textStyles.description, { color: theme.colors.textMuted, textAlign: 'center' }]}>
          Uploaded company files will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {isRefetching ? (
        <Text style={[textStyles.description, { color: theme.colors.textMuted }]}>Refreshing…</Text>
      ) : null}
      {documents.map((doc) => {
        const title = doc.doc_name || doc.original_file_name || `Document #${doc.doc_id}`;
        const url = doc.cdn_url || doc.file_path;
        return (
          <Pressable
            key={doc.doc_id}
            onPress={() => {
              if (url) void Linking.openURL(url);
            }}
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}14` }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {doc.doc_category || doc.module_name || 'Document'} · {formatCompanyDate(doc.created_at)}
              </Text>
            </View>
            <Ionicons
              name={url ? 'open-outline' : 'document-outline'}
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  empty: { paddingVertical: 20 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: designSystem.cardRadius,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  meta: { fontSize: 11 },
});
