'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GET_PROPERTIES } from '@/graphql/operations/property/queries';
import PropertyList from '@/components/property/PropertyList';
import { Button } from '@/components/Button';

export default function PropertiesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_PROPERTIES,
          variables: {
            limit: 10,
            offset: 0,
          },
        }),
      });

      const { data } = await response.json();
      setProperties(data.properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = () => {
    if (session) {
      router.push('/properties/new');
    } else {
      router.push('/login');
    }
  };

  if (loading) return <div className="text-gray-900">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Properties</h1>
        <Button
          variant="primary"
          onClick={handleCreateProperty}
          className="flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {session ? 'Create Property' : 'Sign in to Create'}
        </Button>
      </div>
      <PropertyList properties={properties} />
    </div>
  );
}