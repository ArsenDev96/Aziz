import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useStrings } from '@/state/settings';

/**
 * The one way out of a game in progress. Returns `confirmQuit` for the ✕ button and, while
 * `active`, sends Android Back (button or edge swipe) through the very same dialog, so a stray
 * gesture at the table can never drop the scores without asking. Cancel leaves everything —
 * phase, clock, scores — exactly as it was, because nothing but the dialog happened.
 *
 * The listener is only registered while this screen is focused; React Native calls the most
 * recently added handler first, so returning `true` here stops the navigator's own Back.
 * While the native dialog is open, Android delivers Back to the dialog, not to the app, so a
 * second press can never open a second dialog.
 */
export const useQuitConfirm = (quit: () => void, active: boolean): (() => void) => {
  const strings = useStrings();

  const confirmQuit = useCallback(() => {
    Alert.alert(strings.common.quitConfirmTitle, strings.common.quitConfirmBody, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.common.confirm,
        style: 'destructive',
        onPress: () => {
          quit();
          router.replace('/');
        },
      },
    ]);
  }, [strings, quit]);

  useFocusEffect(
    useCallback(() => {
      if (!active) return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        confirmQuit();
        return true;
      });
      return () => subscription.remove();
    }, [active, confirmQuit]),
  );

  return confirmQuit;
};
