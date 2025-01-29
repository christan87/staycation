/**
 * Landing Page
 * 
 * The main landing page of the application featuring:
 * - Hero section with call-to-action
 * - Key features section
 * - Navigation to auth pages
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import Image from 'next/image';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      <Container>
        <div className="min-h-screen">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center py-12 lg:py-20">
            {/* Left Column - Main Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                  Find Your Perfect{' '}
                  <span className="text-blue-600">
                    Staycation
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-gray-600">
                  Discover unique accommodations that feel like home. Book verified properties with confidence and explore the world your way.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="flex-1">
                  <Button variant="primary" size="lg" fullWidth>
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button variant="outline" size="lg" fullWidth>
                    Create Account
                  </Button>
                </Link>
              </div>

              {/* Feature List */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Verified Properties</h3>
                    <p className="text-gray-600">All listings are verified for quality and safety</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Instant Booking</h3>
                    <p className="text-gray-600">Book your stay with just a few clicks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Best Prices</h3>
                    <p className="text-gray-600">Competitive rates with no hidden fees</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image Grid */}
            <div className="relative grid grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-4 lg:space-y-6 pt-8">
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/images/property1.jpg"
                    alt="Luxury villa with pool"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/images/property2.jpg"
                    alt="Modern apartment interior"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 lg:space-y-6">
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/images/property3.jpg"
                    alt="Cozy cabin in the woods"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/images/property4.jpg"
                    alt="Beachfront cottage"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="py-12 lg:py-20 text-center">
            <Link href="/properties" className="inline-block">
              <Button variant="primary" size="lg">
                Start Exploring Properties
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
