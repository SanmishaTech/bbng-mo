import { Stack } from 'expo-router';

export default function ReferencesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="detail" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="edit" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}
