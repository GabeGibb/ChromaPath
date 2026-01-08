import 'react-native-reanimated';

import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider, Theme } from 'tamagui';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import tamaguiConfig from '../tamagui.config';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig}>
        <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
          <SafeAreaProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#f8f9fa',
                },
              }}
            />
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </SafeAreaProvider>
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
