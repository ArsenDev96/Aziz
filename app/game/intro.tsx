import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AraButton } from '@/components/AraButton';
import { Screen } from '@/components/Screen';
import { format } from '@/locales';
import { WRONG_ANSWER_RULES } from '@/modes/wrong-answer/rules';
import { useGame } from '@/state/game';
import { useStrings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

export default function GameIntroScreen() {
  const strings = useStrings();
  const { startGame } = useGame();
  const mode = strings.modes.wrongAnswer;

  const rules = [
    mode.rule1,
    format(mode.rule2, { seconds: WRONG_ANSWER_RULES.timerSeconds }),
    mode.rule3,
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

        <AraButton
          label={mode.start}
          onPress={() => {
            startGame();
            router.replace('/game/play');
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
    color: colors.primary,
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
