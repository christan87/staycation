import { createTestUser, executeOperation, createTestContext } from './utils/testUtils';
import { createTestServer } from './setup';
import { User } from '../server/models/user.model';
import { ApolloServer } from '@apollo/server';
import { Context } from '../types/context';
import { RegisterMutation, LoginMutation, MeQuery } from '../types/graphql';

describe('Authentication', () => {
  let server: ApolloServer<Context>;

  beforeAll(() => {
    server = createTestServer();
  });

  describe('Register Mutation', () => {
    const REGISTER_MUTATION = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            id
            name
            email
            role
          }
        }
      }
    `;

    it('should register a new user successfully', async () => {
      const variables = {
        input: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123!',
        },
      };

      const response = await executeOperation<RegisterMutation>(server, {
        query: REGISTER_MUTATION,
        variables,
      });

      expect(response.errors).toBeUndefined();
      const data = response.data?.register;
      expect(data.token).toBeDefined();
      expect(data.user).toMatchObject({
        name: variables.input.name,
        email: variables.input.email,
        role: 'USER',
      });

      // Verify user was created in database
      const dbUser = await User.findOne({ email: variables.input.email });
      expect(dbUser).toBeDefined();
      expect(dbUser?.name).toBe(variables.input.name);
    });

    it('should not register a user with existing email', async () => {
      // Create a user first
      await createTestUser();

      const variables = {
        input: {
          name: 'Another User',
          email: 'test@example.com', // Same email as createTestUser
          password: 'Password123!',
        },
      };

      const response = await executeOperation<RegisterMutation>(server, {
        query: REGISTER_MUTATION,
        variables,
      });

      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toBe(
        'User already exists with this email'
      );
    });
  });

  describe('Login Mutation', () => {
    const LOGIN_MUTATION = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          user {
            id
            name
            email
            role
          }
        }
      }
    `;

    it('should login successfully with correct credentials', async () => {
      const { user } = await createTestUser();

      const variables = {
        input: {
          email: user.email,
          password: 'Test123!@#',
        },
      };

      const response = await executeOperation<LoginMutation>(server, {
        query: LOGIN_MUTATION,
        variables,
      });

      expect(response.errors).toBeUndefined();
      const data = response.data?.login;
      expect(data.token).toBeDefined();
      expect(data.user).toMatchObject({
        email: user.email,
        name: user.name,
        role: user.role,
      });
    });

    it('should not login with incorrect password', async () => {
      const { user } = await createTestUser();

      const variables = {
        input: {
          email: user.email,
          password: 'WrongPassword123!',
        },
      };

      const response = await executeOperation<LoginMutation>(server, {
        query: LOGIN_MUTATION,
        variables,
      });

      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toBe(
        'Invalid credentials'
      );
    });
  });

  describe('Me Query', () => {
    const ME_QUERY = `
      query Me {
        me {
          id
          name
          email
          role
        }
      }
    `;

    it('should return user data when authenticated', async () => {
      const { user, token } = await createTestUser();
      const context = createTestContext(token);

      const response = await executeOperation<MeQuery>(server, {
        query: ME_QUERY,
        context,
      });

      expect(response.errors).toBeUndefined();
      const data = response.data?.me;
      expect(data).toMatchObject({
        email: user.email,
        name: user.name,
        role: user.role,
      });
    });

    it('should return error when not authenticated', async () => {
      const response = await executeOperation<MeQuery>(server, {
        query: ME_QUERY,
        context: createTestContext(),
      });

      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toBe(
        'Not authenticated'
      );
    });
  });
});
