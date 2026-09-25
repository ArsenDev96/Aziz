import { Redirect, router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BrandLogo } from '@/components/BrandLogo';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Screen } from '@/components/Screen';
import { useFeedback } from '@/lib/feedback';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

interface ModeCardProps {
  name: string;
  tagline: string;
  href: Href;
  variant: 'primary' | 'accent' | 'pass';
}

const ModeCard = ({ name, tagline, href, variant }: ModeCardProps) => {
  const feedback = useFeedback();
  const cardStyle =
    variant === 'primary'
      ? styles.cardPrimary
      : variant === 'accent'
        ? styles.cardAccent
        : styles.cardPass;
  const textStyle = variant === 'primary' ? styles.onPrimary : styles.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => {
        feedback.tap();
        router.push(href);
      }}
      style={({ pressed }) => [styles.card, cardStyle, pressed && styles.cardPressed]}
    >
      <Text style={[styles.cardName, textStyle]}>{name}</Text>
      <Text style={[styles.cardTagline, textStyle]}>{tagline}</Text>
    </Pressable>
  );
};

export default function HomeScreen() {
  const { strings, ready, languageChosen } = useSettings();
  if (!ready) return <Screen />;
  // First launch: pick a language before anything on Home is read.
  if (!languageChosen) return <Redirect href="/language" />;

  return (
    <Screen style={styles.screen}>
      {/* Language first: a new table should be able to switch before reading anything else. */}
      <View style={styles.topBar}>
        <LanguagePicker compact />
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <BrandLogo />
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
          <ModeCard
            name={strings.modes.actIt.name}
            tagline={strings.modes.actIt.tagline}
            href="/act-it/setup"
            variant="pass"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={styles.settingsLink}
          >
            <Text style={styles.settingsLabel}>{strings.home.settings}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing(1),
  },
  topBar: {
    alignItems: 'flex-end',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing(2),
  },
  header: {
    alignItems: 'center',
    gap: spacing(1),
  },
  tagline: {
    fontFamily: font.family,
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing(2),
    gap: spacing(1.5),
  },
  pickMode: {
    color: colors.textMuted,
    fontFamily: font.family,
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
  cardPass: {
    backgroundColor: colors.pass,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardName: {
    fontFamily: font.family,
    fontSize: font.body,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTagline: {
    fontFamily: font.family,
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
    padding: spacing(1),
  },
  settingsLabel: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.label,
  },
});
