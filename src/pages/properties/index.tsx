import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { GET_PROPERTIES } from '@/graphql/operations/property/queries';
import PropertyList from '@/components/property/PropertyList';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';

export default function PropertiesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const protocol = window.location.protocol;
      const host = window.location.host;
      const apiUrl = `${protocol}//${host}/api/graphql`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(session?.user?.email && {
            Authorization: `Bearer ${session.user.email}`
          })
        },
        body: JSON.stringify({
          query: GET_PROPERTIES,
          variables: {
            limit: 10,
            offset: 0,
            filter: {}
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL Error');
      }

      if (result.data?.properties) {
        setProperties(result.data.properties);
      } else {
        console.warn('No properties data in response:', result);
        setProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = () => {
    if (session) {
      router.push('/properties/new');
    } else {
      router.push('/login');
    }
  };

  if (loading) return (
    <Container>
      <div className="py-8">
        <div className="text-gray-900">Loading...</div>
      </div>
    </Container>
  );

  return (
    <Container>
      <div className="py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Properties</h1>
          <Button
            variant="primary"
            onClick={handleCreateProperty}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create Property
          </Button>
        </div>
        <PropertyList properties={properties} />
      </div>
    </Container>
  );
}