import { router, type ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AzizButton } from '@/components/AzizButton';
import { BrandLogo } from '@/components/BrandLogo';
import { Screen } from '@/components/Screen';
import { useStrings } from '@/state/settings';
import { colors, font, logo, spacing } from '@/theme/theme';

/**
 * What a player sees if a screen throws while rendering: the AZIZ mark, one plain sentence and
 * a way home. No stack traces — those go to the console in development only.
 */
export const ErrorScreen = ({ error, retry }: ErrorBoundaryProps) => {
  const strings = useStrings();

  useEffect(() => {
    if (__DEV__) console.error(error);
  }, [error]);

  return (
    <Screen center style={styles.screen}>
      <BrandLogo width={logo.homeWidth * 0.6} />
      <Text style={styles.title}>{strings.error.title}</Text>
      <Text style={styles.body}>{strings.error.body}</Text>
      <AzizButton
        label={strings.error.home}
        onPress={() => {
          // Leave the broken screen, then let the boundary drop its error state so Home (or
          // whatever renders next) mounts fresh.
          router.replace('/');
          void retry();
        }}
        style={styles.button}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    gap: spacing(2),
  },
  title: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: font.title,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing(2),
  },
  body: {
    color: colors.textMuted,
    fontFamily: font.family,
    fontSize: font.body,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing(3),
  },
});
