import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

export default function ReferenceEdit({ route, navigation }) {
  const [title, setTitle] = useState(''); // Initialize with existing data for editing
  const [details, setDetails] = useState('');

  const handleSave = () => {
    // Logic to save the reference
  };

  return (
    <ThemedView>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{ margin: 16, padding: 8, borderRadius: 4, borderColor: '#ccc', borderWidth: 1 }}
      />
      <TextInput
        placeholder="Details"
        value={details}
        onChangeText={setDetails}
        style={{ margin: 16, padding: 8, borderRadius: 4, borderColor: '#ccc', borderWidth: 1 }}
      />
      <Button title="Save Reference" onPress={handleSave} />
    </ThemedView>
  );
}
