'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageCarouselProps {
  images: Array<{
    url: string;
    publicId: string;
  }>;
  onImageSelect: (index: number) => void;
  currentImageIndex: number;
  className?: string;
}

export default function ImageCarousel({ 
  images, 
  onImageSelect, 
  currentImageIndex,
  className = '' 
}: ImageCarouselProps) {
  const [startIndex, setStartIndex] = useState(0);
  const imagesPerPage = 4;

  const nextPage = () => {
    setStartIndex((prev) => Math.min(prev + imagesPerPage, images.length - imagesPerPage));
  };

  const previousPage = () => {
    setStartIndex((prev) => Math.max(0, prev - imagesPerPage));
  };

  const visibleImages = images.slice(startIndex, startIndex + imagesPerPage);
  const isAtStart = startIndex === 0;
  const isAtEnd = startIndex + imagesPerPage >= images.length;
  const allImagesVisible = images.length <= imagesPerPage;

  if (images.length <= 1) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {/* Previous Button */}
        <button
          onClick={previousPage}
          disabled={isAtStart || allImagesVisible}
          className={`flex-none w-8 h-16 flex items-center justify-center ${
            isAtStart || allImagesVisible
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-black bg-opacity-30 hover:bg-opacity-50'
          }`}
          aria-label="View previous images"
        >
          <svg 
            className={`w-6 h-6 ${isAtStart || allImagesVisible ? 'text-gray-400' : 'text-white'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Thumbnails */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {visibleImages.map((image, index) => {
            const actualIndex = startIndex + index;
            return (
              <button
                key={image.publicId}
                onClick={() => onImageSelect(actualIndex)}
                className={`relative aspect-[4/3] w-full rounded-md overflow-hidden transition-all ${
                  actualIndex === currentImageIndex
                    ? 'ring-2 ring-indigo-500 ring-offset-1'
                    : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${actualIndex + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={nextPage}
          disabled={isAtEnd || allImagesVisible}
          className={`flex-none w-8 h-16 flex items-center justify-center ${
            isAtEnd || allImagesVisible
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-black bg-opacity-30 hover:bg-opacity-50'
          }`}
          aria-label="View next images"
        >
          <svg 
            className={`w-6 h-6 ${isAtEnd || allImagesVisible ? 'text-gray-400' : 'text-white'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}