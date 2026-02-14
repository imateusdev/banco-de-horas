'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import TimeRecordForm from '@/components/TimeRecordForm';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function RegistrarPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <AuthenticatedLayout activeTab="register">
      <TimeRecordForm
        userId={user.uid}
        userName={user.displayName || user.email || 'Usuário'}
        onRecordAdded={() => router.push('/dashboard')}
      />
    </AuthenticatedLayout>
  );
}
