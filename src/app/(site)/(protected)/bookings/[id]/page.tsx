'use server';

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { format } from 'date-fns';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GET_BOOKING } from '@/graphql/operations/booking/queries';
import BookingStatusBadge from '@/components/booking/BookingStatusBadge';
import Image from 'next/image';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

async function getBooking(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return null;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.user.accessToken}`,
    },
    body: JSON.stringify({
      query: GET_BOOKING,
      variables: { id },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  return data.booking;
}

export default async function BookingPage({ params }: PageProps) {
  const booking = await getBooking(params.id);

  if (!booking) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative h-64 w-full">
            <Image
              src={booking.property.images[0]?.url || '/placeholder.jpg'}
              alt={booking.property.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {booking.property.title}
                </h1>
                <p className="mt-1 text-gray-500">
                  {booking.property.location}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Check-in</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(booking.checkIn), 'MMMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Check-out</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(booking.checkOut), 'MMMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Guests</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {booking.numberOfGuests}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${booking.totalPrice.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Booking Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(booking.createdAt), 'MMMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {booking.paymentStatus}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <Link
                href={`/properties/${booking.property.id}`}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                View Property Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}