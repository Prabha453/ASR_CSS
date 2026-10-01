import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconCircle } from '@/shared/components/common/IconCircle';
import { IconName, IconTokenKey } from '@/shared/theme/iconTokens';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type EnterpriseListRowProps = {
  title: string;
  description?: string;
  icon: IconName;
  iconToken?: IconTokenKey;
  onPress: () => void;
  showDivider?: boolean;
  showChevron?: boolean;
};

export function EnterpriseListRow({
  title,
  description,
  icon,
  iconToken = 'primary',
  onPress,
  showDivider = true,
  showChevron = true,
}: EnterpriseListRowProps) {
  const { theme } = useTheme();

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.82 : 1 }]}
        onPress={onPress}
      >
        <IconCircle name={icon} token={iconToken} />
        <View style={styles.textWrap}>
          <Text style={[textStyles.cardTitle, styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {description ? (
            <Text
              style={[textStyles.description, styles.description, { color: theme.colors.textMuted }]}
              numberOfLines={1}
            >
              {description}
            </Text>
          ) : null}
        </View>
        {showChevron ? (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        ) : null}
      </Pressable>
      {showDivider ? <View style={[styles.divider, { backgroundColor: theme.colors.border }]} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: designSystem.listRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: designSystem.screenPadding,
    paddingVertical: 12,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: designSystem.screenPadding + designSystem.iconCircleSize + 14,
  },
});
