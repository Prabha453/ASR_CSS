import { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { COMPANY_WIZARD_STEPS } from '../constants/companyView.constants';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type CompanyWizardStepperProps = {
  currentStep: number;
};

export function CompanyWizardStepper({ currentStep }: CompanyWizardStepperProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      {COMPANY_WIZARD_STEPS.map((step, index) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        const last = index === COMPANY_WIZARD_STEPS.length - 1;
        const accent = theme.colors.primary;

        return (
          <View key={step.id} style={styles.stepWrap}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.circle,
                  {
                    borderColor: active || done ? accent : theme.colors.border,
                    backgroundColor: active || done ? accent : theme.colors.card,
                  },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Ionicons
                    name={step.icon as IoniconsName}
                    size={14}
                    color={active ? '#fff' : theme.colors.textMuted}
                  />
                )}
              </View>
              {!last ? (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: done ? accent : theme.colors.border,
                    },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: active ? accent : theme.colors.textMuted,
                  fontWeight: active ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {step.shortLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
  },
  stepCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 6,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  line: {
    position: 'absolute',
    left: '55%',
    right: '-45%',
    height: 2,
    top: 14,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
});
