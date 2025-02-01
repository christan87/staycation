'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyType } from '../../types/property';

interface PropertyFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export default function PropertyForm({ initialData, onSubmit, isLoading }: PropertyFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    maxGuests: initialData?.maxGuests || '',
    type: initialData?.type || PropertyType.HOUSE,
    address: initialData?.location?.address || '',
    city: initialData?.location?.city || '',
    state: initialData?.location?.state || '',
    country: initialData?.location?.country || '',
    zipCode: initialData?.location?.zipCode || '',
    amenities: initialData?.amenities || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const propertyData = {
      ...formData,
      price: parseFloat(formData.price),
      maxGuests: parseInt(formData.maxGuests),
      location: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode,
      },
    };

    await onSubmit(propertyData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-900">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Price per night</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">Max Guests</label>
          <input
            type="number"
            value={formData.maxGuests}
            onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isLoading ? 'Saving...' : 'Save Property'}
      </button>
    </form>
  );
}