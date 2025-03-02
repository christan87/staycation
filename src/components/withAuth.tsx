// src/components/withAuth.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options = { requireHost: false }
) {
  return function WithAuthComponent(props: P) {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
      if (status === 'loading') return;

      if (!session) {
        router.replace('/login');
        return;
      }

      if (options.requireHost && session.user?.role !== 'HOST') {
        router.replace('/properties/my');
      }
    }, [session, status, router]);

    if (status === 'loading') {
      return <div>Loading...</div>;
    }

    if (!session) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}