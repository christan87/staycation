'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/components/property/PropertyForm';
import { CREATE_PROPERTY } from '@/graphql/operations/property/mutations';

export default function NewPropertyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBecomeHost = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation {
              becomeHost {
                success
                message
                user {
                  id
                  role
                }
              }
            }
          `
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to become a host');
      }

      if (result.data?.becomeHost?.success) {
        // Refresh the page to show the property form
        window.location.reload();
      }
    } catch (error) {
      console.error('Error becoming host:', error);
      setError(error instanceof Error ? error.message : 'Failed to become a host');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        const errorMessage = result.errors[0]?.message || 'Failed to create property';
        if (errorMessage === 'Not authorized to create properties') {
          throw new Error('You need to be a host to create properties. Click the "Become a Host" button above.');
        }
        throw new Error(errorMessage);
      }

      if (result.data?.createProperty) {
        router.push('/properties');
      } else {
        throw new Error('No data returned from server');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      setError(error instanceof Error ? error.message : 'Failed to create property');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Create New Property</h1>
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
          {error.includes('need to be a host') && (
            <button
              onClick={handleBecomeHost}
              disabled={isLoading}
              className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Processing...' : 'Become a Host'}
            </button>
          )}
        </div>
      )}
      <PropertyForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}