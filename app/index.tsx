import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AzizButton } from '@/components/AzizButton';
import { Screen } from '@/components/Screen';
import { useSettings } from '@/state/settings';
import { colors, font, spacing } from '@/theme/theme';

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
        <AzizButton label={strings.home.play} onPress={() => router.push('/players')} />
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
    marginTop: spacing(6),
    gap: spacing(2),
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
