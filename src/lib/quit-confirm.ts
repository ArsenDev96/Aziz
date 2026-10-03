import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useConfirm } from '@/components/ConfirmDialog';
import { useStrings } from '@/state/settings';

/**
 * The one way out of a game in progress. Returns `confirmQuit` for the ✕ button and, while
 * `active`, sends Android Back (button or edge swipe) through the very same dialog, so a stray
 * gesture at the table can never drop the scores without asking. Cancel leaves everything —
 * phase, clock, scores — exactly as it was, because nothing but the dialog happened.
 *
 * The listener is only registered while this screen is focused; React Native calls the most
 * recently added handler first, so returning `true` here stops the navigator's own Back.
 * While the dialog is open, Android delivers Back to its Modal (which cancels), not to this
 * listener, so a second press can never open a second dialog.
 */
export const useQuitConfirm = (quit: () => void, active: boolean): (() => void) => {
  const strings = useStrings();
  const confirm = useConfirm();

  const confirmQuit = useCallback(() => {
    confirm({
      title: strings.common.quitConfirmTitle,
      body: strings.common.quitConfirmBody,
      confirmLabel: strings.common.confirm,
      cancelLabel: strings.common.cancel,
      onConfirm: () => {
        quit();
        router.replace('/');
      },
    });
  }, [strings, quit, confirm]);

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
