'use server';

import PropertyDetails from '@/components/property/PropertyDetails';
import { GET_PROPERTY } from '@/graphql/operations/property/queries';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  try {
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
          id: resolvedParams.id,
        },
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch property: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to fetch property data');
    }

    if (!result.data?.property) {
      return notFound();
    }

    return <PropertyDetails property={result.data.property} />;
  } catch (error) {
    console.error('Error fetching property:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error loading property</h1>
          <p className="mt-2 text-gray-600">There was an error loading the property details. Please try again later.</p>
        </div>
      </div>
    );
  }
}