import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useFeedback } from '@/lib/feedback';
import { formatSeconds, msToSeconds, nextTickDelayMs } from '@/lib/time';
import { colors, font } from '@/theme/theme';

interface Props {
  /** Whole milliseconds, so a 2.5 second clock shows 2.5 → 1.5 → 0.5 → done. */
  durationMs: number;
  /** Fires once, when the clock reaches zero. */
  onDone: () => void;
  /** Digit color; defaults to the accent used by the question clock. */
  color?: string;
}

/** Mounted fresh for every turn, so the starting value never needs resetting. */
export const Countdown = ({ durationMs, onDone, color = colors.accent }: Props) => {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const feedback = useFeedback();
  const scale = useSharedValue(1);

  useEffect(() => {
    let remaining = durationMs;
    let id: ReturnType<typeof setTimeout> | undefined;
    // A timeout chain rather than an interval: the last step can be shorter than a second.
    const tick = () => {
      const delay = nextTickDelayMs(remaining);
      id = setTimeout(() => {
        remaining = Math.max(remaining - delay, 0);
        setRemainingMs(remaining);
        if (remaining <= 0) {
          onDone();
        } else {
          tick();
        }
      }, delay);
    };
    tick();
    return () => clearTimeout(id);
  }, [durationMs, onDone]);

  useEffect(() => {
    if (remainingMs <= 0) return;
    feedback.tick();
    scale.value = withSequence(
      withTiming(1.18, { duration: 110 }),
      withTiming(1, { duration: 220 }),
    );
  }, [remainingMs, feedback, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={[styles.digit, { color }]} accessibilityLiveRegion="polite">
        {formatSeconds(msToSeconds(Math.max(remainingMs, 0)))}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  digit: {
    fontSize: font.countdown,
    lineHeight: font.countdown * 1.1,
    fontWeight: '900',
    color: colors.accent,
    textAlign: 'center',
  },
});
