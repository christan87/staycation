'use client';

import { useEffect, useState } from 'react';
import { GET_MY_PROPERTIES } from '@/graphql/operations/property/queries';
import { useRouter } from 'next/navigation';
import PropertyCard from '@/components/property/PropertyCard';
import { useSession } from 'next-auth/react';
import { Property, PropertyType } from '@/types/property';

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const fetchProperties = async () => {
        try {
          console.log('Fetching properties...');
          const response = await fetch('/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: GET_MY_PROPERTIES,
            })
          });

          // Log the response details for debugging
          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));
          
          const text = await response.text();
          console.log('Raw response:', text);

          // Only try to parse if we got a non-empty response
          if (!text.trim()) {
            throw new Error('Empty response from server');
          }

          // Check if we got an HTML response (error page)
          if (text.trim().startsWith('<!DOCTYPE')) {
            throw new Error('Received HTML instead of JSON. Server error occurred.');
          }

          const result = JSON.parse(text);

          if (result.errors) {
            console.error('GraphQL Errors:', result.errors);
            const errorMessage = result.errors[0]?.message || 'Failed to fetch properties';
            throw new Error(errorMessage);
          }

          if (!result.data?.myProperties) {
            console.error('No properties data in response:', result);
            throw new Error('No properties data received');
          }

          setProperties(result.data.myProperties);
        } catch (err) {
          console.error('Error fetching properties:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchProperties();
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
        <button
          onClick={() => router.push('/properties/new')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Property
        </button>
      </div>
      
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't listed any properties yet.</p>
          <button
            onClick={() => router.push('/properties/new')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              showManageButtons 
              onDelete={() => {
                setProperties(prev => prev.filter(p => p.id !== property.id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}