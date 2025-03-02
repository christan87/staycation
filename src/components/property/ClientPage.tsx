'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/router';
import PropertyCard from '@/components/property/PropertyCard';
import { useSession } from 'next-auth/react';
import { Property } from '@/types/property';
import dynamic from 'next/dynamic';
import { GET_MY_PROPERTIES } from '@/graphql/operations/property/queries';

const MY_PROPERTIES_QUERY = gql`${GET_MY_PROPERTIES}`;

const BECOME_HOST_MUTATION = gql`
  mutation BecomeHost {
    becomeHost {
      success
      message
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

export default function ClientPage() {
  const [showTerms, setShowTerms] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const router = useRouter();
  const { data: session, status } = useSession();

  const { loading, error, data } = useQuery(MY_PROPERTIES_QUERY, {
    skip: status !== 'authenticated',
    fetchPolicy: 'network-only'
  });

  const [becomeHost] = useMutation(BECOME_HOST_MUTATION);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleCreateProperty = () => {
    if (isAuthorized) {
      router.push('/properties/new');
    } else {
      setShowTerms(true);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      const { data } = await becomeHost();
      
      if (data?.becomeHost?.success) {
        setIsAuthorized(true);
        setShowTerms(false);
        router.push('/properties/new');
      } else {
        throw new Error(data?.becomeHost?.message || 'Failed to become a host');
      }
    } catch (err) {
      console.error('Error becoming host:', err);
      // Handle error appropriately
    }
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
    router.push('/dashboard');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const properties = data?.myProperties || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Properties</h1>
        <button
          onClick={handleCreateProperty}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Create New Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">You haven't listed any properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property: Property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      <TermsOverlay
        isOpen={showTerms}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
    </div>
  );
}