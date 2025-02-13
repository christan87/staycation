import { Suspense } from 'react';
import ClientPage from './ClientPage';
import { metadata } from './config';

export { metadata };

export default async function CreateBookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage />
    </Suspense>
  );
}