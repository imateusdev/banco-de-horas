'use client';

import TimeRecordsList from '@/components/TimeRecordsList';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function HistoricoPage() {
  return (
    <AuthenticatedLayout activeTab="history">
      {(user) => <TimeRecordsList userId={user.uid} />}
    </AuthenticatedLayout>
  );
}
