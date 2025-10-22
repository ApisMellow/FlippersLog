import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'My High Scores',
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="capture"
          options={{
            title: 'Capture Score',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="manual-entry"
          options={{
            title: 'Enter Score',
            presentation: 'modal',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
