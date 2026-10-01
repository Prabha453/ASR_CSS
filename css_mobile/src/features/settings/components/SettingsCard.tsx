import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';

type SettingsCardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function SettingsCard({ children, style }: SettingsCardProps) {
  return (
    <EnterpriseCard style={style} padded>
      {children}
    </EnterpriseCard>
  );
}

const styles = StyleSheet.create({});
