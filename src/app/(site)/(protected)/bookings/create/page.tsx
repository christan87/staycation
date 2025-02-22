'use client';

import dynamic from 'next/dynamic';

// Import the client component dynamically with no SSR
const ClientPageWrapper = dynamic(
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

// Keep this as a Server Component
export default function CreateBookingPage() {
  return (
    <div suppressHydrationWarning>
      <ClientPageWrapper />
    </div>
  );
}