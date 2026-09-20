import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useFeedback } from '@/lib/feedback';
import { format } from '@/locales';
import type { TeamAssignments } from '@/lib/teams';
import { colors, font, radius, spacing, teamColor } from '@/theme/theme';

interface Player {
  id: string;
  name: string;
}

/** The mode's own strings for the assignment UI — every team mode has the same keys. */
export interface TeamSetupCopy {
  teamCount: string;
  teamCountA11y: string;
  team: string;
  teamChipA11y: string;
  sitOutA11y: string;
  teamSummary: string;
}

interface TeamSetupProps {
  players: Player[];
  /** The team counts the mode allows, e.g. [2, 3, 4]. */
  teamCounts: number[];
  teamCount: number;
  onTeamCount: (count: number) => void;
  assignments: TeamAssignments;
  /** `null` takes the player out of the game. */
  onAssign: (playerId: string, teamIndex: number | null) => void;
  onRemove: (player: Player) => void;
  /** Player ids per team, as derived by the provider. */
  teams: string[][];
  minPerTeam: number;
  copy: TeamSetupCopy;
  /** Accessibility label for the ✕ control, with `{name}`. */
  removeA11y: string;
  /** Rendered between the team count and the roster — the "add a name" row. */
  children?: ReactNode;
  /** Called on any tap so the screen can clear a stale error message. */
  onInteract?: () => void;
}

/**
 * Team count selector, the roster with one chip per team, and a per-team summary.
 * Tapping a chip puts the player on that team; tapping it again takes them out of the game.
 */
export const TeamSetup = ({
  players,
  teamCounts,
  teamCount,
  onTeamCount,
  assignments,
  onAssign,
  onRemove,
  teams,
  minPerTeam,
  copy,
  removeA11y,
  children,
  onInteract,
}: TeamSetupProps) => {
  const feedback = useFeedback();

  return (
    <>
      <View style={styles.teamCountRow} accessibilityRole="radiogroup">
        <Text style={styles.teamCountLabel}>{copy.teamCount}</Text>
        <View style={styles.teamCountOptions}>
          {teamCounts.map((count) => {
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
                  onTeamCount(count);
                  onInteract?.();
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

      {children}

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
                accessibilityLabel={format(removeA11y, { name: player.name })}
                onPress={() => onRemove(player)}
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
                          ? format(copy.sitOutA11y, { name: player.name })
                          : format(copy.teamChipA11y, { name: player.name, number: teamIndex + 1 })
                      }
                      onPress={() => {
                        feedback.tap();
                        // Tapping the team you are already on takes you out of the game.
                        onAssign(player.id, selected ? null : teamIndex);
                        onInteract?.();
                      }}
                      hitSlop={4}
                      style={[
                        styles.teamChip,
                        selected && { backgroundColor: palette.bg, borderColor: palette.bg },
                      ]}
                    >
                      <Text style={[styles.teamChipLabel, selected && { color: palette.fg }]}>
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
        {teams.map((members, teamIndex) => {
          const palette = teamColor(teamIndex);
          const short = members.length < minPerTeam;
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
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
});
