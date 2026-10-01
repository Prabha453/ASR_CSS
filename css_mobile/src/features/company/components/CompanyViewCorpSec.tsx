import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Company } from '../types/company.types';
import { formatCompanyDate, isTruthyFlag } from '../utils/company.utils';

type CompanyViewCorpSecProps = {
  company: Company;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[textStyles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value || '—'}</Text>
    </View>
  );
}

function yesNo(value?: number | boolean | null) {
  if (value == null) return '—';
  return isTruthyFlag(value) ? 'Yes' : 'No';
}

export function CompanyViewCorpSec({ company }: CompanyViewCorpSecProps) {
  const detail = company.company_detail;

  return (
    <View style={styles.wrap}>
      <Section title="Key Dates">
        <Row label="Incorporation" value={formatCompanyDate(detail?.company_incorporation_date)} />
        <Row label="Takeover" value={formatCompanyDate(detail?.company_takeover_date)} />
        <Row label="Financial Year End" value={formatCompanyDate(detail?.company_fin_date)} />
        <Row label="Dormant Date" value={formatCompanyDate(detail?.dormant_date)} />
        <Row label="Strike Off Date" value={formatCompanyDate(detail?.strike_off_date)} />
      </Section>

      <Section title="Settings">
        <Row label="Mail Redirection" value={yesNo(detail?.mail_redirection)} />
        <Row label="XBRL Required" value={yesNo(detail?.company_xbrl_required)} />
        <Row label="Public Interest Company" value={yesNo(detail?.public_interest_company)} />
        <Row label="Person In Charge" value={detail?.person_in_charge} />
        <Row label="Holding Company" value={detail?.holding_company_name} />
      </Section>

      <Section title="Principal Activities">
        <Row label="Primary SSIC" value={detail?.ssic_id != null ? String(detail.ssic_id) : null} />
        <Row label="Primary Description" value={detail?.ssic_user_description} />
        <Row label="Secondary SSIC" value={detail?.ssic_id_secondary != null ? String(detail.ssic_id_secondary) : null} />
        <Row label="Secondary Description" value={detail?.ssic_user_description_secondary} />
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: designSystem.cardGap },
  card: {
    borderWidth: 1,
    borderRadius: designSystem.cardRadius,
    padding: 14,
    gap: 12,
  },
  rows: { gap: 10 },
  row: { gap: 2 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
});
