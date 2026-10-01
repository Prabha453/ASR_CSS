import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { INDIVIDUAL_WIZARD_STEPS } from '../constants/individual.constants';

type IndividualWizardStepperProps = {
  currentStep: number;
};

export function IndividualWizardStepper({ currentStep }: IndividualWizardStepperProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      {INDIVIDUAL_WIZARD_STEPS.map((step, index) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        const last = index === INDIVIDUAL_WIZARD_STEPS.length - 1;

        return (
          <View key={step.id} style={styles.stepWrap}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.circle,
                  {
                    borderColor: active || done ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active || done ? theme.colors.primary : theme.colors.card,
                  },
                ]}
              >
                <Text style={[styles.num, { color: active || done ? '#fff' : theme.colors.textMuted }]}>
                  {step.id}
                </Text>
              </View>
              {!last ? (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: done ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: active ? theme.colors.primary : theme.colors.textMuted,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  num: {
    fontSize: 12,
    fontWeight: '800',
  },
  line: {
    position: 'absolute',
    left: '55%',
    right: '-45%',
    height: 2,
    top: 13,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
});
