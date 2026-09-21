import Constants from 'expo-constants';
import { openURL } from 'expo-linking';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Screen } from '@/components/Screen';
import { format } from '@/locales';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

/** Public privacy policy, also linked from the Play Store listing. */
const PRIVACY_POLICY_URL = 'https://aziz-party.vercel.app/privacy';

export default function SettingsScreen() {
  const { settings, strings, setHaptics } = useSettings();

  // Opens in the system browser. A device with nothing to handle the URL rejects the
  // promise; tell the reader the address instead of crashing.
  const openPrivacyPolicy = async () => {
    try {
      await openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert(
        strings.settings.privacyPolicyErrorTitle,
        format(strings.settings.privacyPolicyErrorBody, { url: PRIVACY_POLICY_URL }),
      );
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{strings.settings.title}</Text>

      <View style={styles.block}>
        <Text style={styles.label}>{strings.settings.language}</Text>
        <LanguagePicker />
      </View>

      <View style={[styles.block, styles.switchRow]}>
        <Text style={styles.label}>{strings.settings.haptics}</Text>
        <Switch
          value={settings.haptics}
          onValueChange={setHaptics}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.text}
        />
      </View>

      <View style={styles.spacer} />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={strings.settings.privacyPolicy}
        onPress={openPrivacyPolicy}
        style={({ pressed }) => [styles.block, styles.linkRow, pressed && styles.linkRowPressed]}
      >
        {/* The Armenian label wraps at 360dp: it gives way so the glyph keeps its padding. */}
        <Text style={[styles.label, styles.linkLabel]}>{strings.settings.privacyPolicy}</Text>
        <Text style={styles.linkGlyph}>↗</Text>
      </Pressable>
      <Text style={styles.version}>
        {format(strings.settings.version, {
          version: Constants.expoConfig?.version ?? '0.1.0',
        })}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backLabel}>{strings.settings.back}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: '900',
  },
  block: {
    marginTop: spacing(3),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(2),
    gap: spacing(1.5),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: spacing(2),
  },
  linkRowPressed: {
    opacity: 0.85,
  },
  linkLabel: {
    flex: 1,
    marginRight: spacing(1),
  },
  linkGlyph: {
    color: colors.textMuted,
    fontSize: font.body,
  },
  version: {
    color: colors.textMuted,
    fontSize: font.label,
    textAlign: 'center',
    marginBottom: spacing(1),
  },
  back: {
    alignSelf: 'center',
    padding: spacing(1.5),
  },
  backLabel: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: '700',
  },
});
