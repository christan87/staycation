import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">404 - Page Not Found</h2>
        <p className="text-gray-600 text-center mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex justify-center">
          <Link
            href="/"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  )
}