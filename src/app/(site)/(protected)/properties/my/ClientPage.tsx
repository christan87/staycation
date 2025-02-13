'use client';

import { useEffect, useState } from 'react';
import { GET_MY_PROPERTIES } from '@/graphql/operations/property/queries';
import { useRouter } from 'next/navigation';
import PropertyCard from '@/components/property/PropertyCard';
import { useSession } from 'next-auth/react';
import { Property } from '@/types/property';
import dynamic from 'next/dynamic';

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
  // Define state inside the component function
  function useTermsState() {
    const [hasRead, setHasRead] = useState(false);
    return { hasRead, setHasRead };
  }

  // Use the state inside the component
  const { hasRead, setHasRead } = useTermsState();

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
  // Define all state inside the component function using a custom hook
  function useClientPageState() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTerms, setShowTerms] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    return {
      properties, setProperties,
      loading, setLoading,
      error, setError,
      showTerms, setShowTerms,
      isAuthorized, setIsAuthorized
    };
  }

  // Use the state inside the component
  const {
    properties, setProperties,
    loading, setLoading,
    error, setError,
    showTerms, setShowTerms,
    isAuthorized, setIsAuthorized
  } = useClientPageState();

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.email) {
      const fetchProperties = async () => {
        try {
          const response = await fetch('/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: GET_MY_PROPERTIES,
            }),
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch properties');
          }

          const data = await response.json();
          if (data.errors) {
            throw new Error(data.errors[0].message);
          }

          setProperties(data.data?.myProperties || []);
        } catch (err) {
          console.error('Error fetching properties:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchProperties();
    }
  }, [status, session, router]);

  const handleCreateProperty = () => {
    if (isAuthorized) {
      router.push('/properties/new');
    } else {
      setShowTerms(true);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation BecomeHost {
              becomeHost {
                success
                message
              }
            }
          `
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      if (data.data?.becomeHost?.success) {
        setIsAuthorized(true);
        setShowTerms(false);
        router.push('/properties/new');
      } else {
        throw new Error(data.data?.becomeHost?.message || 'Failed to become a host');
      }
    } catch (err) {
      console.error('Error becoming host:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
          <button
            onClick={handleCreateProperty}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Property
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-center py-4 mb-4">
            {error}
          </div>
        )}

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't listed any properties yet.</p>
            <button
              onClick={handleCreateProperty}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                showManageButtons 
                onDelete={() => {
                  setProperties(prev => prev.filter(p => p.id !== property.id));
                }}
              />
            ))}
          </div>
        )}
      </div>

      <TermsOverlay
        isOpen={showTerms}
        onAccept={handleAcceptTerms}
        onDecline={() => setShowTerms(false)}
      />
    </>
  );
}