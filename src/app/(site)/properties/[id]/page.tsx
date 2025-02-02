'use server';

import { use } from 'react';
import PropertyDetails from '@/components/property/PropertyDetails';
import { GET_PROPERTY } from '@/graphql/operations/property/queries';
import { headers } from 'next/headers';

async function getProperty(id: string) {
  try {
    // Get the host from headers
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    const response = await fetch(`${protocol}://${host}/api/graphql`, {
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
      next: { revalidate: 60 }, // Revalidate every minute
    });

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch property: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      throw new Error(result.errors[0]?.message || 'Failed to fetch property data');
    }

    if (!result.data?.property) {
      console.error('No property data:', result);
      throw new Error('Property not found');
    }

    return result.data.property;
  } catch (error) {
    console.error('Error fetching property:', error);
    throw error;
  }
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  try {
    const property = await getProperty(params.id);

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

    return <PropertyDetails property={property} />;
  } catch (error) {
    console.error('Error in PropertyPage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error loading property</h1>
          <p className="mt-2 text-gray-600">There was an error loading the property. Please try again later.</p>
        </div>
      </div>
    );
  }
}