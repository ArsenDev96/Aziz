import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Screen } from '@/components/Screen';
import { useFeedback } from '@/lib/feedback';
import { format, subjectName, type Strings } from '@/locales';
import type { Player, SetupError } from '@/modes/same-answer/engine';
import { SAME_ANSWER_RULES } from '@/modes/same-answer/rules';
import { WRONG_ANSWER_RULES } from '@/modes/wrong-answer/rules';
import { useGame } from '@/state/game';
import { useSameAnswer } from '@/state/same-answer';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing, teamColor } from '@/theme/theme';

const TEAM_COUNTS = Array.from(
  { length: SAME_ANSWER_RULES.maxTeams - SAME_ANSWER_RULES.minTeams + 1 },
  (_, i) => SAME_ANSWER_RULES.minTeams + i,
);

const errorMessage = (error: SetupError, strings: Strings['sameAnswer']): string => {
  switch (error) {
    case 'tooFewPlayers':
      return format(strings.errorTooFewPlayers, { min: SAME_ANSWER_RULES.minPlayers });
    case 'tooManyPlayers':
      return format(strings.errorTooManyPlayers, { max: SAME_ANSWER_RULES.maxPlayers });
    case 'tooFewTeams':
      return format(strings.errorTooFewTeams, { min: SAME_ANSWER_RULES.minTeams });
    case 'tooManyTeams':
      return format(strings.errorTooManyTeams, { max: SAME_ANSWER_RULES.maxTeams });
    case 'teamTooSmall':
      return format(strings.errorTeamTooSmall, { min: SAME_ANSWER_RULES.minPlayersPerTeam });
    case 'unassignedPlayer':
      return strings.errorUnassigned;
    case 'duplicatePlayer':
      return strings.errorDuplicate;
  }
};

export default function SameAnswerSetupScreen() {
  const { strings, settings } = useSettings();
  const feedback = useFeedback();
  // The roster (and its persistence) is shared with Wrong Answer Only.
  const { addPlayer, removePlayer } = useGame();
  const { players, teamCount, setTeamCount, assignments, assign, setup, setupErrors, canStart } =
    useSameAnswer();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const copy = strings.sameAnswer;

  const submit = () => {
    const result = addPlayer(name);
    if (result.ok) {
      setName('');
      setError(null);
      return;
    }
    setError(
      result.reason === 'empty'
        ? strings.players.errorEmpty
        : result.reason === 'duplicate'
          ? strings.players.errorDuplicate
          : format(strings.players.errorTooMany, { max: WRONG_ANSWER_RULES.maxPlayers }),
    );
  };

  const confirmRemove = (player: Player) =>
    Alert.alert(format(strings.players.removeTitle, { name: player.name }), strings.players.removeBody, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.players.removeConfirm,
        style: 'destructive',
        onPress: () => {
          removePlayer(player.id);
          setError(null);
        },
      },
    ]);

  const start = () => {
    if (!canStart) {
      setError(errorMessage(setupErrors[0], copy));
      return;
    }
    router.push('/same-answer/intro');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.kicker}>{strings.modes.sameAnswer.name}</Text>
        <Text style={styles.title}>{copy.setupTitle}</Text>
        <Text style={styles.subtitle}>
          {format(copy.setupSubtitle, {
            minPlayers: SAME_ANSWER_RULES.minPlayers,
            maxPlayers: SAME_ANSWER_RULES.maxPlayers,
            minTeams: SAME_ANSWER_RULES.minTeams,
            maxTeams: SAME_ANSWER_RULES.maxTeams,
            minPerTeam: SAME_ANSWER_RULES.minPlayersPerTeam,
          })}
        </Text>

        <View style={styles.teamCountRow} accessibilityRole="radiogroup">
          <Text style={styles.teamCountLabel}>{copy.teamCount}</Text>
          <View style={styles.teamCountOptions}>
            {TEAM_COUNTS.map((count) => {
              const selected = count === teamCount;
              return (
                <Pressable
                  key={count}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLabel={format(copy.teamCountA11y, { count })}
                  onPress={() => {
                    if (selected) return;
                    feedback.tap();
                    setTeamCount(count);
                    setError(null);
                  }}
                  style={[styles.countChip, selected && styles.countChipSelected]}
                >
                  <Text style={[styles.countChipLabel, selected && styles.countChipLabelSelected]}>
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError(null);
            }}
            placeholder={strings.players.placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            returnKeyType="done"
            maxLength={16}
            autoCorrect={false}
            onSubmitEditing={submit}
          />
          <AzizButton
            label={strings.players.add}
            variant="accent"
            onPress={submit}
            style={styles.addButton}
          />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          {players.map((player) => {
            const assigned = assignments[player.id];
            const current = assigned !== undefined && assigned < teamCount ? assigned : null;
            return (
              <Animated.View
                key={player.id}
                entering={FadeIn.duration(200)}
                layout={LinearTransition.duration(200)}
                style={styles.playerRow}
              >
                {/* Removal sits on the far side from the chips, which shift as the team count
                    changes, and always asks first — one stray tap must never lose a name. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={format(strings.players.remove, { name: player.name })}
                  onPress={() => confirmRemove(player)}
                  hitSlop={6}
                  style={styles.remove}
                >
                  <Text style={styles.removeLabel}>✕</Text>
                </Pressable>
                <Text
                  style={[styles.playerName, current === null && styles.playerNameOut]}
                  numberOfLines={1}
                >
                  {player.name}
                </Text>
                <View style={styles.teamChips}>
                  {Array.from({ length: teamCount }, (_, teamIndex) => {
                    const selected = current === teamIndex;
                    const palette = teamColor(teamIndex);
                    return (
                      <Pressable
                        key={teamIndex}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={
                          selected
                            ? format(copy.sitOutA11y, {
                                name: subjectName(settings.language, player.name),
                              })
                            : format(copy.teamChipA11y, { name: player.name, number: teamIndex + 1 })
                        }
                        onPress={() => {
                          feedback.tap();
                          // Tapping the team you are already on takes you out of the game.
                          assign(player.id, selected ? null : teamIndex);
                          setError(null);
                        }}
                        hitSlop={4}
                        style={[
                          styles.teamChip,
                          selected && { backgroundColor: palette.bg, borderColor: palette.bg },
                        ]}
                      >
                        <Text
                          style={[styles.teamChipLabel, selected && { color: palette.fg }]}
                        >
                          {teamIndex + 1}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>

        <View style={styles.summary}>
          {setup.teams.map((members, teamIndex) => {
            const palette = teamColor(teamIndex);
            const short = members.length < SAME_ANSWER_RULES.minPlayersPerTeam;
            return (
              <View
                key={teamIndex}
                style={[styles.summaryCard, { borderColor: palette.bg }, short && styles.summaryCardShort]}
              >
                {/* Four cards share 312dp at the narrowest phones, so each line stays single
                    and shrinks a notch instead of wrapping "0 players" onto two rows. */}
                <Text
                  style={[styles.summaryName, { color: palette.bg }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {format(copy.team, { number: teamIndex + 1 })}
                </Text>
                <Text
                  style={styles.summaryCount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {format(copy.teamSummary, { count: members.length })}
                </Text>
              </View>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AzizButton label={copy.start} onPress={start} disabled={!canStart} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  kicker: {
    color: colors.accent,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing(0.5),
  },
  title: {
    fontSize: font.title,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: font.label,
    color: colors.textMuted,
    marginTop: spacing(0.5),
  },
  teamCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(1),
    marginTop: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
  },
  teamCountLabel: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  teamCountOptions: {
    flexDirection: 'row',
    gap: spacing(0.75),
  },
  countChip: {
    minWidth: spacing(5.5),
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1.5),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  countChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  countChipLabel: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
  },
  countChipLabelSelected: {
    color: colors.onPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing(1),
    marginTop: spacing(1.5),
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: font.body,
  },
  addButton: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
  },
  list: {
    paddingVertical: spacing(1.5),
    gap: spacing(1),
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.25),
  },
  playerName: {
    // The name gives way first: the team chips are the fixed part of the row at 360dp.
    flex: 1,
    flexShrink: 1,
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  playerNameOut: {
    color: colors.textMuted,
  },
  teamChips: {
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing(0.5),
  },
  teamChip: {
    width: spacing(4.5),
    height: spacing(4.5),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamChipLabel: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '900',
  },
  remove: {
    // Same footprint as a team chip, so the row reads as one control per side.
    width: spacing(4),
    height: spacing(4),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    color: colors.textMuted,
    fontSize: font.label,
  },
  summary: {
    flexDirection: 'row',
    gap: spacing(0.75),
    marginBottom: spacing(1.5),
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing(1),
    // Tight on purpose: at 360dp with four teams each card is only ~70dp wide.
    paddingHorizontal: spacing(0.5),
    alignItems: 'center',
  },
  summaryCardShort: {
    opacity: 0.5,
  },
  summaryName: {
    fontSize: font.label,
    fontWeight: '900',
  },
  summaryCount: {
    color: colors.textMuted,
    fontSize: font.label,
  },
  error: {
    color: colors.fail,
    fontSize: font.label,
    marginBottom: spacing(1),
  },
});
