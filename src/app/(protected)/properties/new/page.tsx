'use client';

import PropertyForm from '@/components/property/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Property</h1>
      <PropertyForm />
    </div>
  );
}