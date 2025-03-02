import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PropertyDetails from '@/components/property/PropertyDetails';
import { GET_PROPERTY, GET_PROPERTY_STRING } from '@/graphql/operations/property/queries';
import { Container } from '@/components/Container';
import { Property } from '@/types/property';

interface PropertyPageProps {
  property?: Property;
  error?: string;
}

export default function PropertyPage({ property, error }: PropertyPageProps) {
  if (error) {
    return (
      <Container>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!property) {
    return (
      <Container>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-500">Loading property details...</p>
            </div>
          </div>
        </div>
      </Container>
    );
  }

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
    
    console.log(`Fetching property with ID: ${params?.id}`);
    
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

    if (!result.data?.property) {
      console.log('No property data returned from GraphQL');
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