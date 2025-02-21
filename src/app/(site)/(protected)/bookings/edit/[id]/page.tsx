import EditBookingClient from './EditBookingClient';

export default function BookingEditPage({ params }: { params: { id: string } }) {
  return <EditBookingClient id={params.id} />;
}