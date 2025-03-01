'use client';

import { notFound, redirect, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import { GET_BOOKING } from '@/graphql/operations/booking/queries';
import BookingStatusBadge from '@/components/booking/BookingStatusBadge';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { BookingStatus } from '@/types/booking';

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

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
}

export default function BookingPage({ params }: BookingPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_BOOKING,
            variables: { id: resolvedParams.id },
          }),
        });

        const result = await response.json();
        
        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          throw new Error(result.errors[0].message);
        }

        if (!result.data?.booking) {
          throw new Error('Booking not found');
        }

        setBooking(result.data.booking);
      } catch (error) {
        console.error('Error fetching booking:', error);
        router.push('/bookings');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchBooking();
    }
  }, [resolvedParams.id, router, status]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!booking) {
    return notFound();
  }

  const formatDate = (dateString: string) => {
    try {
      // Try parsing as ISO string first
      const date = parseISO(dateString);
      return format(date, 'PPP');
    } catch (error) {
      // If that fails, try parsing as timestamp
      const timestamp = parseInt(dateString);
      if (!isNaN(timestamp)) {
        return format(new Date(timestamp), 'PPP');
      }
      console.error('Invalid date format:', dateString);
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-slate-900">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-semibold">Booking Details</h1>
          <BookingStatusBadge status={booking.status as BookingStatus} />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">{booking.property.title}</h2>
            {booking.property.images[0] && (
              <div className="relative h-64 w-full mb-4">
                <Image
                  src={booking.property.images[0].url}
                  alt={booking.property.title}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <p>
                <span className="font-medium">Location: </span>
                {booking.property.location.address}, {booking.property.location.city},{' '}
                {booking.property.location.state} {booking.property.location.zipCode},{' '}
                {booking.property.location.country}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Booking Information</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Check-in: </span>
                  {formatDate(booking.checkIn)}
                </p>
                <p>
                  <span className="font-medium">Check-out: </span>
                  {formatDate(booking.checkOut)}
                </p>
                <p>
                  <span className="font-medium">Guests: </span>
                  {booking.numberOfGuests}
                </p>
                <p>
                  <span className="font-medium">Total Price: </span>
                  ${booking.totalPrice}
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link
                href={`/bookings/edit/${booking.id}`}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Edit Booking
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}