import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useQuery } from '@apollo/client';
import { GET_PROPERTIES } from '@/graphql/operations/property/queries';
import PropertyList from '@/components/property/PropertyList';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';

export default function PropertiesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const { loading, error, data } = useQuery(GET_PROPERTIES, {
    variables: {
      limit: 10,
      offset: 0,
      filter: {}
    },
    fetchPolicy: 'network-only'
  });

  const handleCreateProperty = () => {
    if (session) {
      router.push('/properties/new');
    } else {
      router.push('/login');
    }
  };

  if (loading) return (
    <Container>
      <div className="py-8">
        <div className="text-gray-900">Loading...</div>
      </div>
    </Container>
  );

  if (error) return (
    <Container>
      <div className="py-8">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    </Container>
  );

  const properties = data?.properties?.items || [];

  return (
    <Container>
      <div className="py-8">
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
            Create Property
          </Button>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No properties available.</p>
          </div>
        ) : (
          <PropertyList properties={properties} />
        )}
      </div>
    </Container>
  );
}