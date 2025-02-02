'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { XCircle } from 'lucide-react';

interface ImageUploadProps {
  onImagesChange: (images: { url: string; publicId: string }[]) => void;
  initialImages?: { url: string; publicId: string }[];
  maxImages?: number;
}

interface UploadedImage {
  url: string;
  publicId: string;
}

export default function ImageUpload({ 
  onImagesChange, 
  initialImages = [], 
  maxImages = 5 
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<UploadedImage> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!uploadPreset || !cloudName) {
      throw new Error('Cloudinary configuration is missing');
    }

    formData.append('upload_preset', uploadPreset);

    try {
      console.log('Uploading to Cloudinary...', {
        cloudName,
        uploadPreset,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', {
        url: data.secure_url,
        publicId: data.public_id
      });

      return {
        url: data.secure_url,
        publicId: data.public_id,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = acceptedFiles.map(uploadImage);
      const uploadedImages = await Promise.all(uploadPromises);
      
      const newImages = [...images, ...uploadedImages];
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload one or more images');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [images, maxImages, onImagesChange]);

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5242880, // 5MB
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-gray-600">
            {isDragActive ? (
              <p>Drop the images here ...</p>
            ) : (
              <p>Drag & drop images here, or click to select files</p>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Supports: JPG, JPEG, PNG, WEBP (max {maxImages} images, 5MB each)
          </p>
          {isUploading && <p className="text-indigo-500">Uploading...</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.publicId} className="relative group">
              <div className="aspect-w-16 aspect-h-9 relative">
                <Image
                  src={image.url}
                  alt={`Property image ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <XCircle className="w-5 h-5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}