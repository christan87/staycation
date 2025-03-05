import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { CREATE_BOOKING } from '@/graphql/operations/booking/mutations';
import { CHECK_PROPERTY_AVAILABILITY } from '@/graphql/operations/booking/queries';
import { GET_PROPERTIES_STRING } from '@/graphql/operations/property/queries';
import { withAuth } from '@/components/withAuth';

interface Property {
  id: string;
  title: string;
  images: { url: string }[];
  location: {
    city: string;
    country: string;
  };
  price: number;
  description: string;
}

function NewBookingPage() {
  const router = useRouter();
  const { propertyId } = router.query;
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    propertyId: '',
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
  });

  useEffect(() => {
    if (propertyId) {
      setBookingData(prev => ({ ...prev, propertyId: propertyId as string }));
    }
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId) {
      fetchProperties();
    }
  }, [propertyId]);

  const fetchProperties = async () => {
    try {
      setPropertiesLoading(true);
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_PROPERTIES_STRING,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.data?.properties?.items) {
        setProperties(data.data.properties.items);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : 1) : value,
    }));
    
    // Reset availability check when dates change
    if (name === 'checkIn' || name === 'checkOut') {
      setIsAvailable(false);
      setAvailabilityMessage('');
    }
  };

  const checkAvailability = async () => {
    if (!bookingData.propertyId || !bookingData.checkIn || !bookingData.checkOut) {
      setError('Please fill in all required fields');
      return false;
    }

    try {
      setChecking(true);
      setError('');

      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CHECK_PROPERTY_AVAILABILITY,
          variables: {
            propertyId: bookingData.propertyId,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
          },
        }),
        credentials: 'include',
      });

      const response = await res.json();
      
      if (response.errors) {
        console.error('GraphQL Error:', response.errors);
        throw new Error(response.errors[0].message);
      }
      
      const availability = response.data?.checkAvailability;
      setIsAvailable(availability?.available || false);
      setAvailabilityMessage(availability?.message || '');
      
      return availability?.available || false;
    } catch (error) {
      console.error('Error checking availability:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check availability first if not already checked
    if (!isAvailable) {
      const available = await checkAvailability();
      if (!available) return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CREATE_BOOKING,
          variables: {
            input: bookingData,
          },
        }),
        credentials: 'include',
      });

      const response = await res.json();
      
      if (response.errors) {
        console.error('GraphQL Error:', response.errors);
        throw new Error(response.errors[0].message);
      }
      
      if (response.data?.createBooking?.success) {
        alert('Booking created successfully');
        const newBookingId = response.data.createBooking.booking.id;
        router.push(`/bookings/${newBookingId}`);
      } else {
        throw new Error(response.data?.createBooking?.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!propertyId) {
    return (
      <Container>
        <div className="pt-6">
          <div className="flex flex-row items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create a Booking</h1>
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="ml-4"
            >
              Back
            </Button>
          </div>
          
          {propertiesLoading ? (
            <div className="text-center py-8">Loading properties...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div 
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {property.images?.[0] && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="object-cover w-full h-48"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                    <p className="text-gray-600 mb-2">{property.location.city}, {property.location.country}</p>
                    <p className="text-gray-900 font-medium mb-4">${property.price} / night</p>
                    <Button
                      onClick={() => router.push(`/bookings/new?propertyId=${property.id}`)}
                      className="w-full"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Booking</h1>
          <Button 
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {availabilityMessage && (
              <div className={`${isAvailable ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'} px-4 py-3 border rounded mb-4`}>
                {availabilityMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    id="checkIn"
                    name="checkIn"
                    value={bookingData.checkIn}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    id="checkOut"
                    name="checkOut"
                    value={bookingData.checkOut}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    id="numberOfGuests"
                    name="numberOfGuests"
                    value={bookingData.numberOfGuests}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                {!isAvailable && (
                  <Button
                    type="button"
                    onClick={checkAvailability}
                    variant="outline"
                    disabled={checking || !bookingData.checkIn || !bookingData.checkOut}
                  >
                    {checking ? 'Checking...' : 'Check Availability'}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || (!isAvailable && !checking)}
                >
                  {loading ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default withAuth(NewBookingPage);
