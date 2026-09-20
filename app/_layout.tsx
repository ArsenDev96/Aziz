import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActItProvider } from '@/state/act-it';
import { GameProvider } from '@/state/game';
import { SameAnswerProvider } from '@/state/same-answer';
import { SettingsProvider } from '@/state/settings';
import { colors } from '@/theme/theme';

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
