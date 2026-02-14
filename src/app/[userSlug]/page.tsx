'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientStorageUtils } from '@/lib/client-storage';
import { User } from '@/types';
import TimeRecordForm from '@/components/TimeRecordForm';
import MonthlyGoalForm from '@/components/MonthlyGoalForm';
import StatsDashboard from '@/components/StatsDashboard';
import TimeRecordsList from '@/components/TimeRecordsList';
import HourConversionForm from '@/components/HourConversionForm';

export default function UserDashboard() {
  const params = useParams();
  const router = useRouter();
  const userSlug = params.userSlug as string;

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'register' | 'goal' | 'conversion' | 'history'
  >('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const foundUser = await clientStorageUtils.getUserBySlug(userSlug);
      if (!foundUser) {
        router.push('/');
        return;
      }

      setUser(foundUser);
      setLoading(false);
    };

    loadUser();
  }, [userSlug, router]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBackToUsers = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
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
            <button
              onClick={handleBackToUsers}
              className="text-gray-300 hover:text-white transition-colors"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-white text-center flex-1">👤 {user.name}</h1>
            <div className="w-16"></div> {}
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
          <StatsDashboard refreshTrigger={refreshTrigger} userId={user.id} />
        )}

        {activeTab === 'register' && (
          <TimeRecordForm
            userId={user.id}
            userName={user.name}
            onRecordAdded={() => {
              triggerRefresh();
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'goal' && (
          <MonthlyGoalForm
            userId={user.id}
            onGoalUpdated={() => {
              triggerRefresh();
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'conversion' && (
          <HourConversionForm
            userId={user.id}
            userName={user.name}
            onConversionAdded={() => {
              triggerRefresh();
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'history' && (
          <TimeRecordsList
            userId={user.id}
            refreshTrigger={refreshTrigger}
            onRecordUpdated={triggerRefresh}
          />
        )}
      </main>
    </div>
  );
}
