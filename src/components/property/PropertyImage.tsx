'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PropertyImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export default function PropertyImage({ src, alt, fill, width, height, className }: PropertyImageProps) {
  const [error, setError] = useState(false);

  // Use a local placeholder image
  const fallbackImage = '/images/property-placeholder.jpg';
  
  const imageProps = fill 
    ? { fill: true, style: { objectFit: 'cover' as const } }
    : { width, height };

  return (
    <Image
      {...imageProps}
      src={error ? fallbackImage : src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}