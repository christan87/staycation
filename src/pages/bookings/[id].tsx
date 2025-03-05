import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { format, parseISO, isValid } from 'date-fns';
import { GET_BOOKING } from '@/graphql/operations/booking/queries';
import { CANCEL_BOOKING } from '@/graphql/operations/booking/mutations';
import BookingStatusBadge from '@/components/booking/BookingStatusBadge';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { withAuth } from '@/components/withAuth';
import { BookingStatus } from '@/types/booking';

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
  status: BookingStatus;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to safely format dates
const formatDateSafely = (dateString: string) => {
  try {
    // Check if the dateString is a valid date
    const date = new Date(dateString);
    if (!isValid(date)) {
      return 'Invalid date';
    }
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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
      
      setBooking(response.data?.booking || null);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      setCancelling(true);
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CANCEL_BOOKING,
          variables: { bookingId: booking.id },
        }),
        credentials: 'include',
      });

      const response = await res.json();
      
      if (response.errors) {
        console.error('GraphQL Error:', response.errors);
        throw new Error(response.errors[0].message);
      }
      
      if (response.data?.cancelBooking?.success) {
        alert('Booking cancelled successfully');
        router.push('/bookings');
      } else {
        throw new Error(response.data?.cancelBooking?.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCancelling(false);
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
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push('/bookings')}>Back to Bookings</Button>
        </div>
      </Container>
    );
  }

  const canEdit = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';

  return (
    <Container>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <div className="flex space-x-4">
            {canEdit && (
              <Button
                onClick={() => router.push(`/bookings/edit/${booking.id}`)}
                variant="outline"
              >
                Edit Booking
              </Button>
            )}
            {canCancel && (
              <Button
                onClick={handleCancelBooking}
                variant="destructive"
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6">
                {booking.property.images && booking.property.images.length > 0 ? (
                  <div className="relative h-48 w-full rounded-lg overflow-hidden">
                    <Image
                      src={booking.property.images[0].url}
                      alt={booking.property.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
              </div>
              
              <div className="md:w-2/3">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      <Link href={`/properties/${booking.property.id}`} className="text-blue-600 hover:underline">
                        {booking.property.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 mb-2">
                      {booking.property.location.address}, {booking.property.location.city}, {booking.property.location.state}, {booking.property.location.country}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{formatDateSafely(booking.checkIn)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{formatDateSafely(booking.checkOut)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-medium">{booking.numberOfGuests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Price</p>
                    <p className="font-medium">${booking.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <p className="font-medium capitalize">{booking.paymentStatus.toLowerCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Booking Date</p>
                      <p className="font-medium">{formatDateSafely(booking.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default withAuth(BookingDetailPage);
