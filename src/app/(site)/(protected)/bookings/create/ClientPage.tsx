'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { GET_PROPERTIES } from '@/graphql/operations/property/queries';
import dynamic from 'next/dynamic';

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

function ClientPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchProperties();
    }
  }, [status, router]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_PROPERTIES,
        }),
        credentials: 'include',
      });

      const response = await res.json();
      
      if (response.errors) {
        console.error('GraphQL Error:', response.errors);
        throw new Error(response.errors[0].message);
      }
      
      setProperties(response.data?.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

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
        
        {loading ? (
          <div className="text-center">Loading properties...</div>
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
                    onClick={() => router.push(`/bookings/create/${property.id}`)}
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

// Export a dynamically imported version of the component with SSR disabled
export default dynamic(() => Promise.resolve(ClientPageContent), {
  ssr: false,
});