'use client';

import MonthlyGoalForm from '@/components/MonthlyGoalForm';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function MetaPage() {
  return (
    <AuthenticatedLayout activeTab="goal">
      {(user) => <MonthlyGoalForm userId={user.uid} />}
    </AuthenticatedLayout>
  );
}
