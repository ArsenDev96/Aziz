import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { format, LANGUAGE_LABELS, LANGUAGES } from '@/locales';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

export default function SettingsScreen() {
  const { settings, strings, setLanguage, setHaptics } = useSettings();

  return (
    <Screen>
      <Text style={styles.title}>{strings.settings.title}</Text>

      <View style={styles.block}>
        <Text style={styles.label}>{strings.settings.language}</Text>
        <View style={styles.languageRow}>
          {LANGUAGES.map((language) => {
            const selected = settings.language === language;
            return (
              <Pressable
                key={language}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setLanguage(language)}
                style={[styles.languageChip, selected && styles.languageChipSelected]}
              >
                <Text style={[styles.languageLabel, selected && styles.languageLabelSelected]}>
                  {LANGUAGE_LABELS[language]}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  languageRow: {
    flexDirection: 'row',
    gap: spacing(1),
  },
  languageChip: {
    paddingVertical: spacing(1.25),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageLabel: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
  },
  languageLabelSelected: {
    color: colors.onPrimary,
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
