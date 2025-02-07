'use client';

import { useEffect, useState } from 'react';
import { GET_MY_PROPERTIES } from '@/graphql/operations/property/queries';
import { useRouter } from 'next/navigation';
import PropertyCard from '@/components/property/PropertyCard';
import { useSession } from 'next-auth/react';
import { Property, PropertyType } from '@/types/property';

// Terms and Conditions Overlay Component
const TermsOverlay = ({ 
  isOpen, 
  onAccept, 
  onDecline 
}: { 
  isOpen: boolean; 
  onAccept: () => void; 
  onDecline: () => void;
}) => {
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
          <h3 className="font-semibold mb-2">Property Listing Agreement</h3>
          <p className="mb-4">
            By accepting these terms, you agree to the following conditions for listing properties on our platform:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>You confirm that you are the legal owner or authorized representative of the property being listed.</li>
            <li>All information provided about the property must be accurate and truthful.</li>
            <li>You agree to maintain the property in the condition described in the listing.</li>
            <li>You will respond to booking requests in a timely manner.</li>
            <li>You understand that false information may result in listing removal.</li>
            <li>You agree to comply with all local laws and regulations regarding property rentals.</li>
            <li>You will maintain appropriate insurance coverage for the property.</li>
            <li>You accept responsibility for guest communication and property management.</li>
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
        <div className="flex justify-end gap-4">
          <button
            onClick={onDecline}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!hasRead}
            className={`px-4 py-2 text-white rounded ${
              hasRead ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const fetchProperties = async () => {
        try {
          console.log('Fetching properties...');
          const response = await fetch('/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: GET_MY_PROPERTIES,
            })
          });

          // Log the response details for debugging
          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));
          
          const text = await response.text();
          console.log('Raw response:', text);

          // Only try to parse if we got a non-empty response
          if (!text.trim()) {
            throw new Error('Empty response from server');
          }

          // Check if we got an HTML response (error page)
          if (text.trim().startsWith('<!DOCTYPE')) {
            throw new Error('Received HTML instead of JSON. Server error occurred.');
          }

          const result = JSON.parse(text);

          if (result.errors) {
            console.error('GraphQL Errors:', result.errors);
            const errorMessage = result.errors[0]?.message || 'Failed to fetch properties';
            throw new Error(errorMessage);
          }

          if (!result.data?.myProperties) {
            console.error('No properties data in response:', result);
            throw new Error('No properties data received');
          }

          setProperties(result.data.myProperties);
        } catch (err) {
          console.error('Error fetching properties:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchProperties();
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
                user {
                  id
                  role
                }
              }
            }
          `
        })
      });

      const result = await response.json();

      if (!result.data?.becomeHost?.success) {
        throw new Error(result.data?.becomeHost?.message || 'Failed to become a host');
      }

      setIsAuthorized(true);
      setShowTerms(false);
      router.push('/properties/new');
    } catch (error) {
      console.error('Error becoming host:', error);
      // You might want to show an error message to the user here
      setShowTerms(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TermsOverlay
        isOpen={showTerms}
        onAccept={handleAcceptTerms}
        onDecline={() => setShowTerms(false)}
      />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
        <button
          onClick={handleCreateProperty}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Property
        </button>
      </div>
      
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
  );
}