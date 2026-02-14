'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import TimeRecordForm from '@/components/TimeRecordForm';
import MonthlyGoalForm from '@/components/MonthlyGoalForm';
import StatsDashboard from '@/components/StatsDashboard';
import TimeRecordsList from '@/components/TimeRecordsList';
import HourConversionForm from '@/components/HourConversionForm';

export default function Dashboard() {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'register' | 'goal' | 'conversion' | 'history'
  >('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', emoji: '📊' },
    { id: 'register' as const, label: 'Registrar', emoji: '⏰' },
    { id: 'goal' as const, label: 'Meta', emoji: '🎯' },
    { id: 'conversion' as const, label: 'Converter Horas', emoji: '💰' },
    { id: 'history' as const, label: 'Histórico', emoji: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">⏰ Banco de Horas</h1>

            <div className="flex items-center space-x-4">
              <span className="text-gray-300">👤 {user.displayName || user.email}</span>
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin/users')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  👥 Gerenciar Usuários
                </button>
              )}
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sair
              </button>
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
          <StatsDashboard refreshTrigger={refreshTrigger} userId={user.uid} />
        )}

        {activeTab === 'register' && (
          <TimeRecordForm
            userId={user.uid}
            userName={user.displayName || user.email || 'Usuário'}
            onRecordAdded={() => {
              triggerRefresh();
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'goal' && (
          <MonthlyGoalForm
            userId={user.uid}
            onGoalUpdated={() => {
              triggerRefresh();
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'conversion' && (
          <HourConversionForm
            userId={user.uid}
            userName={user.displayName || user.email || 'Usuário'}
            onConversionAdded={() => {
              triggerRefresh();
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'history' && (
          <TimeRecordsList
            userId={user.uid}
            refreshTrigger={refreshTrigger}
            onRecordUpdated={triggerRefresh}
          />
        )}
      </main>
    </div>
  );
}
