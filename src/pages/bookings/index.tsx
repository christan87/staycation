import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { GET_MY_BOOKINGS } from '@/graphql/operations/booking/queries';
import BookingList from '@/components/booking/BookingList';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { withAuth } from '@/components/withAuth';
import { Booking } from '@/types/booking';

function BookingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      return;
    }
    fetchBookings();
  }, [session]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_MY_BOOKINGS,
        }),
        credentials: 'include',
      });

      const response = await res.json();
      
      if (response.errors) {
        console.error('GraphQL Error:', response.errors);
        throw new Error(response.errors[0].message);
      }
      
      setBookings(response.data?.myBookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="pt-6">
        <div className="flex flex-row items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <Button 
            onClick={() => router.push('/bookings/new')}
            className="ml-4"
          >
            Create Booking
          </Button>
        </div>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <BookingList bookings={bookings} />
        )}
      </div>
    </Container>
  );
}

export default withAuth(BookingsPage);
