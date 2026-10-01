import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { COMPANY_KPI_ITEMS } from '../constants/company.constants';
import { CompanyKpis } from '../types/company.types';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type CompanyKpiStripProps = {
  kpis?: CompanyKpis;
  isLoading?: boolean;
};

export function CompanyKpiStrip({ kpis, isLoading }: CompanyKpiStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {COMPANY_KPI_ITEMS.map((item) => (
        <View key={item.key} style={[styles.card, { backgroundColor: item.bg }]}>
          <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon as IoniconsName} size={15} color="#fff" />
          </View>
          <View style={styles.textWrap}>
            {isLoading ? (
              <ActivityIndicator size="small" color={item.color} style={styles.loader} />
            ) : (
              <Text style={styles.value}>{kpis?.[item.key] ?? 0}</Text>
            )}
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -16,
    marginBottom: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minWidth: 130,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flexShrink: 1,
  },
  loader: {
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#878a99',
  },
});
