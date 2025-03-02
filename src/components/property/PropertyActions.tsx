'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Property } from '@/types/property';
import { DELETE_PROPERTY } from '@/graphql/operations/property/mutations';
import { print } from 'graphql/language/printer';

interface PropertyActionsProps {
  property: Property;
}

export default function PropertyActions({ property }: PropertyActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Use a simpler mutation string directly
      const mutationString = `
        mutation DeleteProperty($id: ID!) {
          deleteProperty(id: $id)
        }
      `;

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutationString,
          variables: {
            id: property.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete property response:', result);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      // Check if deletion was successful
      if (result.data && result.data.deleteProperty === true) {
        console.log('Property deleted successfully');
        alert('Property deleted successfully');
        
        // Force navigation to properties page
        window.location.href = '/properties';
      } else {
        console.error('Unexpected response format:', result);
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert(`Failed to delete property: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-4">
        <Link
          href={`/properties/edit/${property.id}`}
          className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit Property
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
        >
          {isDeleting ? 'Deleting...' : 'Delete Property'}
        </button>
      </div>
    </div>
  );
}