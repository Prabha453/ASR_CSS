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
import { CompanyViewTabId } from '../constants/companyView.constants';
import {
  CompanyStatusBadge,
  CompanyViewAddresses,
  CompanyViewContacts,
  CompanyViewCorpSec,
  CompanyViewDocuments,
  CompanyViewHeader,
  CompanyViewOverview,
  CompanyViewShares,
  CompanyViewTabBar,
} from '../components';
import { COMPANY_KPIS_QUERY_KEY } from '../hooks/useCompanyKpis';
import { companyService } from '../services/company.service';
import { getCompanyUen } from '../utils/company.utils';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'CompanyView'>;

export function CompanyViewScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { entityId, name } = route.params;
  const [activeTab, setActiveTab] = useState<CompanyViewTabId>('overview');

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['company', 'detail', entityId],
    queryFn: () => companyService.getById(entityId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => companyService.delete(entityId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['company'] });
      await queryClient.invalidateQueries({ queryKey: COMPANY_KPIS_QUERY_KEY });
      showToast('Company deleted successfully.', { type: 'success' });
      navigation.goBack();
    },
    onError: (error: Error) => {
      showToast(error.message, { type: 'error' });
    },
  });

  const title = name ?? company?.name ?? 'Company Details';
  const uen = company ? getCompanyUen(company) : null;

  const handleDelete = () => {
    Alert.alert('Delete Company', `Are you sure you want to delete ${title}?`, [
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
    if (!company) return null;
    switch (activeTab) {
      case 'contacts':
        return <CompanyViewContacts contacts={company.contacts} />;
      case 'addresses':
        return <CompanyViewAddresses addresses={company.addresses} />;
      case 'shares':
        return <CompanyViewShares company={company} navigation={navigation} />;
      case 'corp':
        return <CompanyViewCorpSec company={company} />;
      case 'documents':
        return <CompanyViewDocuments entityId={company.entity_id} />;
      default:
        return <CompanyViewOverview company={company} />;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <CompanyViewHeader
        title={company ? title : 'Company Details'}
        onBack={() => navigation.goBack()}
        tabs={
          !isLoading && !isError ? (
            <CompanyViewTabBar
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
          Could not load company details.
        </Text>
      ) : null}

      {!isLoading && !isError ? (
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {company && activeTab === 'overview' ? (
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
                <Ionicons name="business-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryUen, { color: theme.colors.text }]} numberOfLines={1}>
                  UEN: {uen || '—'}
                </Text>
                <Text style={[styles.summaryClient, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  Client: {company.client_no || '—'}
                </Text>
              </View>
              <CompanyStatusBadge status={company.status} />
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

          {company ? (
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Company'}
              </Text>
            </Pressable>
          ) : null}
        </Animated.ScrollView>
      ) : null}

      {company ? (
        <View style={styles.editFabWrap}>
          <PrimaryButton
            round
            onPress={() => navigation.navigate('CompanyAdd', { entityId })}
            accessibilityLabel="Edit Company"
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
  summaryUen: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryClient: {
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
