'use client';

import { useRouter } from 'next/navigation';
import TimeRecordForm from '@/components/TimeRecordForm';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function RegistrarPage() {
  const router = useRouter();

  return (
    <AuthenticatedLayout activeTab="register">
      {(user) => (
        <TimeRecordForm
          userId={user.uid}
          userName={user.displayName || user.email || 'Usuário'}
          onRecordAdded={() => router.push('/dashboard')}
        />
      )}
    </AuthenticatedLayout>
  );
}
