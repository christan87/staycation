'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { CREATE_BOOKING } from '@/graphql/operations/booking/mutations';
import { GET_PROPERTY } from '@/graphql/operations/property/queries';

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

export default function BookingCreatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_PROPERTY,
            variables: {
              id: resolvedParams.id,
            },
          }),
        });

        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        setProperty(result.data.property);
      } catch (error) {
        console.error('Error fetching property:', error);
        alert('Failed to load property details');
      }
    };

    fetchProperty();
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CREATE_BOOKING,
          variables: {
            input: {
              propertyId: resolvedParams.id,
              ...bookingData,
            },
          },
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      if (!result.data?.createBooking?.success) {
        throw new Error(result.data?.createBooking?.message || 'Failed to create booking');
      }

      // Redirect to the bookings page after successful creation
      router.push('/bookings');
      router.refresh();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!property) {
    return (
      <Container>
        <div className="text-center py-8">Loading property details...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Book {property.title}</h1>
          <p className="text-gray-600">{property.location.city}, {property.location.country}</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">${property.price} / night</p>
        </div>

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
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
      </div>
    </Container>
  );
}