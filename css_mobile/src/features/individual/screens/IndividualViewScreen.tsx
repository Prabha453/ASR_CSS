import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { EditIcon } from '@/shared/components/common/EditIcon';
import { useToast } from '@/shared/components/common/ToastProvider';
import { actionIconColors } from '@/shared/theme/iconTokens';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { IndividualViewTabId } from '../constants/individual.constants';
import {
  IndividualStatusBadge,
  IndividualViewAddresses,
  IndividualViewContacts,
  IndividualViewHeader,
  IndividualViewIds,
  IndividualViewOverview,
  IndividualViewRelationships,
  IndividualViewTabBar,
} from '../components';
import { INDIVIDUAL_KPIS_QUERY_KEY } from '../hooks/useIndividualKpis';
import { individualService } from '../services/individual.service';
import { getPrimaryIdNumber } from '../utils/individual.utils';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'IndividualView'>;

export function IndividualViewScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { entityId, name } = route.params;
  const [activeTab, setActiveTab] = useState<IndividualViewTabId>('overview');

  const { data: individual, isLoading, isError } = useQuery({
    queryKey: ['individual', 'detail', entityId],
    queryFn: () => individualService.getById(entityId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => individualService.delete(entityId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['individual'] });
      await queryClient.invalidateQueries({ queryKey: INDIVIDUAL_KPIS_QUERY_KEY });
      showToast('Individual deleted successfully.', { type: 'success' });
      navigation.goBack();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const title = name ?? individual?.name ?? 'Individual Details';
  const detail = individual?.individual_detail;

  const handleDelete = () => {
    Alert.alert('Delete Individual', `Are you sure you want to delete ${title}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    contentOpacity.setValue(0);
    contentTranslate.setValue(8);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslate, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 90,
      }),
    ]).start();
  }, [activeTab, contentOpacity, contentTranslate]);

  const renderTabContent = () => {
    if (!individual) return null;
    switch (activeTab) {
      case 'ids':
        return <IndividualViewIds identifications={individual.identifications} />;
      case 'addresses':
        return <IndividualViewAddresses addresses={individual.addresses} />;
      case 'contacts':
        return <IndividualViewContacts individual={individual} />;
      case 'relationships':
        return <IndividualViewRelationships individual={individual} />;
      default:
        return <IndividualViewOverview individual={individual} />;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <IndividualViewHeader
        title={individual ? title : 'Individual Details'}
        onBack={() => navigation.goBack()}
        tabs={
          !isLoading && !isError ? (
            <IndividualViewTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onPrimary
            />
          ) : null
        }
      />

      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : null}

      {isError ? (
        <Text style={[styles.error, { color: theme.colors.danger }]}>
          Could not load individual details.
        </Text>
      ) : null}

      {!isLoading && !isError ? (
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {individual && activeTab === 'overview' ? (
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
                <Ionicons name="id-card-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryMain, { color: theme.colors.text }]} numberOfLines={1}>
                  ID: {getPrimaryIdNumber(individual) || '—'}
                </Text>
                <Text
                  style={[styles.summarySub, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  Nationality: {detail?.member_nationality || '—'}
                </Text>
              </View>
              <IndividualStatusBadge status={individual.status} />
            </View>
          ) : null}

          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslate }],
            }}
          >
            {renderTabContent()}
          </Animated.View>

          {individual ? (
            <Pressable
              style={[
                styles.deleteBtn,
                {
                  borderColor: `${theme.colors.danger}40`,
                  backgroundColor: `${theme.colors.danger}0D`,
                },
              ]}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Ionicons name="trash-outline" size={16} color={actionIconColors.delete} />
              <Text style={[styles.deleteText, { color: actionIconColors.delete }]}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Individual'}
              </Text>
            </Pressable>
          ) : null}
        </Animated.ScrollView>
      ) : null}

      {individual ? (
        <View style={styles.editFabWrap}>
          <PrimaryButton
            round
            onPress={() => navigation.navigate('IndividualAdd', { entityId })}
            accessibilityLabel="Edit Individual"
          >
            <EditIcon size={24} color="#fff" />
          </PrimaryButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  editFabWrap: {
    position: 'absolute',
    right: designSystem.screenPadding,
    bottom: designSystem.screenPadding,
  },
  loader: { marginVertical: 20 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: designSystem.cardGap,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  summaryMain: {
    fontSize: 14,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  body: {
    padding: designSystem.screenPadding,
    paddingTop: 16,
    paddingBottom: 88,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  deleteBtn: {
    marginTop: designSystem.cardGap,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
