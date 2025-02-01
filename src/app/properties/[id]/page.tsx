'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyDetails from '@/components/property/PropertyDetails';
import { GET_PROPERTY } from '@/graphql/operations/property/queries';
import { Property } from '@/types/property';

export default function PropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperty();
  }, [params.id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-900">Loading...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return <PropertyDetails property={property} />;
}