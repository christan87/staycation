'use server';

/**
 * Dashboard Page
 * 
 * Main dashboard for authenticated users.
 */

import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome {session.user?.name}
          </h1>
          <p className="text-gray-600 mb-4">
            Your one-stop platform for managing and discovering amazing staycation properties.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse Properties</h2>
            <p className="text-gray-600 mb-4">
              Explore our curated list of staycation properties.
            </p>
            <Button variant="primary" className="w-full">
              View Properties
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Bookings</h2>
            <p className="text-gray-600 mb-4">
              View and manage your current bookings.
            </p>
            <Button variant="primary" className="w-full">
              View Bookings
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
            <p className="text-gray-600 mb-4">
              Update your profile and preferences.
            </p>
            <Button variant="primary" className="w-full">
              Go to Settings
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
