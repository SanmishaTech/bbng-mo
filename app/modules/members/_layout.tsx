import { Stack } from 'expo-router';

export default function MembersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="[id]/edit" />
      <Stack.Screen name="[id]/profile" />
    </Stack>
  );
}
