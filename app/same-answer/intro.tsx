import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Screen } from '@/components/Screen';
import { useSameAnswer } from '@/state/same-answer';
import { useStrings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

export default function SameAnswerIntroScreen() {
  const strings = useStrings();
  const { canStart, startGame } = useSameAnswer();
  const mode = strings.modes.sameAnswer;

  // Someone deep-linked or reloaded without a valid team setup.
  if (!canStart) return <Redirect href="/same-answer/setup" />;

  const rules = [mode.rule1, mode.rule2, mode.rule3];

  return (
    <Screen center>
      <Animated.View entering={FadeInDown.duration(350)}>
        <Text style={styles.kicker}>{mode.tagline}</Text>
        <Text style={styles.title}>{mode.name}</Text>

        <View style={styles.rules}>
          {rules.map((rule, index) => (
            <View key={rule} style={styles.ruleRow}>
              <Text style={styles.ruleNumber}>{index + 1}</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <AzizButton
          label={mode.start}
          variant="accent"
          onPress={() => {
            startGame();
            router.replace('/same-answer/play');
          }}
          style={styles.cta}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.accent,
    fontSize: font.label,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: font.display,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing(1),
  },
  rules: {
    marginTop: spacing(4),
    gap: spacing(1.5),
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(2),
  },
  ruleNumber: {
    color: colors.accent,
    fontSize: font.body,
    fontWeight: '900',
  },
  ruleText: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
  },
  cta: {
    marginTop: spacing(5),
  },
});
