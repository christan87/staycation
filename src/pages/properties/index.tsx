import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_PROPERTIES } from '@/graphql/operations/property/queries';
import PropertyList from '@/components/property/PropertyList';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import dynamic from 'next/dynamic';

// Define the BECOME_HOST_MUTATION
const BECOME_HOST_MUTATION = gql`
  mutation BecomeHost {
    becomeHost {
      success
      message
      user {
        id
        role
        name
        email
      }
    }
  }
`;

// Define TermsOverlay as a regular function component first
function TermsOverlayComponent({ 
  isOpen, 
  onAccept, 
  onDecline 
}: { 
  isOpen: boolean; 
  onAccept: () => void; 
  onDecline: () => void;
}) {
  const [hasRead, setHasRead] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center text-slate-900">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
        <div 
          className="h-64 overflow-y-auto mb-4 p-4 border rounded"
          style={{ scrollbarWidth: 'thin' }}
        >
          <p className="mb-4">By listing your property on our platform, you agree to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide accurate information about your property</li>
            <li>Maintain the property in the condition advertised</li>
            <li>Respond to booking requests in a timely manner</li>
            <li>Follow local laws and regulations regarding short-term rentals</li>
            <li>Maintain appropriate insurance coverage</li>
            <li>Keep your calendar up to date</li>
            <li>Provide a safe and clean environment for guests</li>
            <li>Handle guest communications professionally</li>
            <li>Process refunds according to our cancellation policy</li>
            <li>Pay all applicable fees and taxes</li>
          </ul>
        </div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="terms-checkbox"
            checked={hasRead}
            onChange={(e) => setHasRead(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="terms-checkbox">
            I have read and agree to the terms and conditions
          </label>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!hasRead}
            className={`px-4 py-2 rounded ${
              hasRead 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrap with dynamic import
const TermsOverlay = dynamic(() => Promise.resolve(TermsOverlayComponent), { ssr: false });

export default function PropertiesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showTerms, setShowTerms] = useState(false);
  
  const { loading, error, data } = useQuery(GET_PROPERTIES, {
    variables: {
      limit: 10,
      offset: 0,
      filter: {}
    },
    fetchPolicy: 'network-only'
  });

  const [becomeHost] = useMutation(BECOME_HOST_MUTATION);

  const handleCreateProperty = () => {
    if (!session) {
      // Not logged in, redirect to login
      router.push('/login');
      return;
    }

    // Check if user is already a host or admin
    if (session.user?.role === 'HOST' || session.user?.role === 'ADMIN') {
      // Already a host, redirect to create property page
      console.log('User is already a host, redirecting to create property page');
      router.push('/properties/new');
    } else {
      // Regular user, show terms overlay
      console.log('User is not a host, showing terms overlay');
      setShowTerms(true);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      console.log('Calling becomeHost mutation...');
      const { data } = await becomeHost();
      console.log('becomeHost mutation response:', data);
      
      if (data?.becomeHost?.success) {
        console.log('Successfully became a host, user data:', data.becomeHost.user);
        // Update the session client-side to reflect the new role
        if (session && data.becomeHost.user) {
          session.user.role = data.becomeHost.user.role;
        }
        setShowTerms(false);
        router.push('/properties/new');
      } else {
        console.warn('becomeHost returned success: false', data?.becomeHost?.message);
        // If user is already a host, we can still proceed
        if (data?.becomeHost?.message === 'User is already a host' && data?.becomeHost?.user?.role === 'HOST') {
          console.log('User is already a host, redirecting to create property page');
          setShowTerms(false);
          router.push('/properties/new');
          return;
        }
        throw new Error(data?.becomeHost?.message || 'Failed to become a host');
      }
    } catch (err) {
      console.error('Error becoming host:', err);
      // Show more detailed error message
      if (err instanceof Error) {
        alert(`Error becoming a host: ${err.message}. Please try again.`);
      } else {
        alert('Error becoming a host. Please try again.');
      }
    }
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
  };

  if (loading) return (
    <Container>
      <div className="py-8">
        <div className="text-gray-900">Loading...</div>
      </div>
    </Container>
  );

  if (error) return (
    <Container>
      <div className="py-8">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    </Container>
  );

  const properties = data?.properties?.items || [];

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

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No properties available.</p>
          </div>
        ) : (
          <PropertyList properties={properties} />
        )}
      </div>

      {/* Terms Overlay */}
      <TermsOverlay
        isOpen={showTerms}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
    </Container>
  );
}