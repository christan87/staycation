// src/graphql/types/context.ts
import { Session } from 'next-auth';

export interface Context {
  session: Session | null;
}