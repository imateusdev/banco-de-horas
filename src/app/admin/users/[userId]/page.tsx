'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUserData } from '@/hooks/useQueries';
import StatsDashboard from '@/components/StatsDashboard';
import TimeRecordsList from '@/components/TimeRecordsList';
import AdminLayout from '@/components/AdminLayout';
import AdminGoalModal from '@/components/AdminGoalModal';
import AdminConversionModal from '@/components/AdminConversionModal';

export default function UserDashboardPage() {
  const params = useParams();
  const userId = params.userId as string;

  const { data: userData, isLoading } = useUserData(userId);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', emoji: '📊' },
    { id: 'history' as const, label: 'Histórico', emoji: '📋' },
  ];

  return (
    <AdminLayout loading={isLoading}>
      <div className="glass-panel p-6 mb-6 fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-1">
              USER // DASHBOARD
            </span>
            <h1 className="text-2xl font-bold text-white">
              👤 {userData?.displayName || userData?.email || 'Usuário'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 text-sm font-medium"
            >
              🎯 Definir Meta
            </button>
            <button
              onClick={() => setShowConversionModal(true)}
              className="px-4 py-2 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 text-sm font-medium"
            >
              💰 Converter Horas
            </button>
          </div>
        </div>
      </div>

      <AdminGoalModal
        userId={userId}
        userName={userData?.displayName || userData?.email || 'Usuário'}
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
      />

      <AdminConversionModal
        userId={userId}
        userName={userData?.displayName || userData?.email || 'Usuário'}
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
      />

      {/* Tabs */}
      <div className="glass-panel p-2 mb-6 fade-in-up stagger-1">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
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

        {activeTab === 'history' && <TimeRecordsList userId={userId} onRecordUpdated={() => {}} />}
      </div>
    </AdminLayout>
  );
}
