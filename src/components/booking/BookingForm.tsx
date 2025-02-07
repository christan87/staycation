'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/Button';
import { CREATE_BOOKING } from '@/graphql/operations/booking/mutations';

interface Property {
  id: string;
  title: string;
  price: number;
  maxGuests: number;
  images: { url: string }[];
  location: {
    city: string;
    country: string;
  };
}

interface BookingFormProps {
  property: Property;
}

export default function BookingForm({ property }: BookingFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    try {
      setLoading(true);
      
      // Format dates to ISO string with proper timezone handling
      const checkInDate = new Date(bookingData.checkIn);
      const checkOutDate = new Date(bookingData.checkOut);
      
      // Set the time to noon to avoid timezone issues
      checkInDate.setHours(12, 0, 0, 0);
      checkOutDate.setHours(12, 0, 0, 0);

      // Validate dates
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (checkInDate < now) {
        throw new Error('Check-in date must be in the future');
      }

      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date');
      }

      const formattedData = {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        numberOfGuests: Number(bookingData.numberOfGuests)
      };

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: CREATE_BOOKING,
          variables: {
            input: {
              propertyId: property.id,
              ...formattedData,
            },
          },
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // Check if the mutation was successful
      if (!result.data?.createBooking?.success) {
        throw new Error(result.data?.createBooking?.message || 'Failed to create booking');
      }

      // Redirect to the bookings page after successful creation
      router.push('/user/bookings');
      router.refresh();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">
          Check-in Date
        </label>
        <input
          type="date"
          id="checkIn"
          name="checkIn"
          required
          value={bookingData.checkIn}
          onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
          min={minDate}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 !text-slate-900 bg-white dark:bg-gray-100"
        />
      </div>

      <div>
        <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700">
          Check-out Date
        </label>
        <input
          type="date"
          id="checkOut"
          name="checkOut"
          required
          value={bookingData.checkOut}
          onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
          min={bookingData.checkIn || minDate}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 !text-slate-900 bg-white dark:bg-gray-100"
        />
      </div>

      <div>
        <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700">
          Number of Guests
        </label>
        <input
          type="number"
          id="numberOfGuests"
          name="numberOfGuests"
          required
          min="1"
          max={property.maxGuests}
          value={bookingData.numberOfGuests}
          onChange={(e) => setBookingData({ ...bookingData, numberOfGuests: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 !text-slate-900 bg-white dark:bg-gray-100"
        />
        <p className="mt-1 text-sm text-gray-500">Maximum {property.maxGuests} guests</p>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Creating Booking...' : 'Confirm Booking'}
        </Button>
      </div>
    </form>
  );
}