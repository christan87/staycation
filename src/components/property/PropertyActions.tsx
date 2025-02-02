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

      const { data } = await response.json();
      if (data.deleteProperty) {
        router.push('/properties/my');
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/properties/edit/${property.id}`}
        className="w-full px-4 py-2 text-sm font-medium text-white text-center bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Edit Property
      </Link>
      
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Delete Property'}
      </button>
    </div>
  );
}