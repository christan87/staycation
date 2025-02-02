import { GraphQLScalarType } from 'graphql';
import { uploadImage } from '../../utils/imageUpload';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface FileUpload {
  createReadStream: () => NodeJS.ReadableStream;
  filename: string;
  mimetype: string;
  encoding: string;
}

export const imageUploadResolvers = {
  Upload: new GraphQLScalarType({
    name: 'Upload',
    description: 'The `Upload` scalar type represents a file upload.',
  }),
  
  Mutation: {
    uploadImage: async (_: unknown, { file }: { file: Promise<FileUpload> }) => {
      try {
        const { createReadStream } = await file;
        const stream = createReadStream();
        
        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        
        // Upload to Cloudinary
        const result = await uploadImage(buffer);
        return {
          url: result.url,
          publicId: result.publicId
        };
      } catch (error) {
        console.error('Error in uploadImage resolver:', error);
        throw new Error('Failed to upload image');
      }
    },

    deleteImage: async (_: unknown, { publicId }: { publicId: string }) => {
      try {
        await cloudinary.uploader.destroy(publicId);
        return true;
      } catch (error) {
        console.error('Error deleting image:', error);
        return false;
      }
    },
  },
};