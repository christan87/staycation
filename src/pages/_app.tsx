import type { AppProps } from 'next/app';
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import '../app/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <NextAuthProvider>
      <Component {...pageProps} />
    </NextAuthProvider>
  );
}