'use client';

import Image from 'next/image';
import { Property } from '@/types/property';
import PropertyActions from './PropertyActions';
import { useSession } from 'next-auth/react';

interface PropertyDetailsProps {
  property: Property;
}

export default function PropertyDetails({ property }: PropertyDetailsProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === property.host.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
        <div className="flex items-center text-gray-500">
          <span>{property.location.city}, {property.location.country}</span>
          {property.rating && (
            <div className="flex items-center ml-4">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1">{property.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {property.images.map((image, index) => (
          <div key={image.publicId} className="relative h-64 md:h-96 rounded-lg overflow-hidden">
            <Image
              src={image.url}
              alt={`${property.title} - Image ${index + 1}`}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>

      {/* Property Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold mb-4">About this place</h2>
            <p className="text-gray-600">{property.description}</p>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
            <div className="grid grid-cols-2 gap-4">
              {property.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg h-fit">
          <div className="text-2xl font-bold text-gray-900 mb-4">
            ${property.price}<span className="text-lg font-normal text-gray-500">/night</span>
          </div>
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-gray-600">{property.maxGuests} guests maximum</span>
          </div>
          
          {isOwner && <PropertyActions property={property} />}
        </div>
      </div>
    </div>
  );
}