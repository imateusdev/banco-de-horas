'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MonthlyGoalForm from '@/components/MonthlyGoalForm';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function MetaPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <AuthenticatedLayout activeTab="goal">
      <MonthlyGoalForm userId={user.uid} onGoalUpdated={() => router.push('/dashboard')} />
    </AuthenticatedLayout>
  );
}
