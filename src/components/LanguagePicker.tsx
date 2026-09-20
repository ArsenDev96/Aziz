import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGUAGE_LABELS, LANGUAGES } from '@/locales';
import { useSettings } from '@/state/settings';
import { colors, font, radius, spacing } from '@/theme/theme';

interface Props {
  /** Smaller chips for the Home top bar, where the logo and cards should stay dominant. */
  compact?: boolean;
}

/** Segmented Հայերեն / English switch; the labels are language-neutral so it needs no strings. */
export const LanguagePicker = ({ compact }: Props) => {
  const { settings, setLanguage } = useSettings();
  return (
    <View style={styles.row}>
      {LANGUAGES.map((language) => {
        const selected = settings.language === language;
        return (
          <Pressable
            key={language}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setLanguage(language)}
            style={[styles.chip, compact && styles.chipCompact, selected && styles.chipSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {LANGUAGE_LABELS[language]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing(1),
  },
  chip: {
    paddingVertical: spacing(1.25),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipCompact: {
    paddingVertical: spacing(0.75),
    paddingHorizontal: spacing(1.75),
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '700',
  },
  labelSelected: {
    color: colors.onPrimary,
  },
});
