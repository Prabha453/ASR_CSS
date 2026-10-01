import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { INDIVIDUAL_RISK_META } from '../constants/individual.constants';
import { Individual } from '../types/individual.types';
import { formatIndividualDate } from '../utils/individual.utils';
import { IndividualStatusBadge } from './IndividualStatusBadge';

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

type IndividualViewOverviewProps = {
  individual: Individual;
};

export function IndividualViewOverview({ individual }: IndividualViewOverviewProps) {
  const { theme } = useTheme();
  const detail = individual.individual_detail;
  const risk = detail?.member_assessment_rating;
  const riskMeta = risk ? INDIVIDUAL_RISK_META[risk] : undefined;
  const tagNames = individual.tags
    ?.map((tag) => tag.tag_info?.tag_name)
    .filter(Boolean)
    .join(', ');

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
          <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
        </View>
        <View style={styles.sectionText}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Personal Information
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
            Key details of this individual
          </Text>
        </View>
      </View>

      <InfoRow label="Full Name" value={individual.name} />
      <InfoRow label="Former Name" value={detail?.former_name ?? individual.former_name} />
      <InfoRow label="Alias" value={detail?.member_alias_name} />
      <InfoRow label="Gender" value={detail?.member_gender?.replace(/_/g, ' ')} />
      <InfoRow
        label="Date of Birth"
        right={
          <View style={styles.inlineValue}>
            <Ionicons name="calendar-outline" size={13} color={theme.colors.textMuted} />
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatIndividualDate(detail?.member_dob) || '—'}
            </Text>
          </View>
        }
      />
      <InfoRow label="Country of Birth" value={detail?.country_of_birth} />
      <InfoRow
        label="Nationality"
        right={
          detail?.member_nationality ? (
            <View style={styles.inlineValue}>
              <Ionicons name="flag-outline" size={13} color={theme.colors.textMuted} />
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {detail.member_nationality}
              </Text>
            </View>
          ) : (
            <Text style={[styles.value, { color: theme.colors.text }]}>—</Text>
          )
        }
      />
      <InfoRow label="Status" right={<IndividualStatusBadge status={individual.status} />} />
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
      <InfoRow label="Client No." value={individual.client_no} />
      <InfoRow label="Notes" value={detail?.additional_notes} />
      <InfoRow label="Tags" value={tagNames} />
      <InfoRow
        label="Created Date"
        last
        right={
          <View style={styles.inlineValue}>
            <Ionicons name="calendar-outline" size={13} color={theme.colors.textMuted} />
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {formatIndividualDate(individual.created_date) || '—'}
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
