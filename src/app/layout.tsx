import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Dynamically import ErrorBoundary with no SSR
const ErrorBoundary = dynamic(
  () => import('@/components/ErrorBoundary'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Staycation - Find Your Perfect Getaway',
  description: 'Discover and book unique accommodations around the world.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        inter.className,
        'min-h-screen bg-background text-foreground antialiased'
      )}>
        <NextAuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </NextAuthProvider>
      </body>
    </html>
  );
}
