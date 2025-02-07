'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Property } from '@/types/property';
import { DELETE_PROPERTY } from '@/graphql/operations/property/mutations';

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
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DELETE_PROPERTY,
          variables: {
            id: property.id,
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      router.push('/properties');
      router.refresh();
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-4">
        <Link
          href={`/properties/${property.id}/edit`}
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