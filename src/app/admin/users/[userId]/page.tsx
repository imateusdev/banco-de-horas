'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUserData } from '@/hooks/useQueries';
import StatsDashboard from '@/components/StatsDashboard';
import TimeRecordsList from '@/components/TimeRecordsList';
import AdminLayout from '@/components/AdminLayout';

export default function UserDashboardPage() {
  const params = useParams();
  const userId = params.userId as string;

  const { data: userData, isLoading } = useUserData(userId);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', emoji: '📊' },
    { id: 'history' as const, label: 'Histórico', emoji: '📋' },
  ];

  return (
    <AdminLayout loading={isLoading}>
      {/* Header */}
      <div className="glass-panel p-6 mb-6 fade-in-up">
        <div>
          <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-1">
            USER // DASHBOARD
          </span>
          <h1 className="text-2xl font-bold text-white">
            👤 {userData?.displayName || userData?.email || 'Usuário'}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-2 mb-6 fade-in-up stagger-1">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="fade-in-up stagger-2">
        {activeTab === 'dashboard' && <StatsDashboard userId={userId} />}

        {activeTab === 'history' && (
          <TimeRecordsList userId={userId} onRecordUpdated={() => {}} />
        )}
      </div>
    </AdminLayout>
  );
}
