'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { UPDATE_BOOKING } from '@/graphql/operations/booking/mutations';
import { format, parseISO } from 'date-fns';

interface Property {
  id: string;
  title: string;
  price: number;
  maxGuests: number;
  images: { url: string }[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
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

export default function BookingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
  });

  const formatDateSafely = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      console.log('Formatting date:', dateString);
      
      // Handle Unix timestamp (milliseconds)
      const timestamp = parseInt(dateString);
      if (!isNaN(timestamp)) {
        const date = new Date(timestamp);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }
      
      // Handle regular date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '';
      }
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '';
    }
  };

  const getMinDate = (currentValue: string) => {
    if (booking && currentValue) {
      return undefined; 
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (booking) {
      console.log('Booking dates:', {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        checkInType: typeof booking.checkIn,
        checkOutType: typeof booking.checkOut
      });
    }
  }, [booking]);

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    const fetchBooking = async () => {
      console.log('Attempting to fetch booking with ID:', resolvedParams.id);
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query GetBooking($id: ID!) {
                booking(id: $id) {
                  id
                  property {
                    id
                    title
                    price
                    maxGuests
                    images {
                      url
                    }
                    location {
                      address
                      city
                      state
                      country
                      zipCode
                    }
                  }
                  checkIn
                  checkOut
                  numberOfGuests
                  totalPrice
                  status
                }
              }
            `,
            variables: {
              id: resolvedParams.id,
            },
          }),
        });

        console.log('GraphQL response status:', response.status);
        const result = await response.json();
        
        console.log('Raw GraphQL result:', JSON.stringify(result, null, 2));
        
        if (result.errors) {
          console.error('GraphQL Errors:', result.errors);
          console.error('Error details:', JSON.stringify(result.errors, null, 2));
          throw new Error(result.errors[0].message);
        }

        if (!result.data) {
          console.error('No data returned from GraphQL');
          throw new Error('No data returned from server');
        }

        if (!result.data.booking) {
          console.error('No booking found with ID:', resolvedParams.id);
          throw new Error('Booking not found');
        }

        console.log('Booking data structure:', {
          id: result.data.booking.id,
          propertyId: result.data.booking.property.id,
          checkIn: result.data.booking.checkIn,
          checkOut: result.data.booking.checkOut,
        });

        const fetchedBooking = {
          ...result.data.booking,
          property: {
            ...result.data.booking.property,
          },
        };

        console.log('Formatted booking data:', JSON.stringify(fetchedBooking, null, 2));
        setBooking(fetchedBooking);
      } catch (error) {
        console.error('Error in fetchBooking:', error);
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        alert('Failed to load booking details');
        router.push('/bookings');
      }
    };

    fetchBooking();
  }, [resolvedParams.id, router, session]);

  useEffect(() => {
    if (booking) {
      console.log('Raw booking dates:', {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut
      });

      try {
        const formattedCheckIn = formatDateSafely(booking.checkIn);
        const formattedCheckOut = formatDateSafely(booking.checkOut);
        
        console.log('Formatted dates:', {
          formattedCheckIn,
          formattedCheckOut
        });
        
        setBookingData(prevData => ({
          ...prevData,
          checkIn: formattedCheckIn,
          checkOut: formattedCheckOut,
          numberOfGuests: booking.numberOfGuests,
        }));
      } catch (error) {
        console.error('Error formatting dates:', error);
        console.error('Booking data:', booking);
      }
    }
  }, [booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);

      const checkInDate = new Date(bookingData.checkIn);
      const checkOutDate = new Date(bookingData.checkOut);
      
      checkInDate.setUTCHours(12, 0, 0, 0);
      checkOutDate.setUTCHours(12, 0, 0, 0);

      const formattedData = {
        bookingId: resolvedParams.id,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        numberOfGuests: bookingData.numberOfGuests
      };

      console.log('Submitting booking with dates:', {
        originalCheckIn: bookingData.checkIn,
        originalCheckOut: bookingData.checkOut,
        formattedCheckIn: formattedData.checkIn,
        formattedCheckOut: formattedData.checkOut
      });

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: UPDATE_BOOKING,
          variables: {
            input: formattedData,
          },
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      if (!result.data?.updateBooking?.success) {
        throw new Error(result.data?.updateBooking?.message || 'Failed to update booking');
      }

      router.push('/bookings');
      router.refresh();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <Container>
        <div className="text-center py-8">Loading booking details...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Booking for {booking.property.title}</h1>
          <p className="text-gray-600">{booking.property.location.city}, {booking.property.location.state}</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">${booking.property.price} / night</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4">
            <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">
              Check-in Date <span className="text-red-500">({formatDateSafely(booking?.checkIn)})</span>
            </label>
            <input
              type="date"
              id="checkIn"
              name="checkIn"
              required
              value={bookingData.checkIn}
              onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
              min={getMinDate(bookingData.checkIn)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700">
              Check-out Date <span className="text-red-500">({formatDateSafely(booking?.checkOut)})</span>
            </label>
            <input
              type="date"
              id="checkOut"
              name="checkOut"
              required
              value={bookingData.checkOut}
              onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
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
              onChange={(e) => setBookingData(prev => ({ ...prev, numberOfGuests: parseInt(e.target.value) }))}
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
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating Booking...' : 'Update Booking'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}