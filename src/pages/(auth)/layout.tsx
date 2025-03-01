/**
 * Auth Layout
 * 
 * Provides a consistent layout for authentication pages (login/register)
 * with a centered container and navigation back to home.
 */

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Staycation
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
