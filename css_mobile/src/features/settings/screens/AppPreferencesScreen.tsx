import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingsStackParamList } from '@/app/navigation/types';
import { useToast } from '@/shared/components/common/ToastProvider';
import { useTheme } from '@/shared/theme/ThemeContext';
import { designSystem } from '@/shared/theme/designSystem';
import { formInputLayout } from '@/shared/components/formInputs/formInputStyles';
import { SettingsDetailLayout, SettingsField, SettingsSaveBar } from '../components';
import { PAGE_SIZE_OPTIONS } from '../constants/settings.constants';
import { settingsService } from '../services/settings.service';
import { ThemeSettingsData } from '../types/settings.types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'AppPreferences'>;

export function AppPreferencesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState<ThemeSettingsData>({
    default_page_size: 10,
    breadcrumbs_visibility: 'show',
    footer_visibility: 'show',
    layout_type: 'vertical',
    layout_mode_type: 'light',
    topbar_theme_type: 'light',
    left_sidebar_type: 'dark',
    sidebar_visibility_type: 'show',
  });

  const { isLoading, isError } = useQuery({
    queryKey: ['settings', 'theme'],
    queryFn: async () => {
      const data = await settingsService.getThemeSettings();
      if (data) setForm((current) => ({ ...current, ...data }));
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      settingsService.saveThemeSettings({
        layoutType: form.layout_type,
        layoutModeType: form.layout_mode_type,
        leftSidebarType: form.left_sidebar_type,
        layoutWidthType: form.layout_width_type,
        layoutPositionType: form.layout_position_type,
        topbarThemeType: form.topbar_theme_type,
        leftsidbarSizeType: form.leftsidbar_size_type,
        leftSidebarViewType: form.left_sidebar_view_type,
        leftSidebarImageType: form.left_sidebar_image_type,
        preloader: form.preloader,
        sidebarVisibilitytype: form.sidebar_visibility_type,
        breadcrumbsVisibility: form.breadcrumbs_visibility,
        footerVisibility: form.footer_visibility,
        defaultPageSize: Number(form.default_page_size ?? 10),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast('App preferences updated successfully.', { type: 'success' });
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  return (
    <SettingsDetailLayout title="App Preferences" onBack={() => navigation.goBack()}>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Loading preferences...</Text>
        </View>
      ) : null}
      {isError ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>Could not load preferences.</Text> : null}

      <Text style={[formInputLayout.sectionLabel, { color: theme.colors.primary }]}>Default Page Size</Text>
      <View style={styles.chips}>
        {PAGE_SIZE_OPTIONS.map((option) => {
          const active = String(form.default_page_size ?? 10) === option;
          return (
            <Pressable
              key={option}
              onPress={() => setForm((current) => ({ ...current, default_page_size: Number(option) }))}
              style={[
                formInputLayout.chip,
                {
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? theme.colors.primary : theme.colors.card,
                },
              ]}
            >
              <Text style={[formInputLayout.chipText, { color: active ? '#fff' : theme.colors.primary }]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SettingsField label="Layout Type" value={form.layout_type ?? ''} onChangeText={(layout_type) => setForm((current) => ({ ...current, layout_type }))} />
      <SettingsField label="Layout Mode" value={form.layout_mode_type ?? ''} onChangeText={(layout_mode_type) => setForm((current) => ({ ...current, layout_mode_type }))} />
      <SettingsField label="Topbar Theme" value={form.topbar_theme_type ?? ''} onChangeText={(topbar_theme_type) => setForm((current) => ({ ...current, topbar_theme_type }))} />
      <SettingsField label="Sidebar Type" value={form.left_sidebar_type ?? ''} onChangeText={(left_sidebar_type) => setForm((current) => ({ ...current, left_sidebar_type }))} />
      <SettingsField label="Breadcrumbs Visibility" value={form.breadcrumbs_visibility ?? 'show'} onChangeText={(breadcrumbs_visibility) => setForm((current) => ({ ...current, breadcrumbs_visibility }))} />
      <SettingsField label="Footer Visibility" value={form.footer_visibility ?? 'show'} onChangeText={(footer_visibility) => setForm((current) => ({ ...current, footer_visibility }))} />

      <SettingsSaveBar loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
    </SettingsDetailLayout>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: designSystem.formFieldGap },
  loadingText: { fontSize: designSystem.formFontSize },
  errorText: { marginBottom: designSystem.formFieldGap, fontSize: designSystem.formFontSize },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: designSystem.formFieldGap },
});
