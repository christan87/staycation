import '../app/globals.css'
import { NextAuthProvider } from "@/providers/NextAuthProvider"
import dynamic from 'next/dynamic'

const ErrorBoundary = dynamic(
  () => import('@/components/ErrorBoundary'),
  { ssr: false }
)

export default function App({ Component, pageProps }) {
  return (
    <NextAuthProvider>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </NextAuthProvider>
  )
}