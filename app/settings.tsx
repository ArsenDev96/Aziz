import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Screen } from '@/components/Screen';
import { format } from '@/locales';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

export default function SettingsScreen() {
  const { settings, strings, setHaptics } = useSettings();

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
