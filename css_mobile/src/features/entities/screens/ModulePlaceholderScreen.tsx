import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { AppHeader, ScreenShell } from '@/shared/components/layout';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'ModulePlaceholder'>;

export function ModulePlaceholderScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { title, description } = route.params;

  return (
    <ScreenShell
      header={
        <AppHeader title={title} leftAction="back" onLeftPress={() => navigation.goBack()} />
      }
    >
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}14` }]}>
          <Ionicons name="construct-outline" size={28} color={theme.colors.primary} />
        </View>
        <Text style={[textStyles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[textStyles.description, styles.body, { color: theme.colors.textMuted }]}>
          {description ||
            'This module is available on web. Mobile screens for list, create and detail flows will be added next.'}
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: designSystem.cardRadius,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  body: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
