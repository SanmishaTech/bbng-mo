import { Stack } from 'expo-router';

export default function ChaptersLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Chapters',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
