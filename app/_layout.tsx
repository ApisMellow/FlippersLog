import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
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
    </>
  );
}
