'use client';

import { useRouter } from 'next/navigation';
import HourConversionForm from '@/components/HourConversionForm';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function ConverterPage() {
  const router = useRouter();

  return (
    <AuthenticatedLayout activeTab="conversion">
      {(user) => (
        <HourConversionForm
          userId={user.uid}
          userName={user.displayName || user.email || 'Usuário'}
          onConversionAdded={() => router.push('/dashboard')}
        />
      )}
    </AuthenticatedLayout>
  );
}
