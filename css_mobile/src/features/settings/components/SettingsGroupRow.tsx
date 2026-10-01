import { EnterpriseListRow } from '@/shared/components/common/EnterpriseListRow';
import { IconTokenKey } from '@/shared/theme/iconTokens';
import { SettingsIconName } from '../types/settings.types';

type SettingsGroupRowProps = {
  title: string;
  description?: string;
  icon: SettingsIconName;
  iconToken?: IconTokenKey;
  color?: string;
  onPress: () => void;
  showDivider?: boolean;
};

export function SettingsGroupRow({
  title,
  description,
  icon,
  iconToken = 'primary',
  onPress,
  showDivider = true,
}: SettingsGroupRowProps) {
  return (
    <EnterpriseListRow
      title={title}
      description={description}
      icon={icon}
      iconToken={iconToken}
      onPress={onPress}
      showDivider={showDivider}
    />
  );
}
