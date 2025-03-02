// src/graphql/types/context.ts
import { Session } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { YogaInitialContext } from 'graphql-yoga';

export interface Context extends YogaInitialContext {
  session: Session | null;
  req: NextApiRequest;
  res: NextApiResponse;
}