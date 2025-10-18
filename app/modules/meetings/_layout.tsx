import { Stack } from 'expo-router';

export default function MeetingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Chapter Meetings'
        }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ 
          headerShown: false,
          title: 'Add Meeting',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="[id]/edit" 
        options={{ 
          headerShown: false,
          title: 'Edit Meeting',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="[id]/attendance" 
        options={{ 
          headerShown: false,
          title: 'Attendance',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="[id]/visitors/add" 
        options={{ 
          headerShown: false,
          title: 'Add Visitor',
          presentation: 'card'
        }} 
      />
    </Stack>
  );
}
