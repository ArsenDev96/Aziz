import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BrandLogo } from '@/components/BrandLogo';
import { Screen } from '@/components/Screen';
import { LANGUAGE_LABELS, LANGUAGE_PROMPTS, LANGUAGES } from '@/locales';
import { useFeedback } from '@/lib/feedback';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

/**
 * First launch only: nothing is stored yet, so the prompt is shown in every language at once
 * and the choice becomes the app language before Home is ever seen.
 */
export default function LanguageScreen() {
  const { ready, languageChosen, setLanguage } = useSettings();
  const feedback = useFeedback();

  if (!ready) return <Screen />;
  if (languageChosen) return <Redirect href="/" />;

  return (
    <Screen center>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <BrandLogo />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.choices}>
        <View style={styles.prompt}>
          {LANGUAGES.map((language) => (
            <Text key={language} style={styles.promptLine}>
              {LANGUAGE_PROMPTS[language]}
            </Text>
          ))}
        </View>
        {LANGUAGES.map((language) => (
          <Pressable
            key={language}
            accessibilityRole="button"
            accessibilityLabel={LANGUAGE_LABELS[language]}
            onPress={() => {
              feedback.tap();
              setLanguage(language);
              router.replace('/');
            }}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonLabel}>{LANGUAGE_LABELS[language]}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
  },
  choices: {
    marginTop: spacing(5),
    gap: spacing(1.5),
  },
  prompt: {
    alignItems: 'center',
    gap: spacing(0.5),
    marginBottom: spacing(1),
  },
  promptLine: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing(2.5),
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonLabel: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.verdict,
    fontWeight: '900',
  },
});
