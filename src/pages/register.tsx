import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { signIn } from 'next-auth/react';
import Head from 'next/head';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface PasswordStrength {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const PasswordStrengthIndicator = ({ passwordStrength }: { passwordStrength: PasswordStrength }) => {
  const getIcon = (condition: boolean) => 
    condition ? (
      <span className="text-green-600">✓</span>
    ) : (
      <span className="text-red-600">✗</span>
    );

  const requirements = [
    { condition: passwordStrength.hasMinLength, text: 'At least 8 characters' },
    { condition: passwordStrength.hasUpperCase, text: 'At least one uppercase letter' },
    { condition: passwordStrength.hasLowerCase, text: 'At least one lowercase letter' },
    { condition: passwordStrength.hasNumber, text: 'At least one number' },
    { condition: passwordStrength.hasSpecialChar, text: 'At least one special character (!@#$%^&*(),.?":{}|<>_)' },
  ];

  return (
    <div className="space-y-1 text-sm">
      <h3 className="font-medium text-gray-700 mb-2">Password Requirements:</h3>
      {requirements.map((req, index) => (
        <p 
          key={index}
          className={`flex items-center gap-2 ${req.condition ? 'text-green-600' : 'text-gray-600'}`}
        >
          {getIcon(req.condition)} {req.text}
        </p>
      ))}
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
      });
      return;
    }

    setPasswordStrength({
      hasMinLength: formData.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasLowerCase: /[a-z]/.test(formData.password),
      hasNumber: /[0-9]/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_]/.test(formData.password),
    });
  }, [formData.password]);

  const isPasswordStrong = () => {
    return Object.values(passwordStrength).every(Boolean);
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      /\S+@\S+\.\S+/.test(formData.email) &&
      isPasswordStrong() &&
      formData.password === formData.confirmPassword
    );
  };

  const getFieldError = (field: keyof FormData) => {
    if (!attemptedSubmit && !touched[field]) return undefined;
    
    switch (field) {
      case 'name':
        return !formData.name.trim() ? 'Required' : undefined;
      case 'email':
        return !formData.email.trim() 
          ? 'Required' 
          : !/\S+@\S+\.\S+/.test(formData.email)
          ? 'Please enter a valid email'
          : undefined;
      case 'password':
        return !formData.password
          ? 'Required'
          : !isPasswordStrong()
          ? 'Password does not meet all requirements'
          : undefined;
      case 'confirmPassword':
        return !formData.confirmPassword
          ? 'Required'
          : formData.password !== formData.confirmPassword
          ? 'Passwords do not match'
          : undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (!isFormValid()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // First register the user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setErrors({
          general: registerData.error || 'Registration failed',
        });
        return;
      }

      // If registration is successful, sign in the user
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setErrors({
          general: signInResult.error,
        });
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        general: 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordHelperText = () => {
    return touched.password ? <PasswordStrengthIndicator passwordStrength={passwordStrength} /> : null;
  };

  return (
    <>
      <Head>
        <title>Register - Staycation</title>
        <meta name="description" content="Create your Staycation account to start booking amazing properties" />
      </Head>
      <Container className="py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="mt-2 text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {errors.general}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('name')}
              touched={touched.name || attemptedSubmit}
              disabled={isLoading}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('email')}
              touched={touched.email || attemptedSubmit}
              disabled={isLoading}
              required
            />

            <div className="space-y-4">
              <PasswordStrengthIndicator passwordStrength={passwordStrength} />
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getFieldError('password')}
                success={Boolean(touched.password && isPasswordStrong())}
                touched={touched.password || attemptedSubmit}
                disabled={isLoading}
                required
              />
            </div>

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('confirmPassword')}
              success={Boolean(
                (touched.confirmPassword || attemptedSubmit) &&
                formData.confirmPassword &&
                formData.password === formData.confirmPassword
              )}
              touched={touched.confirmPassword || attemptedSubmit}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="mt-4 flex space-x-4">
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
          </form>
        </div>
      </Container>
    </>
  );
}
