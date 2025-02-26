import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staycation - Find Your Perfect Getaway',
  description: 'Discover and book unique accommodations around the world.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
