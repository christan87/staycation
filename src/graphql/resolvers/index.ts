// src/graphql/resolvers/index.ts
import { mergeResolvers } from '@graphql-tools/merge';
import { propertyResolvers } from './property';
import { userResolvers } from './user';
import { reviewResolvers } from './review';
import { bookingResolvers } from './booking';
import { imageUploadResolvers } from './imageUpload';
import type { Context } from '../types/context';
import type { IResolvers } from '@graphql-tools/utils';

const resolversArray = [
  propertyResolvers,
  userResolvers,
  reviewResolvers,
  bookingResolvers,
  imageUploadResolvers
] as const;

export const resolvers: IResolvers<any, Context> = mergeResolvers(resolversArray);