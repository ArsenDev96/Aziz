import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { useFeedback } from '@/lib/feedback';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

interface ModeCardProps {
  name: string;
  tagline: string;
  href: Href;
  variant: 'primary' | 'accent';
}

const ModeCard = ({ name, tagline, href, variant }: ModeCardProps) => {
  const feedback = useFeedback();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => {
        feedback.tap();
        router.push(href);
      }}
      style={({ pressed }) => [
        styles.card,
        primary ? styles.cardPrimary : styles.cardAccent,
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={[styles.cardName, primary ? styles.onPrimary : styles.onAccent]}>{name}</Text>
      <Text style={[styles.cardTagline, primary ? styles.onPrimary : styles.onAccent]}>
        {tagline}
      </Text>
    </Pressable>
  );
};

export default function HomeScreen() {
  const { strings, ready } = useSettings();
  if (!ready) return <Screen />;

  return (
    <Screen center>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.logo}>{strings.app.name}</Text>
        <Text style={styles.tagline}>{strings.app.tagline}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.actions}>
        <Text style={styles.pickMode}>{strings.home.pickMode}</Text>
        <ModeCard
          name={strings.modes.wrongAnswer.name}
          tagline={strings.modes.wrongAnswer.tagline}
          href="/players"
          variant="primary"
        />
        <ModeCard
          name={strings.modes.sameAnswer.name}
          tagline={strings.modes.sameAnswer.tagline}
          href="/same-answer/setup"
          variant="accent"
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings')}
          style={styles.settingsLink}
        >
          <Text style={styles.settingsLabel}>{strings.home.settings}</Text>
        </Pressable>
      </Animated.View>
      <View style={styles.spacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing(1),
  },
  logo: {
    fontSize: 92,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing(5),
    gap: spacing(1.5),
  },
  pickMode: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing(0.5),
  },
  card: {
    borderRadius: radius.lg,
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3),
    gap: spacing(0.5),
  },
  cardPrimary: {
    backgroundColor: colors.primary,
  },
  cardAccent: {
    backgroundColor: colors.accent,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardName: {
    fontSize: font.body,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTagline: {
    fontSize: font.label,
    opacity: 0.85,
  },
  onPrimary: {
    color: colors.onPrimary,
  },
  onAccent: {
    color: colors.onAccent,
  },
  settingsLink: {
    alignSelf: 'center',
    padding: spacing(1.5),
  },
  settingsLabel: {
    color: colors.textMuted,
    fontSize: font.label,
  },
  spacer: {
    height: spacing(6),
  },
});
