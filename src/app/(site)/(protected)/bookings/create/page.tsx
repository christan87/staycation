'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import the client component dynamically
const ClientPage = dynamic(
  () => import('./ClientPage'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
);

// Wrap the component in a client-side only boundary
export default function CreateBookingPage() {
  return (
    <div suppressHydrationWarning>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <ClientPage />
      </Suspense>
    </div>
  );
}