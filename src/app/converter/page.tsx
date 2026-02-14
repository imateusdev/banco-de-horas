'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import HourConversionForm from '@/components/HourConversionForm';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function ConverterPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <AuthenticatedLayout activeTab="conversion">
      <HourConversionForm
        userId={user.uid}
        userName={user.displayName || user.email || 'Usuário'}
        onConversionAdded={() => router.push('/dashboard')}
      />
    </AuthenticatedLayout>
  );
}
