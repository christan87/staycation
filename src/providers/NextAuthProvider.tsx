'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import React from 'react';

interface Props {
  children: React.ReactNode;
  session?: Session | null;
}

export function NextAuthProvider({ children, session }: Props) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

export default NextAuthProvider;
