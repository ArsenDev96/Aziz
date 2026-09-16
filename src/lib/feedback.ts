import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import { useSettings } from '@/state/settings';

/** Haptics that respect the user's setting and stay silent if the device has none. */
export const useFeedback = () => {
  const { settings } = useSettings();
  const enabled = settings.haptics;

  const run = useCallback(
    (action: () => Promise<void>) => {
      if (!enabled) return;
      action().catch(() => {
        // Device without a vibrator, or web — nothing to do.
      });
    },
    [enabled],
  );

  return useMemo(
    () => ({
      tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
      tick: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
      pass: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
      fail: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
    }),
    [run],
  );
};
