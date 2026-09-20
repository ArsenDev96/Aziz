import { Redirect } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Countdown } from '@/components/Countdown';
import { Screen } from '@/components/Screen';
import { TurnTimer } from '@/components/TurnTimer';
import { useFeedback } from '@/lib/feedback';
import { useQuitConfirm } from '@/lib/quit-confirm';
import { createTapGuard } from '@/lib/tap-guard';
import { format, subjectName } from '@/locales';
import { canSkip, isLastTurn, roundProgress, skipsLeft, turnProgress } from '@/modes/act-it/engine';
import { goHoldMs, startCountdownMs, turnMs } from '@/modes/act-it/rules';
import { useActIt } from '@/state/act-it';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing, teamColor } from '@/theme/theme';

/**
 * How long CORRECT and SKIP stay deaf after one of them is accepted. Long enough to swallow a
 * double tap, short enough that the next card (which pops in over 160 ms) is live by the time
 * anyone can read it. Not a game rule — the engine never sees the second tap.
 */
const ACTION_LOCK_MS = 350;

interface StartCountdownProps {
  label: string;
  onGo: () => void;
}

/** 3 → 2 → 1, then GO flashes for a beat before the first card. Mounted fresh every turn. */
const StartCountdown = ({ label, onGo }: StartCountdownProps) => {
  const feedback = useFeedback();
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    if (!showGo) return;
    feedback.pass();
    const id = setTimeout(onGo, goHoldMs());
    return () => clearTimeout(id);
  }, [showGo, onGo, feedback]);

  if (showGo) {
    return (
      <Animated.View entering={ZoomIn.duration(150)} style={styles.goPanel}>
        <Text style={styles.go} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
          {label}
        </Text>
      </Animated.View>
    );
  }
  return (
    <Countdown
      durationMs={startCountdownMs()}
      onDone={() => setShowGo(true)}
      color={colors.primary}
    />
  );
};

/** "Mari and Davit", "Mari, Gor and Davit" — the last name joined with the locale's "and". */
const joinNames = (names: string[], and: string): string =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;

export default function ActItPlayScreen() {
  const { strings, settings } = useSettings();
  const feedback = useFeedback();
  const { state, card, team, guesser, actors, ready, go, markCorrect, skip, timeUp, next, quit } =
    useActIt();
  const copy = strings.actIt;
  const turnIndex = state?.turnIndex ?? 0;
  // One guard for both action buttons: a physical tap is one engine action, never two.
  const [actionGuard] = useState(() => createTapGuard(ACTION_LOCK_MS));

  // The phone is held to a forehead for 45 seconds: never let it sleep mid-turn.
  useKeepAwake();
  // ✕ and Android Back share one confirmation. During the live clock the ✕ is hidden on
  // purpose, but Back still has to ask rather than drop the turn.
  const confirmQuit = useQuitConfirm(quit, state !== null && state.phase !== 'results');

  // Someone deep-linked or reloaded without a game in progress.
  if (!state) return <Redirect href="/" />;
  if (state.phase === 'results') return <Redirect href="/act-it/results" />;
  if (!team || !guesser) return <Redirect href="/" />;

  const palette = teamColor(team.number - 1);
  const teamName = format(copy.team, { number: team.number });
  const guesserName = subjectName(settings.language, guesser.name);
  const progress = turnProgress(state);
  const round = roundProgress(state);
  const actorLine =
    actors.length === 1
      ? format(copy.actorsOne, { name: actors[0].name })
      : format(copy.actorsMany, { names: joinNames(actors.map((player) => player.name), copy.and) });

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
        {state.phase === 'playing' ? (
          <TurnTimer durationMs={turnMs()} onDone={timeUp} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.common.quit}
            onPress={confirmQuit}
            hitSlop={12}
          >
            <Text style={styles.quit}>✕</Text>
          </Pressable>
        )}
      </View>

      {state.phase === 'guesser' ? (
        <Animated.View key={`guesser-${turnIndex}`} entering={FadeIn.duration(250)} style={styles.body}>
          <Text style={styles.roundLabel}>
            {format(copy.roundCount, { current: round.current, total: round.total })}
          </Text>
          {teamBadge}
          {/* The three answers nobody should have to ask: who guesses, who acts, which team. */}
          <Text
            style={[styles.guesserName, { color: palette.bg }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {format(copy.guesserTitle, { name: guesserName })}
          </Text>
          <Text style={styles.actors}>{actorLine}</Text>
          <View style={styles.hintCard}>
            <Text style={styles.hint}>{copy.guesserHint}</Text>
          </View>
          <AzizButton label={copy.ready} onPress={ready} style={styles.wide} />
        </Animated.View>
      ) : null}

      {state.phase === 'countdown' ? (
        <Animated.View key={`countdown-${turnIndex}`} entering={FadeIn.duration(150)} style={styles.body}>
          <StartCountdown label={copy.go} onGo={go} />
        </Animated.View>
      ) : null}

      {state.phase === 'playing' && card ? (
        <View style={styles.body}>
          <View style={styles.statusRow}>
            <Text style={[styles.status, { color: palette.bg }]}>
              {format(copy.teamScore, { team: teamName, score: state.scores[team.id] })}
            </Text>
            <Text style={[styles.status, skipsLeft(state) === 0 && styles.statusOut]}>
              {format(copy.skipsLeft, { left: skipsLeft(state) })}
            </Text>
          </View>

          {/* Keyed by card so every new word pops in — the actors see the change instantly. */}
          <Animated.View key={card.id} entering={ZoomIn.duration(160)} style={styles.cardPanel}>
            {/* One word must never break mid-word: it shrinks instead. Two-word cards may wrap. */}
            <Text
              style={styles.word}
              numberOfLines={card.text.includes(' ') ? 2 : 1}
              adjustsFontSizeToFit
              minimumFontScale={0.4}
            >
              {card.text}
            </Text>
          </Animated.View>
          <Text style={styles.actorHint}>{copy.actorHint}</Text>

          <View style={styles.controls}>
            <AzizButton
              label={copy.skip}
              variant="accent"
              size="huge"
              disabled={!canSkip(state)}
              onPress={() => {
                actionGuard.accept(() => {
                  feedback.fail();
                  skip();
                });
              }}
            />
            <AzizButton
              label={copy.correct}
              variant="pass"
              size="huge"
              onPress={() => {
                actionGuard.accept(() => {
                  feedback.pass();
                  markCorrect();
                });
              }}
            />
          </View>
        </View>
      ) : null}

      {state.phase === 'timeUp' ? (
        <Animated.View key={`timeup-${turnIndex}`} entering={FadeInDown.duration(220)} style={styles.body}>
          <Text style={styles.timeUp}>{copy.timeUp}</Text>
          <Text style={styles.gotScore}>
            {format(copy.gotScore, { name: guesserName, score: state.turnCorrect })}
          </Text>
          <Text style={[styles.teamTotal, { color: palette.bg }]}>
            {format(copy.teamTotal, { team: teamName, score: state.scores[team.id] })}
          </Text>
          <AzizButton
            label={isLastTurn(state) ? copy.seeResults : copy.next}
            onPress={next}
            style={styles.wide}
          />
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
    minHeight: spacing(6),
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
  wide: {
    alignSelf: 'stretch',
    marginTop: spacing(2),
  },
  roundLabel: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
  },
  teamBadge: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
    borderRadius: radius.pill,
  },
  teamBadgeLabel: {
    fontSize: font.label,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  guesserName: {
    fontSize: font.display,
    fontWeight: '900',
    textAlign: 'center',
  },
  actors: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  hintCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(2),
  },
  hint: {
    color: colors.text,
    fontSize: font.body,
    textAlign: 'center',
  },
  goPanel: {
    alignSelf: 'stretch',
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.pass,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(2),
  },
  go: {
    color: colors.onAccent,
    fontSize: font.countdown * 0.8,
    lineHeight: font.countdown * 0.9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statusRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  status: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
  },
  statusOut: {
    color: colors.fail,
  },
  cardPanel: {
    alignSelf: 'stretch',
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(2),
  },
  word: {
    // Black on white, as big as the panel allows: this is read from across the table.
    color: colors.bg,
    fontSize: font.countdown * 0.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  actorHint: {
    color: colors.textMuted,
    fontSize: font.label,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing(2),
    alignSelf: 'stretch',
    height: 150,
  },
  timeUp: {
    color: colors.primary,
    fontSize: font.display,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  gotScore: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  teamTotal: {
    fontSize: font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
