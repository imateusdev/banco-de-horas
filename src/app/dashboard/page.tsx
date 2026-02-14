'use client';

import StatsDashboard from '@/components/StatsDashboard';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function Dashboard() {
  return (
    <AuthenticatedLayout activeTab="dashboard">
      {(user) => <StatsDashboard userId={user.uid} />}
    </AuthenticatedLayout>
  );
}
