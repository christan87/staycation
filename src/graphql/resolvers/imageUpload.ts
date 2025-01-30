import { GraphQLScalarType } from 'graphql';
import { uploadImage } from '../../utils/imageUpload';

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
      return result;
    },
  },
};