'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Booking } from '@/types/booking';
import BookingStatusBadge from './BookingStatusBadge';
import { Button } from '@/components/Button';

const DELETE_BOOKING = `
  mutation DeleteBooking($bookingId: ID!) {
    deleteBooking(bookingId: $bookingId) {
      success
      message
    }
  }
`;

interface BookingCardProps {
  booking: Booking;
  onDelete?: () => void;
}

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid date';
  }
};

export default function BookingCard({ booking, onDelete }: BookingCardProps) {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CancelBooking($bookingId: ID!) {
              cancelBooking(bookingId: $bookingId) {
                success
                message
              }
            }
          `,
          variables: {
            bookingId: booking.id,
          },
        }),
      });

      const result = await response.json();

      if (!result.data?.cancelBooking?.success) {
        throw new Error(result.data?.cancelBooking?.message || 'Failed to cancel booking');
      }

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete();
      }

      // Refresh the page to show updated state
      router.refresh();
    } catch (error) {
      console.error('Error canceling booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel booking');
    }
  };

  const handleDeleteBooking = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    
    if (!confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DELETE_BOOKING,
          variables: {
            bookingId: booking.id,
          },
        }),
      });

      const result = await response.json();

      if (!result.data?.deleteBooking?.success) {
        throw new Error(result.data?.deleteBooking?.message || 'Failed to delete booking');
      }

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete();
      }

      // Refresh the page to show updated state
      router.refresh();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete booking');
    }
  };

  const handleUpdate = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    router.push(`/bookings/edit/${booking.id}`);
  };

  return (
    <div className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-200">
      <Link 
        href={`/bookings/${booking.id}`}
        className="block"
      >
        <div className="flex">
          <div className="relative w-32 h-32">
            <Image
              src={booking.property.images[0]?.url || '/placeholder.jpg'}
              alt={booking.property.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {booking.property.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {booking.property.location.city}, {booking.property.location.state}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            
            <div className="mt-4 space-y-1 text-sm text-gray-500">
              <p>
                Check-in: {formatDate(booking.checkIn)}
              </p>
              <p>
                Check-out: {formatDate(booking.checkOut)}
              </p>
              <p>
                Guests: {booking.numberOfGuests}
              </p>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <p className="text-lg font-semibold text-gray-900">
                ${booking.totalPrice.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                Booked {formatDate(booking.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Action Buttons */}
      <div className="border-t border-gray-200 p-4 flex justify-end space-x-4">
        {booking.status === 'CANCELLED' ? (
          <Button
            onClick={handleDeleteBooking}
            variant="destructive"
            size="sm"
          >
            Delete Booking
          </Button>
        ) : (
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="sm"
          >
            Cancel Booking
          </Button>
        )}
        <Button
          onClick={handleUpdate}
          variant="outline"
          size="sm"
        >
          Update
        </Button>
      </div>
    </div>
  );
}