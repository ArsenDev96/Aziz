import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Screen } from '@/components/Screen';
import { format } from '@/locales';
import { ACT_IT_RULES } from '@/modes/act-it/rules';
import { useActIt } from '@/state/act-it';
import { useStrings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

export default function ActItIntroScreen() {
  const strings = useStrings();
  const { canStart, startGame } = useActIt();
  const mode = strings.modes.actIt;

  // Someone deep-linked or reloaded without a valid selection.
  if (!canStart) return <Redirect href="/act-it/setup" />;

  const rules = [
    mode.rule1,
    mode.rule2,
    mode.rule3,
    format(mode.rule4, { seconds: ACT_IT_RULES.turnSeconds }),
    mode.rule5,
  ];

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
          variant="pass"
          onPress={() => {
            startGame();
            router.replace('/act-it/play');
          }}
          style={styles.cta}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.pass,
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
    marginTop: spacing(3),
    gap: spacing(1),
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
  },
  ruleNumber: {
    color: colors.pass,
    fontSize: font.body,
    fontWeight: '900',
  },
  ruleText: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
  },
  cta: {
    marginTop: spacing(4),
  },
});
