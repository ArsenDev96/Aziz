import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useFeedback } from '@/lib/feedback';
import { colors, font } from '@/theme/theme';

interface Props {
  seconds: number;
  /** Fires once, when the clock reaches zero. */
  onDone: () => void;
}

/** Mounted fresh for every turn, so the starting value never needs resetting. */
export const Countdown = ({ seconds, onDone }: Props) => {
  const [remaining, setRemaining] = useState(seconds);
  const feedback = useFeedback();
  const scale = useSharedValue(1);

  useEffect(() => {
    let value = seconds;
    const id = setInterval(() => {
      value -= 1;
      setRemaining(Math.max(value, 0));
      if (value <= 0) {
        clearInterval(id);
        onDone();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, onDone]);

  useEffect(() => {
    if (remaining <= 0) return;
    feedback.tick();
    scale.value = withSequence(
      withTiming(1.18, { duration: 110 }),
      withTiming(1, { duration: 220 }),
    );
  }, [remaining, feedback, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={styles.digit} accessibilityLiveRegion="polite">
        {Math.max(remaining, 0)}
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
