import { Stack } from 'expo-router';

export default function MeetingsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Meetings',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}
