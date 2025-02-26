import '../app/globals.css'
import { NextAuthProvider } from "@/providers/NextAuthProvider";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <NextAuthProvider>
      <Component {...pageProps} />
    </NextAuthProvider>
  )
}