'use client';

import { Button } from '@/components/Button';
import { Session } from 'next-auth';

interface DashboardClientProps {
  session: Session;
}

export function DashboardClient({ session }: DashboardClientProps) {
  return (
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Properties</h2>
          <p className="text-gray-600 mb-4">Manage your listed properties</p>
          <Button href="/properties/my" variant="primary">
            View Properties
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Bookings</h2>
          <p className="text-gray-600 mb-4">View your booking history</p>
          <Button href="/bookings" variant="primary">
            View Bookings
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">List Property</h2>
          <p className="text-gray-600 mb-4">Add a new property listing</p>
          <Button href="/properties/new" variant="primary">
            Add Property
          </Button>
        </div>
      </div>
    </div>
  );
}