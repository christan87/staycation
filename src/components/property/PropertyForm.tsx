'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyType } from '../../types/property';
import ImageUpload from './ImageUpload';
import { CREATE_PROPERTY, UPDATE_PROPERTY } from '@/graphql/operations/property/mutations';
import { print } from 'graphql/language/printer';

export interface PropertyFormProps {
  initialData?: any;
  isLoading?: boolean;
  onSubmit?: (formData: any) => Promise<void>;
}

const AMENITIES_OPTIONS = [
  'WiFi',
  'Kitchen',
  'Free parking',
  'Air conditioning',
  'Heating',
  'Washer',
  'Dryer',
  'TV',
  'Pool',
  'Hot tub',
  'BBQ grill',
  'Gym',
  'Beach access',
  'Mountain view',
  'Workspace'
];

const PropertyForm = ({ initialData, isLoading = false, onSubmit }: PropertyFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPetOptions, setShowPetOptions] = useState(false);
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
    coordinates: initialData?.location?.coordinates || null,
    amenities: initialData?.amenities || [],
    images: initialData?.images || [],
    petFriendly: initialData?.petFriendly || false,
    allowsCats: initialData?.allowsCats || false,
    allowsDogs: initialData?.allowsDogs || false
  });

  const handleImagesChange = (newImages: { url: string; publicId: string }[]) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a: string) => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handlePetFriendlyToggle = () => {
    setFormData(prev => ({
      ...prev,
      petFriendly: !prev.petFriendly
    }));
    setShowPetOptions(!showPetOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
        return;
      }

      // Default form submission logic
      const mutation = initialData ? UPDATE_PROPERTY : CREATE_PROPERTY;
      // Convert the gql object to a string using the print function
      const mutationString = print(mutation.definitions[0]);
      
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutationString,
          variables: {
            input: {
              ...(initialData && { id: initialData.id }),
              title: formData.title,
              description: formData.description,
              price: parseFloat(formData.price),
              maxGuests: parseInt(formData.maxGuests),
              type: formData.type,
              location: {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                zipCode: formData.zipCode,
                coordinates: null
              },
              amenities: formData.amenities,
              images: formData.images,
              petFriendly: formData.petFriendly,
              allowsCats: formData.allowsCats,
              allowsDogs: formData.allowsDogs
            },
          },
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        const errorMessage = result.errors[0]?.message || 'An error occurred while saving the property';
        throw new Error(errorMessage);
      }

      router.push('/properties');
      router.refresh();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-900">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Property Images</label>
        <ImageUpload
          onImagesChange={handleImagesChange}
          initialImages={formData.images}
          maxImages={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Price per night</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">Max Guests</label>
          <input
            type="number"
            value={formData.maxGuests}
            onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-900">Location Details</label>
        
        <div>
          <label className="block text-sm font-medium text-gray-900">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">Zip Code</label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-900">Amenities</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {AMENITIES_OPTIONS.map((amenity) => (
            <div key={amenity} className="flex items-center">
              <input
                type="checkbox"
                id={`amenity-${amenity}`}
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`amenity-${amenity}`} className="ml-2 block text-sm text-gray-900">
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-900">Pet Friendly</label>
          <button
            type="button"
            onClick={handlePetFriendlyToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              formData.petFriendly ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formData.petFriendly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {showPetOptions && (
          <div className="ml-4 space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allows-cats"
                checked={formData.allowsCats}
                onChange={() => setFormData(prev => ({ ...prev, allowsCats: !prev.allowsCats }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="allows-cats" className="ml-2 block text-sm text-gray-900">
                Cats allowed
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allows-dogs"
                checked={formData.allowsDogs}
                onChange={() => setFormData(prev => ({ ...prev, allowsDogs: !prev.allowsDogs }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="allows-dogs" className="ml-2 block text-sm text-gray-900">
                Dogs allowed
              </label>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || submitting}
        className={`inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          (isLoading || submitting) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading || submitting ? 'Saving...' : 'Save Property'}
      </button>
    </form>
  );
}

export default PropertyForm;