'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { GET_BOOKING } from '@/graphql/operations/booking/queries';
import { UPDATE_BOOKING } from '@/graphql/operations/booking/mutations';

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

interface Booking {
  id: string;
  property: Property;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  totalPrice: number;
  status: string;
}

export default function EditBookingClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
  });

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_BOOKING,
            variables: {
              id,
            },
          }),
        });

        const { data } = await response.json();
        if (data?.booking) {
          setBooking(data.booking);
          setBookingData({
            checkIn: data.booking.checkIn,
            checkOut: data.booking.checkOut,
            numberOfGuests: data.booking.numberOfGuests,
          });
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !session?.user) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: UPDATE_BOOKING,
          variables: {
            id: booking.id,
            ...bookingData,
          },
        }),
      });

      const { data, errors } = await response.json();
      
      if (errors) {
        throw new Error(errors[0].message);
      }

      if (data?.updateBooking) {
        router.push('/bookings');
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-8">Loading booking details...</div>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Booking not found</h1>
          <p className="mt-2 text-gray-600">The booking you're looking for doesn't exist or has been removed.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Booking for {booking.property.title}</h1>
          <p className="text-gray-600">{booking.property.location.city}, {booking.property.location.country}</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">${booking.property.price} / night</p>
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
              min={bookingData.checkIn}
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
              max={booking.property.maxGuests}
              value={bookingData.numberOfGuests}
              onChange={(e) => setBookingData({ ...bookingData, numberOfGuests: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Maximum {booking.property.maxGuests} guests</p>
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
              disabled={updating}
              className="flex-1"
            >
              {updating ? 'Updating Booking...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}