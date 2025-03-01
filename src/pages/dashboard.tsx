import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container } from '@/components/Container';
import { DashboardClient } from '@/components/DashboardClient';
import type { Session } from 'next-auth';

interface SerializedSession {
  user: {
    name?: string | null;
    email?: string | null;
    id?: string | null;
  } | null;
  expires: string;
}

interface DashboardPageProps {
  session: SerializedSession;
}

export default function DashboardPage({ session }: DashboardPageProps) {
  return (
    <Container>
      <DashboardClient session={session} />
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardPageProps> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Explicitly structure the session data we want to pass
  const serializedSession: SerializedSession = {
    user: session.user ? {
      name: session.user.name || null,
      email: session.user.email || null,
      id: session.user.id || null,
    } : null,
    expires: session.expires
  };

  return {
    props: {
      session: serializedSession
    }
  };
};