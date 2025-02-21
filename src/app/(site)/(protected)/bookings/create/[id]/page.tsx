'use client';

import BookingCreateClient from './BookingCreateClient';

export default function BookingCreatePage({ params }: { params: { id: string } }) {
  return <BookingCreateClient id={params.id} />;
}