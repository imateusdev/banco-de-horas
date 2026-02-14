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
import AppSidebar from '@/components/AppSidebar';
import ModernBackground from '@/components/ModernBackground';
import { cn } from '@/lib/utils';

export default function UserDashboard() {
  const params = useParams();
  const router = useRouter();
  const userSlug = params.userSlug as string;

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'register' | 'goal' | 'conversion' | 'history'
  >('dashboard');
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

  const handleBackToUsers = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <ModernBackground />
        <div className="relative z-10 text-white text-lg font-mono tracking-wider">
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={cn('flex flex-col md:flex-row bg-[#020202] w-full min-h-screen')}>
      <ModernBackground />
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={{ displayName: user.name, email: null, photoURL: null }}
        showBackButton
        onBackClick={handleBackToUsers}
        onLogout={() => router.push('/')}
      />
      <div className="flex-1 md:ml-[280px] overflow-auto relative z-10">
        <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full min-h-screen">
          {activeTab === 'dashboard' && <StatsDashboard userId={user.id} />}

          {activeTab === 'register' && (
            <TimeRecordForm
              userId={user.id}
              userName={user.name}
              onRecordAdded={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'goal' && (
            <MonthlyGoalForm userId={user.id} onGoalUpdated={() => setActiveTab('dashboard')} />
          )}

          {activeTab === 'conversion' && (
            <HourConversionForm
              userId={user.id}
              userName={user.name}
              onConversionAdded={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'history' && <TimeRecordsList userId={user.id} />}
        </main>
      </div>
    </div>
  );
}
