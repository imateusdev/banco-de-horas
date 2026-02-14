'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useQueries';
import StatsDashboard from '@/components/StatsDashboard';
import TimeRecordsList from '@/components/TimeRecordsList';

export default function UserDashboardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const { data: userData } = useUserData(userId);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    router.push('/');
    return null;
  }

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', emoji: '📊' },
    { id: 'history' as const, label: 'Histórico', emoji: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Voltar
              </button>
              <h1 className="text-2xl font-bold text-white">
                👤 Dashboard de {userData?.displayName || userData?.email || 'Usuário'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Admin: {user.displayName || user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-300 hover:text-gray-100 hover:border-gray-500'
                }`}
              >
                <span className="mr-2">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <StatsDashboard userId={userId} />
        )}

        {activeTab === 'history' && (
          <TimeRecordsList
            userId={userId}
            onRecordUpdated={() => {}}
          />
        )}
      </main>
    </div>
  );
}
