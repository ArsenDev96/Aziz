import { Redirect, router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Countdown } from '@/components/Countdown';
import { Screen } from '@/components/Screen';
import { useFeedback } from '@/lib/feedback';
import { format } from '@/locales';
import {
  currentPlayer,
  currentTimerMs,
  currentTurn,
  turnProgress,
} from '@/modes/wrong-answer/engine';
import { useGame } from '@/state/game';
import { useStrings } from '@/state/settings';
import { colors, font, spacing } from '@/theme/theme';

export default function PlayScreen() {
  const strings = useStrings();
  const feedback = useFeedback();
  const { state, question, beginQuestion, endQuestion, judge, quit } = useGame();

  // Someone deep-linked or reloaded without a game in progress.
  if (!state) return <Redirect href="/" />;
  if (state.phase === 'results') return <Redirect href="/game/results" />;

  const player = currentPlayer(state);
  const turn = currentTurn(state);
  if (!player || !turn || !question) return <Redirect href="/" />;

  const progress = turnProgress(state);
  const isSuddenDeath = turn.suddenDeathRound > 0;

  const confirmQuit = () =>
    Alert.alert(strings.common.quitConfirmTitle, strings.common.quitConfirmBody, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.common.confirm,
        style: 'destructive',
        onPress: () => {
          quit();
          router.replace('/');
        },
      },
    ]);

  return (
    <Screen>
      <View style={styles.topBar}>
        <Text style={styles.progress}>
          {isSuddenDeath
            ? strings.suddenDeath.title
            : format(strings.turn.questionCount, {
                current: progress.current,
                total: progress.total,
              })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.common.quit}
          onPress={confirmQuit}
          hitSlop={12}
        >
          <Text style={styles.quit}>✕</Text>
        </Pressable>
      </View>

      {state.phase === 'turn' ? (
        <Animated.View key={`turn-${state.turnIndex}`} entering={FadeIn.duration(250)} style={styles.body}>
          {isSuddenDeath ? <Text style={styles.suddenDeath}>{strings.suddenDeath.subtitle}</Text> : null}
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.turnHeading}>{format(strings.turn.heading, { name: player.name })}</Text>
          <AzizButton label={strings.turn.ready} onPress={beginQuestion} style={styles.readyButton} />
        </Animated.View>
      ) : null}

      {state.phase === 'question' ? (
        <Animated.View
          key={`question-${state.turnIndex}`}
          entering={ZoomIn.duration(220)}
          style={styles.body}
        >
          <Text style={styles.hint}>{strings.question.hint}</Text>
          <Text style={styles.question}>{question.text}</Text>
          <Countdown durationMs={currentTimerMs(state)} onDone={endQuestion} />
        </Animated.View>
      ) : null}

      {state.phase === 'judge' ? (
        <Animated.View
          key={`judge-${state.turnIndex}`}
          entering={FadeInDown.duration(200)}
          style={styles.body}
        >
          <Text style={styles.questionSmall}>{question.text}</Text>
          <Text style={styles.judgeHeading}>
            {format(strings.judge.heading, { name: player.name })}
          </Text>
          <View style={styles.verdictRow}>
            <AzizButton
              label={strings.judge.fail}
              variant="fail"
              size="huge"
              onPress={() => {
                feedback.fail();
                judge('fail');
              }}
            />
            <AzizButton
              label={strings.judge.pass}
              variant="pass"
              size="huge"
              onPress={() => {
                feedback.pass();
                judge('pass');
              }}
            />
          </View>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progress: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  quit: {
    color: colors.textMuted,
    fontSize: font.body,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
  },
  suddenDeath: {
    color: colors.accent,
    fontSize: font.label,
    textAlign: 'center',
  },
  playerName: {
    color: colors.primary,
    fontSize: font.display,
    fontWeight: '900',
    textAlign: 'center',
  },
  turnHeading: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
  },
  readyButton: {
    marginTop: spacing(3),
    alignSelf: 'stretch',
  },
  hint: {
    color: colors.accent,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  question: {
    color: colors.text,
    fontSize: font.question,
    fontWeight: '800',
    textAlign: 'center',
  },
  questionSmall: {
    color: colors.textMuted,
    fontSize: font.body,
    textAlign: 'center',
  },
  judgeHeading: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  verdictRow: {
    flexDirection: 'row',
    gap: spacing(2),
    alignSelf: 'stretch',
    marginTop: spacing(2),
    maxHeight: 220,
    flex: 1,
  },
});
