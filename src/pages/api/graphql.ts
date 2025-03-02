import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs } from '@/graphql/schemas/schema';
import { resolvers } from '@/graphql/resolvers';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import type { Context } from '@/graphql/types/context';
import type { YogaInitialContext } from 'graphql-yoga';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ServerContext = Context & {
  req: NextApiRequest;
  res: NextApiResponse;
} & YogaInitialContext;

const yogaSchema = createSchema<ServerContext>({
  typeDefs,
  resolvers: resolvers as any, // temporary type assertion until we fix resolver types
});

const yoga = createYoga<ServerContext>({
  schema: yogaSchema,
  graphqlEndpoint: '/api/graphql',
  context: async ({ req, res }): Promise<ServerContext> => {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);
    return { session, req, res } as ServerContext;
  },
  fetchAPI: { Response },
  cors: false,
});

export default yoga;