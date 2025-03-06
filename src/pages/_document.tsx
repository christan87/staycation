import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}