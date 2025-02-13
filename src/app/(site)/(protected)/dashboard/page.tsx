import { Container } from '@/components/Container';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/app/(site)/(protected)/dashboard/DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <Container>
      <DashboardClient session={session} />
    </Container>
  );
}
