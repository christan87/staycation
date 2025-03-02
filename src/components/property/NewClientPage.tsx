'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PropertyForm, { PropertyFormProps } from '@/components/property/PropertyForm';
import { CREATE_PROPERTY } from '@/graphql/operations/property/mutations';
import { print } from 'graphql/language/printer';

export default function ClientPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, mounted]);

  if (!mounted || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const handleCreateProperty: PropertyFormProps['onSubmit'] = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: print(CREATE_PROPERTY.definitions[0]),
          variables: {
            input: {
              title: formData.title,
              description: formData.description,
              price: parseFloat(formData.price),
              maxGuests: parseInt(formData.maxGuests),
              type: formData.type,
              location: {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                zipCode: formData.zipCode,
                coordinates: formData.coordinates || null
              },
              amenities: formData.amenities,
              images: formData.images,
              petFriendly: formData.petFriendly,
              allowsCats: formData.allowsCats,
              allowsDogs: formData.allowsDogs
            }
          }
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      if (data.data?.createProperty) {
        router.push('/properties/my');
      } else {
        throw new Error('Failed to create property');
      }
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Property</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <PropertyForm 
        onSubmit={handleCreateProperty}
        isLoading={loading}
        initialData={null}
      />
    </div>
  );
}