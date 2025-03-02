import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAuth } from '@/components/withAuth';
import dynamic from 'next/dynamic';

// Use dynamic import to match the original client-side only behavior
const NewClientPage = dynamic(
  () => import('@/components/property/NewClientPage'),
  { ssr: false }
);

function NewPropertyPage() {
  return <NewClientPage />;
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

  // Check if user is a host
  if (session.user?.role !== 'HOST') {
    return {
      redirect: {
        destination: '/properties/my',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default withAuth(NewPropertyPage, { requireHost: true });