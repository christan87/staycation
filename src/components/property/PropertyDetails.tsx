'use client';

import { useState } from 'react';
import { Property } from '@/types/property';
import PropertyActions from './PropertyActions';
import { useSession } from 'next-auth/react';
import PropertyImage from './PropertyImage';
import ImageCarousel from '../ImageCarousel';

interface PropertyDetailsProps {
  property: Property;
}

export default function PropertyDetails({ property }: PropertyDetailsProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === property?.host?.id || session?.user?.email === property?.host?.email;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // If property is undefined or null, show a loading state
  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-xl text-gray-500">Loading property details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
        <div className="flex items-center text-gray-500">
          <span>{property.location?.city}, {property.location?.country}</span>
          {property.rating && (
            <div className="flex items-center ml-4">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-gray-700">{property.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Images Section */}
        <div className="md:col-span-2">
          {/* Main Image */}
          <div className="relative h-64 md:h-[480px] rounded-lg overflow-hidden mb-4 bg-gray-100">
            {property.images && property.images.length > 0 && (
              <PropertyImage
                src={property.images[currentImageIndex]?.url || ''}
                alt={`${property.title} - Main Image`}
                fill
                objectFit="contain"
                className="object-contain"
              />
            )}
          </div>

          {/* Image Carousel */}
          <div className="w-full flex justify-start mb-8">
            {property.images && property.images.length > 0 && (
              <ImageCarousel
                images={property.images}
                currentImageIndex={currentImageIndex}
                onImageSelect={setCurrentImageIndex}
              />
            )}
          </div>
        </div>

        {/* Right Column - Actions and Information */}
        <div className="space-y-8">
          {/* CRUD Actions */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-2xl font-bold text-gray-900 mb-4">
              ${property.price}<span className="text-lg font-normal text-gray-500">/night</span>
            </div>
            {property?.host && isOwner && <PropertyActions property={property} />}
          </div>

          {/* Property Information */}
          <div className="bg-white p-6 rounded-lg shadow-lg space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-black">About this place</h2>
              <p className="text-gray-600">{property.description}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 text-black">What this property offers</h2>
              <div className="grid grid-cols-1 gap-2">
                {property.amenities && property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2">
                    <span className="text-black">✓</span>
                    <span className="text-black">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 text-black">Pet Friendly?{property.petFriendly === false && ' - No'}</h2>
              {property.petFriendly && (
                <div className="space-y-2">
                  {property.allowsCats === false && property.allowsDogs === false ? (
                    <p className="text-gray-600">Contact owner for details...</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {property.allowsCats ? (
                          <p className="text-gray-600">😺 Cats ok purrr</p>
                        ) : (
                          <p className="text-gray-600">😿 No cats allowed</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {property.allowsDogs ? (
                          <p className="text-gray-600">🐶 Dogs ok woof!</p>
                        ) : (
                          <p className="text-gray-600">🐕 No dogs allowed</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}