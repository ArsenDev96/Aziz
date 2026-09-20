import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFeedback } from '@/lib/feedback';
import { nextTickDelayMs } from '@/lib/time';
import { colors, font, radius, spacing } from '@/theme/theme';

interface Props {
  /** Whole milliseconds. */
  durationMs: number;
  /** Fires once, when the clock reaches zero. */
  onDone: () => void;
  /** The last few seconds turn red and buzz, so actors feel the end coming. */
  warnAtMs?: number;
}

/**
 * A compact turn clock for the long (45 second) rounds. Unlike `Countdown` it stays small,
 * sits in a corner, and only vibrates during the final seconds.
 * Mounted fresh for every turn, so the starting value never needs resetting.
 */
export const TurnTimer = ({ durationMs, onDone, warnAtMs = 5000 }: Props) => {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const feedback = useFeedback();

  useEffect(() => {
    let remaining = durationMs;
    let id: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const delay = nextTickDelayMs(remaining);
      id = setTimeout(() => {
        remaining = Math.max(remaining - delay, 0);
        setRemainingMs(remaining);
        if (remaining <= 0) onDone();
        else tick();
      }, delay);
    };
    tick();
    return () => clearTimeout(id);
  }, [durationMs, onDone]);

  const warning = remainingMs <= warnAtMs;

  useEffect(() => {
    if (warning && remainingMs > 0) feedback.tick();
  }, [remainingMs, warning, feedback]);

  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <View style={[styles.pill, warning && styles.pillWarning]}>
      <Text
        style={[styles.digits, warning && styles.digitsWarning]}
        accessibilityLiveRegion={warning ? 'polite' : 'none'}
      >
        {seconds}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    minWidth: spacing(8),
    paddingVertical: spacing(0.75),
    paddingHorizontal: spacing(1.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  pillWarning: {
    backgroundColor: colors.primary,
  },
  digits: {
    color: colors.accent,
    fontSize: font.title,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  digitsWarning: {
    color: colors.onPrimary,
  },
});
