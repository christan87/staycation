'use client';

import { Property } from '@/types/property';
import PropertyCard from './PropertyCard';

interface PropertyListProps {
  properties: Property[];
}

export default function PropertyList({ properties }: PropertyListProps) {
  if (!properties.length) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium text-gray-900">No properties found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}