import React from 'react';
import { View, Button } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ReferenceDetail({ route, navigation }) {
  const { reference } = route.params;

  return (
    <ThemedView>
      <ThemedText>{reference.title}</ThemedText>
      <ThemedText>{reference.details}</ThemedText>
      <Button title="Edit Reference" onPress={() => {}} />
    </ThemedView>
  );
}
