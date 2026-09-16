import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from '@/state/game';
import { SettingsProvider } from '@/state/settings';
import { colors } from '@/theme/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <GameProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          />
        </GameProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
