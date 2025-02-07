'use server';

import { use } from 'react';
import PropertyDetails from '@/components/property/PropertyDetails';
import { GET_PROPERTY } from '@/graphql/operations/property/queries';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

async function getProperty(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      redirect('/login');
    }

    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    const response = await fetch(`${protocol}://${host}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: headersList.get('cookie') || '',
      },
      body: JSON.stringify({
        query: GET_PROPERTY,
        variables: {
          id,
        },
      }),
      next: { revalidate: 60 },
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

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PropertyPage({ params }: PageProps) {
  // Validate and extract the ID parameter
  const id = await Promise.resolve(params?.id);
  if (!id) {
    return notFound();
  }

  try {
    const property = await getProperty(id);

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
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">Something went wrong while loading the property.</p>
        </div>
      </div>
    );
  }
}