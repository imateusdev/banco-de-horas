'use client';

import { useRouter } from 'next/navigation';
import MonthlyGoalForm from '@/components/MonthlyGoalForm';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function MetaPage() {
  const router = useRouter();

  return (
    <AuthenticatedLayout activeTab="goal">
      {(user) => (
        <MonthlyGoalForm userId={user.uid} onGoalUpdated={() => router.push('/dashboard')} />
      )}
    </AuthenticatedLayout>
  );
}
