import { Stack } from "expo-router";

export default function ModulesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="onetoone" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="meetings" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="visitors" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}
