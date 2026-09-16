import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { useFeedback } from '@/lib/feedback';
import { colors, font, radius, spacing } from '@/theme/theme';

type Variant = 'primary' | 'accent' | 'pass' | 'fail' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'normal' | 'huge';
  disabled?: boolean;
  style?: ViewStyle;
}

const background: Record<Variant, string> = {
  primary: colors.primary,
  accent: colors.accent,
  pass: colors.pass,
  fail: colors.fail,
  ghost: 'transparent',
};

const foreground: Record<Variant, string> = {
  primary: colors.onPrimary,
  accent: colors.onAccent,
  pass: colors.onAccent,
  fail: colors.onPrimary,
  ghost: colors.textMuted,
};

export const AzizButton = ({
  label,
  onPress,
  variant = 'primary',
  size = 'normal',
  disabled,
  style,
}: Props) => {
  const feedback = useFeedback();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'huge' && styles.huge,
        { backgroundColor: background[variant] },
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, size === 'huge' && styles.hugeLabel, { color: foreground[variant] }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing(2.25),
    paddingHorizontal: spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  huge: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing(5),
    // Narrow side padding so the longest Armenian verdict stays on one line.
    paddingHorizontal: spacing(1),
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    fontSize: font.body,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  hugeLabel: {
    // Sized so the longest Armenian verdict still fits on one line at 360dp.
    fontSize: font.verdict,
    letterSpacing: 0,
  },
});
