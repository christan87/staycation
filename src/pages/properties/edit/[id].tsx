import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAuth } from '@/components/withAuth';
import dynamic from 'next/dynamic';

// Use dynamic import to match the original client-side only behavior
const EditPropertyClient = dynamic(
  () => import('@/components/property/EditPropertyClient'),
  { ssr: false }
);

interface EditPropertyPageProps {
  id: string;
}

function EditPropertyPage({ id }: EditPropertyPageProps) {
  return <EditPropertyClient id={id} />;
}

export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
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

  // Verify property exists and user owns it
  try {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.host || 'localhost:3000';
    const apiUrl = `${protocol}://${host}/api/graphql`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.cookie || '',
      },
      body: JSON.stringify({
        query: `
          query GetProperty($id: ID!) {
            property(id: $id) {
              id
              host {
                id
              }
            }
          }
        `,
        variables: {
          id: params?.id,
        },
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to fetch property');
    }

    const property = result.data?.property;
    if (!property) {
      return {
        notFound: true,
      };
    }

    // Check if user owns the property
    if (property.host.id !== session.user.id) {
      return {
        redirect: {
          destination: '/properties/my',
          permanent: false,
        },
      };
    }

    return {
      props: {
        id: params?.id,
      },
    };
  } catch (error) {
    console.error('Error fetching property:', error);
    return {
      redirect: {
        destination: '/properties/my',
        permanent: false,
      },
    };
  }
};

export default withAuth(EditPropertyPage, { requireHost: true });