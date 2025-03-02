import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAuth } from '@/components/withAuth';
import dynamic from 'next/dynamic';
import { GET_PROPERTY_STRING } from '@/graphql/operations/property/queries';

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

  console.log('Session in edit property page:', JSON.stringify(session, null, 2));

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Check if user is a host
  console.log(`User role from session: ${session.user?.role}`);
  
  if (session.user?.role !== 'HOST') {
    console.log(`User role is ${session.user?.role}, not HOST. Redirecting to properties/my`);
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
    
    console.log(`Checking property ownership for ID: ${params?.id} by user: ${session.user.id}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.cookie || '',
      },
      body: JSON.stringify({
        query: GET_PROPERTY_STRING,
        variables: {
          id: params?.id,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GraphQL request failed with status ${response.status}:`, errorText);
      throw new Error(`Failed to fetch property: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', JSON.stringify(result.errors));
      throw new Error(result.errors[0]?.message || 'Failed to fetch property data');
    }

    const property = result.data?.property;
    if (!property) {
      console.log(`Property with ID ${params?.id} not found`);
      return {
        notFound: true,
      };
    }

    console.log(`Property host ID: ${property.host.id}, User ID: ${session.user.id}`);
    
    // Check if user owns the property
    // First check by ID, then by email as a fallback
    if (property.host.id !== session.user.id && property.host.email !== session.user.email) {
      console.log(`User ${session.user.id} (${session.user.email}) does not own property ${params?.id} (host: ${property.host.id}, ${property.host.email})`);
      return {
        redirect: {
          destination: '/properties/my',
          permanent: false,
        },
      };
    }

    console.log(`User ${session.user.id} authorized to edit property ${params?.id}`);
    
    return {
      props: {
        id: params?.id,
      },
    };
  } catch (error) {
    console.error('Error checking property ownership:', error);
    return {
      redirect: {
        destination: '/properties/my',
        permanent: false,
      },
    };
  }
};

export default withAuth(EditPropertyPage, { requireHost: true });