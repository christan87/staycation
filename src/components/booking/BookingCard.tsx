import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Booking } from '@/types/booking';
import BookingStatusBadge from './BookingStatusBadge';

interface BookingCardProps {
  booking: Booking;
}

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid date';
  }
};

export default function BookingCard({ booking }: BookingCardProps) {
  return (
    <Link 
      href={`/bookings/${booking.id}`}
      className="block bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-200"
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
  );
}