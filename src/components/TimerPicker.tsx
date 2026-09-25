import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useFeedback } from '@/lib/feedback';
import { formatSeconds } from '@/lib/time';
import { format } from '@/locales';
import { TIMER_OPTIONS, type TimerSeconds } from '@/modes/wrong-answer/rules';
import { useStrings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

interface Props {
  value: TimerSeconds;
  onChange: (value: TimerSeconds) => void;
  style?: ViewStyle;
}

/**
 * "Timer  2.5 sec  3 sec  3.5 sec" picker for the normal-question clock. One line when it fits;
 * on narrow phones the chips wrap under the label, so the label is never cut short.
 */
export const TimerPicker = ({ value, onChange, style }: Props) => {
  const strings = useStrings();
  const feedback = useFeedback();

  return (
    <View style={[styles.row, style]} accessibilityRole="radiogroup">
      <Text style={styles.label}>{strings.players.timer}</Text>
      <View style={styles.options}>
        {TIMER_OPTIONS.map((seconds) => {
          const selected = seconds === value;
          const label = formatSeconds(seconds);
          return (
            <Pressable
              key={seconds}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={format(strings.players.timerOptionA11y, { seconds: label })}
              onPress={() => {
                if (selected) return;
                feedback.tap();
                onChange(seconds);
              }}
              hitSlop={6}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {format(strings.players.timerOption, { seconds: label })}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1.5),
  },
  label: {
    // Grows to push the chips right when everything fits on one line; when it doesn't, the
    // chips wrap to a second line and the whole word stays visible.
    flexGrow: 1,
    flexShrink: 0,
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 0,
    gap: spacing(0.75),
  },
  chip: {
    paddingVertical: spacing(1),
    // Narrow enough that "2.5 վրկ · 3 վրկ · 3.5 վրկ" stays on one row at 360dp.
    paddingHorizontal: spacing(1.25),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.label,
    fontWeight: '700',
  },
  chipLabelSelected: {
    color: colors.onPrimary,
  },
});
