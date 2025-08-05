import React from 'react';
import { useRouter } from 'expo-router';
import ReferenceForm from './ReferenceForm';

export default function AddReference() {
  const router = useRouter();
  
  return <ReferenceForm />;
}
