/**
 * Avatar Component
 * 
 * Displays either a user's profile image or a colored circle with their initial.
 * The background color is deterministically generated from the user's name.
 */

import React, { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLORS = [
  '#2563EB', // blue-600
  '#7C3AED', // violet-600
  '#DB2777', // pink-600
  '#DC2626', // red-600
  '#EA580C', // orange-600
  '#16A34A', // green-600
  '#4F46E5', // indigo-600
  '#9333EA', // purple-600
];

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className,
}) => {
  const initials = useMemo(() => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const backgroundColor = useMemo(() => {
    if (src || !name) return undefined;
    // Use the sum of character codes to generate a consistent color for the same name
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return COLORS[charCodeSum % COLORS.length];
  }, [src, name]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={twMerge(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={twMerge(
        'rounded-full flex items-center justify-center font-medium text-white',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor }}
      title={name || undefined}
    >
      {initials}
    </div>
  );
};
