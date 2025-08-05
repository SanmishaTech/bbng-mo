import React from 'react';
import DoneDealForm from './DoneDealForm';
import { NavigationHeader } from '@/components/NavigationHeader';

export default function DoneDealsAdd() {
  return (
    <>
      <NavigationHeader title="Add Done Deal"/>
      <DoneDealForm />
    </>
  );
}
