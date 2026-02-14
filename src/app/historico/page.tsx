'use client';

import { useAuth } from '@/hooks/useAuth';
import TimeRecordsList from '@/components/TimeRecordsList';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function HistoricoPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AuthenticatedLayout activeTab="history">
      <TimeRecordsList userId={user.uid} />
    </AuthenticatedLayout>
  );
}
