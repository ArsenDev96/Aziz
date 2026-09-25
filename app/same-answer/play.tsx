import { Redirect } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Countdown } from '@/components/Countdown';
import { Screen } from '@/components/Screen';
import { useFeedback } from '@/lib/feedback';
import { useQuitConfirm } from '@/lib/quit-confirm';
import { format } from '@/locales';
import {
  currentMatchChoices,
  currentTeam,
  roundProgress,
  teamPlayers,
  turnProgress,
} from '@/modes/same-answer/engine';
import { revealCountdownMs, sayItHoldMs, thinkMs } from '@/modes/same-answer/rules';
import { useSameAnswer } from '@/state/same-answer';
import { useStrings } from '@/state/settings';
import { colors, font, radius, spacing, teamColor } from '@/theme/theme';

export default function SameAnswerPlayScreen() {
  const strings = useStrings();
  const feedback = useFeedback();
  const { state, prompt, ready, thinkDone, revealDone, sayItDone, recordMatch, next, quit } =
    useSameAnswer();
  const copy = strings.sameAnswer;
  const phase = state?.phase;

  // The phone sits on the table while the team thinks and argues: never let it sleep mid-game.
  useKeepAwake();
  // ✕ and Android Back share one confirmation while a game is in progress.
  const confirmQuit = useQuitConfirm(quit, state !== null && phase !== 'results');

  // SAY IT stays up for a beat, then the match selector takes over on its own.
  useEffect(() => {
    if (phase !== 'sayIt') return;
    feedback.pass();
    const id = setTimeout(sayItDone, sayItHoldMs());
    return () => clearTimeout(id);
  }, [phase, feedback, sayItDone]);

  // Someone deep-linked or reloaded without a game in progress.
  if (!state) return <Redirect href="/" />;
  if (state.phase === 'results') return <Redirect href="/same-answer/results" />;

  const team = currentTeam(state);
  if (!team || !prompt) return <Redirect href="/" />;

  const palette = teamColor(team.number - 1);
  const teamName = format(copy.team, { number: team.number });
  const members = teamPlayers(state, team);
  const progress = turnProgress(state);
  const round = roundProgress(state);

  const teamBadge = (
    <View style={[styles.teamBadge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.teamBadgeLabel, { color: palette.fg }]}>{teamName}</Text>
    </View>
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <Text style={styles.progress}>
          {format(copy.turnCount, { current: progress.current, total: progress.total })}
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

      {state.phase === 'team' ? (
        <Animated.View key={`team-${state.turnIndex}`} entering={FadeIn.duration(250)} style={styles.body}>
          <Text style={styles.roundLabel}>
            {format(copy.roundCount, { current: round.current, total: round.total })}
          </Text>
          <Text style={[styles.teamTitle, { color: palette.bg }]}>{teamName}</Text>
          <Text style={styles.teamMembers}>{members.map((player) => player.name).join(' · ')}</Text>
          <Text style={styles.teamUp}>{copy.teamUp}</Text>

          <View style={styles.scoreboard}>
            {state.teams.map((other) => {
              const otherPalette = teamColor(other.number - 1);
              return (
                <View key={other.id} style={[styles.scoreChip, { borderColor: otherPalette.bg }]}>
                  <Text style={[styles.scoreChipTeam, { color: otherPalette.bg }]}>{other.number}</Text>
                  <Text style={styles.scoreChipScore}>{state.scores[other.id]}</Text>
                </View>
              );
            })}
          </View>

          <AzizButton label={copy.ready} onPress={ready} style={styles.readyButton} />
        </Animated.View>
      ) : null}

      {state.phase === 'think' ? (
        <Animated.View
          key={`think-${state.turnIndex}`}
          entering={ZoomIn.duration(220)}
          style={styles.body}
        >
          {teamBadge}
          <Text style={styles.prompt}>{prompt.text}</Text>
          <Text style={styles.hint}>{copy.thinkHint}</Text>
          <Countdown durationMs={thinkMs()} onDone={thinkDone} />
        </Animated.View>
      ) : null}

      {state.phase === 'reveal' ? (
        <Animated.View
          key={`reveal-${state.turnIndex}`}
          entering={FadeIn.duration(150)}
          style={styles.body}
        >
          <Text style={styles.promptSmall}>{prompt.text}</Text>
          <Text style={styles.revealHint}>{copy.revealHint}</Text>
          <Countdown durationMs={revealCountdownMs()} onDone={revealDone} color={colors.primary} />
        </Animated.View>
      ) : null}

      {state.phase === 'sayIt' ? (
        <Animated.View
          key={`sayit-${state.turnIndex}`}
          entering={ZoomIn.duration(180)}
          style={[styles.body, styles.sayItBody, { backgroundColor: palette.bg }]}
        >
          <Text style={[styles.sayIt, { color: palette.fg }]} accessibilityLiveRegion="assertive">
            {copy.sayIt}
          </Text>
        </Animated.View>
      ) : null}

      {state.phase === 'input' ? (
        <Animated.View
          key={`input-${state.turnIndex}`}
          entering={FadeInDown.duration(200)}
          style={styles.body}
        >
          <Text style={styles.promptSmall}>{prompt.text}</Text>
          <Text style={styles.matchHeading}>{copy.matchHeading}</Text>
          <Text style={styles.matchHint}>{copy.matchHint}</Text>
          <View style={styles.matchRow}>
            {currentMatchChoices(state).map((count) => (
              <Pressable
                key={count}
                accessibilityRole="button"
                accessibilityLabel={format(copy.matchChoiceA11y, { count })}
                onPress={() => {
                  if (count === 0) feedback.fail();
                  else feedback.pass();
                  recordMatch(count);
                }}
                style={({ pressed }) => [
                  styles.matchChoice,
                  count > 0 && { backgroundColor: palette.bg },
                  pressed && styles.matchChoicePressed,
                ]}
              >
                <Text style={[styles.matchChoiceLabel, count > 0 && { color: palette.fg }]}>
                  {count}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      ) : null}

      {state.phase === 'score' && state.lastResult ? (
        <Animated.View
          key={`score-${state.turnIndex}`}
          entering={ZoomIn.duration(220)}
          style={styles.body}
        >
          {teamBadge}
          <Text style={styles.scoreMatched}>
            {state.lastResult.matched === 0
              ? copy.scoreNoMatch
              : format(copy.scoreMatched, { count: state.lastResult.matched })}
          </Text>
          <Text style={[styles.scorePoints, state.lastResult.points === 0 && styles.scorePointsZero]}>
            {format(copy.scorePoints, { points: state.lastResult.points })}
          </Text>
          <Text style={styles.scoreTotal}>
            {format(copy.scoreTotal, { team: teamName, score: state.scores[team.id] })}
          </Text>
          <AzizButton label={copy.next} onPress={next} style={styles.readyButton} />
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
  roundLabel: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  teamTitle: {
    fontFamily: font.family,
    fontSize: font.display,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  teamMembers: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  teamUp: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.body,
    textAlign: 'center',
  },
  scoreboard: {
    flexDirection: 'row',
    gap: spacing(1),
    marginTop: spacing(1),
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.75),
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing(0.75),
    paddingHorizontal: spacing(1.5),
  },
  scoreChipTeam: {
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '900',
  },
  scoreChipScore: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
  },
  readyButton: {
    marginTop: spacing(3),
    alignSelf: 'stretch',
  },
  teamBadge: {
    borderRadius: radius.pill,
    paddingVertical: spacing(0.75),
    paddingHorizontal: spacing(2),
  },
  teamBadgeLabel: {
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '900',
    letterSpacing: 1,
  },
  prompt: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.question,
    fontWeight: '800',
    textAlign: 'center',
  },
  promptSmall: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.body,
    textAlign: 'center',
  },
  hint: {
    color: colors.accent,
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
    textAlign: 'center',
  },
  revealHint: {
    color: colors.primary,
    fontFamily: font.family,
    fontSize: font.title,
    fontWeight: '900',
    textAlign: 'center',
  },
  sayItBody: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    marginVertical: spacing(2),
  },
  sayIt: {
    fontFamily: font.family,
    fontSize: font.display * 1.5,
    lineHeight: font.display * 1.7,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  matchHeading: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  matchHint: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.label,
    textAlign: 'center',
  },
  matchRow: {
    flexDirection: 'row',
    gap: spacing(1.5),
    alignSelf: 'stretch',
    marginTop: spacing(2),
    height: 120,
  },
  matchChoice: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchChoicePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  matchChoiceLabel: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.display,
    fontWeight: '900',
  },
  scoreMatched: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  scorePoints: {
    color: colors.pass,
    fontFamily: font.family,
    fontSize: font.countdown * 0.7,
    lineHeight: font.countdown * 0.75,
    fontWeight: '900',
    textAlign: 'center',
  },
  scorePointsZero: {
    color: colors.textMuted,
  },
  scoreTotal: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.body,
    textAlign: 'center',
  },
});
