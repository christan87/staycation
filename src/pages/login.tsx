import { useState } from 'react';
import { useRouter } from 'next/router'; // Changed from next/navigation
import Link from 'next/link';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { signIn, useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Head from 'next/head';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in (client-side)
  if (session) {
    router.push('/dashboard');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: FormErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({
          general: 'Invalid email or password',
        });
        return;
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - Staycation</title>
        <meta name="description" content="Sign in to your Staycation account" />
      </Head>
      <Container>
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Or{' '}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  create a new account
                </Link>
              </p>
            </div>

            {errors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {errors.general}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  autoComplete="email"
                  required
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  disabled={isLoading}
                  fullWidth
                >
                  <img
                    className="w-5 h-5 mr-2"
                    src="/google.svg"
                    alt="Google logo"
                  />
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
                  disabled={isLoading}
                  fullWidth
                >
                  <img
                    className="w-5 h-5 mr-2"
                    src="/facebook.svg"
                    alt="Facebook logo"
                  />
                  Facebook
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

// Server-side redirect if already logged in
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
