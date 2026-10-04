import { Redirect } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Countdown } from '@/components/Countdown';
import { Screen } from '@/components/Screen';
import { useFeedback } from '@/lib/feedback';
import { useQuitConfirm } from '@/lib/quit-confirm';
import { format, subjectName } from '@/locales';
import {
  currentPlayer,
  currentTimerMs,
  currentTurn,
  showsScoreboard,
  standings,
  turnProgress,
} from '@/modes/wrong-answer/engine';
import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

export default function PlayScreen() {
  const { strings, settings } = useSettings();
  const feedback = useFeedback();
  const { state, question, beginQuestion, endQuestion, judge, quit } = useGame();

  // The phone is passed around and read from across the table: never let it sleep mid-game.
  useKeepAwake();
  // ✕ and Android Back share one confirmation while a game is in progress.
  const confirmQuit = useQuitConfirm(quit, state !== null && state.phase !== 'results');

  // Someone deep-linked or reloaded without a game in progress.
  if (!state) return <Redirect href="/" />;
  if (state.phase === 'results') return <Redirect href="/game/results" />;

  const player = currentPlayer(state);
  const turn = currentTurn(state);
  if (!player || !turn || !question) return <Redirect href="/" />;

  const progress = turnProgress(state);
  const isSuddenDeath = turn.suddenDeathRound > 0;

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

          {showsScoreboard(state) ? (
            <View style={styles.scoreboard} accessibilityLabel={strings.turn.scoreboard}>
              {standings(state).map(({ player: other, score, rank }) => {
                // Nobody leads a table of zeros.
                const leads = rank === 1 && score > 0;
                return (
                  <View
                    key={other.id}
                    accessible
                    accessibilityLabel={format(strings.turn.scoreChipA11y, {
                      name: other.name,
                      score,
                    })}
                    style={[styles.scoreChip, leads && styles.scoreChipLeader]}
                  >
                    <Text style={styles.scoreChipName} numberOfLines={1}>
                      {other.name}
                    </Text>
                    <Text style={[styles.scoreChipScore, leads && styles.scoreChipScoreLeader]}>
                      {score}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}

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
            {format(strings.judge.heading, { name: subjectName(settings.language, player.name) })}
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
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  quit: {
    color: colors.textMuted,
    fontFamily: font.family,
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
    fontFamily: font.family,
    fontSize: font.label,
    textAlign: 'center',
  },
  playerName: {
    color: colors.primary,
    fontFamily: font.family,
    fontSize: font.display,
    fontWeight: '900',
    textAlign: 'center',
  },
  turnHeading: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.body,
    textAlign: 'center',
  },
  scoreboard: {
    // Up to 8 players: one-line chips wrap into centred rows instead of one tall list.
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: spacing(0.75),
    marginTop: spacing(1),
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing(0.75),
    maxWidth: spacing(18),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(1.5),
  },
  scoreChipLeader: {
    borderColor: colors.accent,
  },
  scoreChipName: {
    flexShrink: 1,
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
  },
  scoreChipScore: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.body,
    fontWeight: '900',
  },
  scoreChipScoreLeader: {
    color: colors.accent,
  },
  readyButton: {
    marginTop: spacing(3),
    alignSelf: 'stretch',
  },
  hint: {
    color: colors.accent,
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  question: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.question,
    fontWeight: '800',
    textAlign: 'center',
  },
  questionSmall: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.body,
    textAlign: 'center',
  },
  judgeHeading: {
    color: colors.text,
    fontFamily: font.family,
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
