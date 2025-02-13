import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Booking - Staycation',
  description: 'Create a new booking for your perfect getaway',
} as const;

export const dynamic = 'force-dynamic';
export const revalidate = 0;