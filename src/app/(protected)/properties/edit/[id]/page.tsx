'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Property } from '@/types/property';
import { GET_PROPERTY } from '../../../../../graphql/operations/property/queries';
import PropertyForm from '@/components/property/PropertyForm';

export default function EditPropertyClient({ id }: { id: string }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GET_PROPERTY,
            variables: {
              id,
            },
          }),
        });

        const { data } = await response.json();
        if (data?.property) {
          setProperty(data.property);
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Property not found</h1>
          <p className="mt-2 text-gray-600">The property you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Property</h1>
      <PropertyForm initialData={property} />
    </div>
  );
}