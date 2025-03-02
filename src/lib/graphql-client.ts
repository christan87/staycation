import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getSession } from 'next-auth/react';

const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin',
});

const authLink = setContext(async (_, { headers }) => {
  const session = await getSession();
  return {
    headers: {
      ...headers,
      authorization: session ? `Bearer ${session.user?.accessToken}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          properties: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          myProperties: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Property: {
        fields: {
          location: {
            // Custom merge function for the location field
            merge(existing, incoming) {
              // If incoming has missing fields, use existing values
              return { ...existing, ...incoming };
            },
          },
        },
      },
      Location: {
        // Since Location doesn't have a natural ID, we'll use a combination of fields
        // as a composite key for identity
        keyFields: false,
        merge(existing, incoming) {
          return { ...existing, ...incoming };
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});