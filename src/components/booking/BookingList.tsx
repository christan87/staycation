'use client';

import { Booking } from '@/types/booking';
import BookingCard from './BookingCard';

interface BookingListProps {
  bookings: Booking[];
  emptyMessage?: string;
}

export default function BookingList({ 
  bookings, 
  emptyMessage = 'No bookings found.' 
}: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}