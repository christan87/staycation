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

export default function MyPropertiesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ClientPage />
    </Suspense>
  );
}