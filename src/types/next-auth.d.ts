import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      accessToken?: string;
      provider?: string;
      role?: 'USER' | 'HOST' | 'ADMIN';
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    provider?: string;
    role?: 'USER' | 'HOST' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    accessToken?: string;
    provider?: string;
    role?: 'USER' | 'HOST' | 'ADMIN';
  }
}
