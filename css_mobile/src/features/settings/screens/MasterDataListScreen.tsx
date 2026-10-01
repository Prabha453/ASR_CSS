import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingsStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { EditIcon } from '@/shared/components/common/EditIcon';
import { useToast } from '@/shared/components/common/ToastProvider';
import { MasterDataFormModal, SettingsDetailLayout, SettingsGroupSection } from '../components';
import { getMasterResource } from '../constants/masterData.constants';
import { masterDataService } from '../services/masterData.service';
import { MasterRecord } from '../types/settings.types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'MasterDataList'>;

export function MasterDataListScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const config = getMasterResource(route.params.resourceId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterRecord | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['settings', 'master', route.params.resourceId],
    queryFn: () => masterDataService.getList(config!),
    enabled: Boolean(config),
  });

  const rows = useMemo(() => data?.data ?? [], [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: MasterRecord) => {
      if (!config) throw new Error('Master resource not found');
      if (editingItem) {
        const id = Number(editingItem[config.idField]);
        return masterDataService.update(config, id, payload, userId);
      }
      return masterDataService.create(config, payload, userId);
    },
    onSuccess: async () => {
      const wasEditing = Boolean(editingItem);
      setModalOpen(false);
      setEditingItem(null);
      await queryClient.invalidateQueries({ queryKey: ['settings', 'master', route.params.resourceId] });
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast(wasEditing ? 'Record updated successfully.' : 'Record added successfully.', {
        type: 'success',
      });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (item: MasterRecord) => {
      if (!config) throw new Error('Master resource not found');
      return masterDataService.delete(config, Number(item[config.idField]));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'master', route.params.resourceId] });
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast('Record deleted successfully.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  if (!config) {
    return (
      <SettingsDetailLayout title="Master Data" onBack={() => navigation.goBack()}>
        <Text style={styles.errorText}>Unknown master resource.</Text>
      </SettingsDetailLayout>
    );
  }

  const confirmDelete = (item: MasterRecord) => {
    const label = String(item[config.labelField] ?? 'this record');
    Alert.alert('Delete Record', `Delete ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item) },
    ]);
  };

  const addAction = (
    <Pressable
      onPress={() => {
        setEditingItem(null);
        setModalOpen(true);
      }}
      style={styles.addButton}
    >
      <Ionicons name="add" size={22} color="#fff" />
    </Pressable>
  );

  return (
    <SettingsDetailLayout
      title={route.params.title}
      onBack={() => navigation.goBack()}
      rightAction={addAction}
    >
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#405189" />
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      ) : null}

      {isError ? (
        <Pressable onPress={() => void refetch()}>
          <Text style={styles.errorText}>Could not load records. Tap to retry.</Text>
        </Pressable>
      ) : null}

      <SettingsGroupSection title={`${data?.totalItems ?? 0} RECORDS`}>
        {rows.length === 0 && !isLoading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No records found.</Text>
          </View>
        ) : (
          rows.map((item, index) => (
            <View key={String(item[config.idField])}>
              <Pressable
                style={styles.row}
                onPress={() => {
                  setEditingItem(item);
                  setModalOpen(true);
                }}
              >
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{String(item[config.labelField] ?? '—')}</Text>
                  {config.fields.slice(1, 2).map((field) => (
                    <Text key={field.key} style={styles.rowMeta}>
                      {field.label}: {String(item[field.key] ?? '—')}
                    </Text>
                  ))}
                </View>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => {
                      setEditingItem(item);
                      setModalOpen(true);
                    }}
                    hitSlop={8}
                    style={styles.actionBtn}
                  >
                    <EditIcon size={19} color="#405189" />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(item)}
                    hitSlop={8}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#f06548" />
                  </Pressable>
                </View>
              </Pressable>
              {index < rows.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))
        )}
      </SettingsGroupSection>

      <MasterDataFormModal
        visible={modalOpen}
        title={editingItem ? `Edit ${config.title}` : `Add ${config.title}`}
        fields={config.fields}
        initialValues={editingItem ?? undefined}
        loading={saveMutation.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={(values) => saveMutation.mutate(values)}
      />
    </SettingsDetailLayout>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  loadingText: { fontSize: 13, color: '#878a99' },
  errorText: { marginBottom: 12, fontSize: 13, color: '#f06548' },
  emptyWrap: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#878a99' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBody: { flex: 1 },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#405189', marginBottom: 2 },
  rowMeta: { fontSize: 12, color: '#878a99' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e9ebec',
    marginLeft: 16,
  },
});
