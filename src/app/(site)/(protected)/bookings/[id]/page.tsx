'use server';

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { format } from 'date-fns';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GET_BOOKING } from '@/graphql/operations/booking/queries';
import BookingStatusBadge from '@/components/booking/BookingStatusBadge';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

type BookingPageProps = {
  params: {
    id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  return {
    title: `Booking ${params.id}`,
  };
}

async function getBooking(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return null;
  }

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BOOKING,
        variables: { id },
      }),
    });

    const result = await response.json();
    return result.data?.booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const booking = await getBooking(params.id);

  if (!booking) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Booking Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Information about your booking.
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Property</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link href={`/properties/${booking.property.id}`} className="text-blue-600 hover:text-blue-800">
                  {booking.property.title}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <BookingStatusBadge status={booking.status} />
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Check-in</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(booking.checkIn), 'PPP')}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Check-out</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(booking.checkOut), 'PPP')}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Number of Guests</dt>
              <dd className="mt-1 text-sm text-gray-900">{booking.numberOfGuests}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Total Price</dt>
              <dd className="mt-1 text-sm text-gray-900">${booking.totalPrice}</dd>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-5 sm:px-6">
          <div className="flex justify-end space-x-4">
            <Link
              href={`/bookings/edit/${booking.id}`}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}