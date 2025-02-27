import { Html, Head, Main, NextScript } from 'next/document'
import { Inter } from 'next/font/google'

// useState & useContext error fixed

const inter = Inter({ subsets: ['latin'] })

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body className={`min-h-screen bg-background text-foreground antialiased ${inter.className}`}>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}