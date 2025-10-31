import { Stack } from 'expo-router';

export default function RequirementsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Requirements'
        }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ 
          headerShown: false,
          title: 'Add Requirement'
        }} 
      />
    </Stack>
  );
}
