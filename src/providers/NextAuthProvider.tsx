'use client';

import { SessionProvider } from 'next-auth/react';
import React, { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
}

export function NextAuthProvider({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent rendering on server
  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}

export default NextAuthProvider;
