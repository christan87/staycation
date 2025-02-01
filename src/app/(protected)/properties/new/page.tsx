'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/components/property/PropertyForm';
import { CREATE_PROPERTY } from '@/graphql/operations/property/mutations';

export default function NewPropertyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: CREATE_PROPERTY,
          variables: {
            input: data,
          },
        }),
      });

      const result = await response.json();
      if (result.data?.createProperty) {
        router.push('/properties');
      }
    } catch (error) {
      console.error('Error creating property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Create New Property</h1>
      <PropertyForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}