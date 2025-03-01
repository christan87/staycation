import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PropertyDetails from '@/components/property/PropertyDetails';
import { GET_PROPERTY } from '@/graphql/operations/property/queries';
import { Container } from '@/components/Container';
import { Property } from '@/types/property';

interface PropertyPageProps {
  property: Property;
}

export default function PropertyPage({ property }: PropertyPageProps) {
  return (
    <Container>
      <div className="py-6">
        <PropertyDetails property={property} />
      </div>
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

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
        query: GET_PROPERTY,
        variables: {
          id: params?.id,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch property: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to fetch property data');
    }

    if (!result.data?.property) {
      return {
        notFound: true,
      };
    }

    // Convert date strings to Date objects
    const property = {
      ...result.data.property,
      createdAt: new Date(result.data.property.createdAt),
      updatedAt: new Date(result.data.property.updatedAt)
    };

    return {
      props: {
        property: JSON.parse(JSON.stringify(property)), // Serialize dates for Next.js
      },
    };
  } catch (error) {
    console.error('Error fetching property:', error);
    return {
      props: {
        error: 'Failed to load property',
      },
    };
  }
};