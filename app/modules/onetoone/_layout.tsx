import { Stack } from 'expo-router';

export default function OneToOnesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}
