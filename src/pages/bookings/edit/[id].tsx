import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { GET_BOOKING } from '@/graphql/operations/booking/queries';
import { UPDATE_BOOKING } from '@/graphql/operations/booking/mutations';
import { withAuth } from '@/components/withAuth';
import Link from 'next/link';

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

function EditBookingPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !session?.user) return;
    fetchBooking();
  }, [id, session]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_BOOKING,
          variables: { id },
        }),
        credentials: 'include',
      });

      const response = await res.json();
      
      if (response.errors) {
        console.error('GraphQL Error:', response.errors);
        throw new Error(response.errors[0].message);
      }
      
      const bookingData = response.data?.booking;
      if (bookingData) {
        setBooking(bookingData);
        setBookingData({
          checkIn: bookingData.checkIn.split('T')[0],
          checkOut: bookingData.checkOut.split('T')[0],
          numberOfGuests: bookingData.numberOfGuests,
        });
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : 1) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    try {
      setUpdating(true);
      setError('');

      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: UPDATE_BOOKING,
          variables: {
            input: {
              bookingId: booking.id,
              ...bookingData,
            },
          },
        }),
        credentials: 'include',
      });

      const response = await res.json();
      
      if (response.errors) {
        console.error('GraphQL Error:', response.errors);
        throw new Error(response.errors[0].message);
      }
      
      if (response.data?.updateBooking?.success) {
        alert('Booking updated successfully');
        router.push(`/bookings/${booking.id}`);
      } else {
        throw new Error(response.data?.updateBooking?.message || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="py-8 text-center">Loading booking details...</div>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container>
        <div className="py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The booking you're looking for doesn't exist or you don't have permission to edit it."}</p>
          <Button onClick={() => router.push('/bookings')}>Back to Bookings</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Booking</h1>
          <Link href={`/bookings/${booking.id}`} passHref>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{booking.property.title}</h2>
              <p className="text-gray-600">
                {booking.property.location.city}, {booking.property.location.country}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    id="checkIn"
                    name="checkIn"
                    value={bookingData.checkIn}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    id="checkOut"
                    name="checkOut"
                    value={bookingData.checkOut}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    id="numberOfGuests"
                    name="numberOfGuests"
                    value={bookingData.numberOfGuests}
                    onChange={handleInputChange}
                    min="1"
                    max={booking.property.maxGuests || 10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default withAuth(EditBookingPage);
