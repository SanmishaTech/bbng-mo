import React from 'react';
import { View, Text, Button } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

export default function ReferenceDetail({ route, navigation }) {
  const { reference } = route.params;

  return (
    <ThemedView>
      <Text>{reference.title}</Text>
      <Text>{reference.details}</Text>
      <Button title="Edit Reference" onPress={() => {}} />
    </ThemedView>
  );
}
