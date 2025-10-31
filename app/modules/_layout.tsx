import { Stack } from "expo-router";

export default function ModulesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
      <Stack.Screen 
        name="regions" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="states" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="chapters" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="locations" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="categories" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="subcategories" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="packages" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="members" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="memberships" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}
