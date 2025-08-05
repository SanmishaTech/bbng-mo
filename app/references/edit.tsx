import React from 'react';
import { useRouter } from 'expo-router';
import ReferenceForm from './ReferenceForm';

export default function EditReference() {
  const router = useRouter();
  
  return <ReferenceForm />;
}
