import { Html, Head, Main, NextScript } from 'next/document'
import type { DocumentProps } from 'next/document'

export default function Document(props: DocumentProps) {
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