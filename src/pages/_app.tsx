import '@/styles/globals.css'
import { NextAuthProvider } from "@/providers/NextAuthProvider"
import dynamic from 'next/dynamic'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import type { Session } from 'next-auth'
import Navigation from '@/components/Navigation'
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/graphql-client';

const inter = Inter({ subsets: ['latin'] })

const ErrorBoundary = dynamic(
  () => import('@/components/ErrorBoundary'),
  { ssr: false }
)

type CustomAppProps = AppProps<{
  session: Session | null;
}> & {
  Component: AppProps['Component'] & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
    auth?: boolean;
  };
}

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps }
}: CustomAppProps) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ApolloProvider client={client}>
      <NextAuthProvider session={session}>
        <Head>
          <title>Staycation - Find Your Perfect Getaway</title>
          <meta name="description" content="Discover and book unique accommodations around the world." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#ffffff" />
          <meta name="color-scheme" content="light dark" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
        </Head>
        <ErrorBoundary>
          <div className={`${inter.className} min-h-screen bg-gray-50`}>
            <Navigation />
            {getLayout(<Component {...pageProps} />)}
          </div>
        </ErrorBoundary>
      </NextAuthProvider>
    </ApolloProvider>
  )
}