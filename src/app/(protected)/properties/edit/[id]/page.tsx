'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/components/property/PropertyForm';
import { GET_PROPERTY } from '../../../../../graphql/operations/property/queries';
import { UPDATE_PROPERTY } from '@/graphql/operations/property/mutations';

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, []);

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
            id: params.id,
          },
        }),
      });

      const { data } = await response.json();
      setProperty(data.property);
    } catch (error) {
      console.error('Error fetching property:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: UPDATE_PROPERTY,
          variables: {
            input: {
              id: params.id,
              ...data,
            },
          },
        }),
      });

      const result = await response.json();
      if (result.data?.updateProperty) {
        router.push('/properties');
      }
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!property) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Property</h1>
      <PropertyForm
        initialData={property}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}