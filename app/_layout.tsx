import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorScreen } from '@/components/ErrorScreen';
import { ActItProvider } from '@/state/act-it';
import { GameProvider } from '@/state/game';
import { SameAnswerProvider } from '@/state/same-answer';
import { SettingsProvider } from '@/state/settings';
import { colors } from '@/theme/theme';

/** Any screen that throws while rendering shows the AZIZ error screen instead of a dead app. */
export const unstable_settings = {
  screenErrorBoundary: ErrorScreen,
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <GameProvider>
          <SameAnswerProvider>
            <ActItProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                  animation: 'fade',
                }}
              />
            </ActItProvider>
          </SameAnswerProvider>
        </GameProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
