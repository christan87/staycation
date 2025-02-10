'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export function NextAuthProvider({ children }: Props) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}

export default NextAuthProvider;
