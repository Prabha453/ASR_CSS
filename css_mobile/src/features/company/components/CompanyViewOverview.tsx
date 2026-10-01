import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { COMPANY_RISK_META } from '../constants/company.constants';
import { Company } from '../types/company.types';
import { formatCompanyDate, getCompanyUen } from '../utils/company.utils';
import { CompanyStatusBadge } from './CompanyStatusBadge';

type InfoRowProps = {
  label: string;
  value?: string | null;
  right?: ReactNode;
  last?: boolean;
};

function InfoRow({ label, value, right, last }: InfoRowProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      {right ?? (
        <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={2}>
          {value?.trim() ? value : '—'}
        </Text>
      )}
    </View>
  );
}

type CompanyViewOverviewProps = {
  company: Company;
};

export function CompanyViewOverview({ company }: CompanyViewOverviewProps) {
  const { theme } = useTheme();
  const detail = company.company_detail;
  const tagNames = company.tags?.map((tag) => tag.tag_info?.tag_name).filter(Boolean).join(', ');
  const risk = detail?.risk_assessment_rating;
  const riskMeta = risk ? COMPANY_RISK_META[risk] : undefined;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
          <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
        </View>
        <View style={styles.sectionText}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Company Information
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
            Key details of this company
          </Text>
        </View>
      </View>

      <InfoRow label="Entity Name" value={company.name} />
      <InfoRow label="Former Name" value={company.former_name} />
      <InfoRow label="Client No." value={company.client_no} />
      <InfoRow label="UEN / Reg. No." value={getCompanyUen(company)} />
      <InfoRow label="Company Type" value={company.company_type?.company_type_name} />
      <InfoRow label="Status" right={<CompanyStatusBadge status={company.status} />} />
      <InfoRow
        label="Country"
        right={
          detail?.country ? (
            <View style={styles.inlineValue}>
              <Ionicons name="flag-outline" size={13} color={theme.colors.textMuted} />
              <Text style={[styles.value, { color: theme.colors.text }]}>{detail.country}</Text>
            </View>
          ) : (
            <Text style={[styles.value, { color: theme.colors.text }]}>—</Text>
          )
        }
      />
      <InfoRow
        label="Risk Rating"
        right={
          riskMeta ? (
            <View
              style={[
                styles.outlinePill,
                { borderColor: riskMeta.color, backgroundColor: `${riskMeta.color}12` },
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={12} color={riskMeta.color} />
              <Text style={[styles.pillText, { color: riskMeta.color }]}>{riskMeta.label}</Text>
            </View>
          ) : (
            <Text style={[styles.value, { color: theme.colors.text }]}>—</Text>
          )
        }
      />
      <InfoRow
        label="Incorporation Date"
        right={
          <View style={styles.inlineValue}>
            <Ionicons name="calendar-outline" size={13} color={theme.colors.textMuted} />
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatCompanyDate(detail?.company_incorporation_date) || '—'}
            </Text>
          </View>
        }
      />
      <InfoRow
        label="FYE Date"
        right={
          <View style={styles.inlineValue}>
            <Ionicons name="calendar-outline" size={13} color={theme.colors.textMuted} />
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatCompanyDate(detail?.company_fin_date) || '—'}
            </Text>
          </View>
        }
      />
      <InfoRow label="Person In Charge" value={detail?.person_in_charge} />
      <InfoRow label="Holding Company" value={detail?.holding_company_name} />
      <InfoRow
        label="Source"
        right={
          detail?.source_from ? (
            <View style={[styles.pill, { backgroundColor: `${theme.colors.info}18` }]}>
              <Text style={[styles.pillText, { color: theme.colors.info }]}>
                {String(detail.source_from).toUpperCase()}
              </Text>
            </View>
          ) : (
            <Text style={[styles.value, { color: theme.colors.text }]}>—</Text>
          )
        }
      />
      <InfoRow label="Remarks" value={company.remarks ?? detail?.remarks} />
      <InfoRow label="Tags" value={tagNames} />
      <InfoRow
        label="Created Date"
        last
        right={
          <View style={styles.inlineValue}>
            <Ionicons name="calendar-outline" size={13} color={theme.colors.textMuted} />
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatCompanyDate(company.created_date) || '—'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    paddingBottom: 10,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef0f2',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 0,
    maxWidth: '42%',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  inlineValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  outlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
