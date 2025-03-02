import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAuth } from '@/components/withAuth';
import dynamic from 'next/dynamic';

// Use dynamic import to match the original client-side only behavior
const MyPropertiesClient = dynamic(
  () => import('@/components/property/ClientPage'),
  { ssr: false }
);

function MyPropertiesPage() {
  return <MyPropertiesClient />;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Ensure all session data is serializable
  const serializedSession = {
    user: {
      id: session.user?.id || '',
      name: session.user?.name || '',
      email: session.user?.email || '',
      role: session.user?.role || 'USER',
      image: session.user?.image || null
    },
    expires: session.expires
  };

  return {
    props: {
      session: serializedSession,
    },
  };
};

export default withAuth(MyPropertiesPage);