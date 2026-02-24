'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/AppSidebar';
import ModernBackground from '@/components/ModernBackground';
import { cn } from '@/lib/utils';
import { useEffect, useCallback, ReactNode } from 'react';

const TAB_ROUTES = {
  dashboard: '/dashboard',
  register: '/registrar',
  goal: '/meta',
  conversion: '/converter',
  history: '/historico',
} as const;

interface AuthenticatedLayoutProps {
  children: ReactNode | ((user: any) => ReactNode);
  activeTab?: 'dashboard' | 'register' | 'goal' | 'conversion' | 'history';
  adminOnly?: boolean;
  loading?: boolean;
}

export default function AuthenticatedLayout({
  children,
  activeTab = 'dashboard',
  adminOnly = false,
  loading = false,
}: AuthenticatedLayoutProps) {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || (adminOnly && !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, authLoading, adminOnly, router]);

  const handleTabChange = useCallback(
    (tab: keyof typeof TAB_ROUTES) => {
      router.push(TAB_ROUTES[tab]);
    },
    [router]
  );

  const handleAdminClick = useCallback(() => router.push('/admin/users'), [router]);
  const handleLogout = useCallback(() => signOut(), [signOut]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <ModernBackground />
        <div className="relative z-10 text-white text-lg font-mono tracking-wider">
          Carregando...
        </div>
      </div>
    );
  }

  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return (
    <div className={cn('flex flex-col md:flex-row bg-[#020202] w-full min-h-screen')}>
      <ModernBackground />
      <AppSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        isAdmin={isAdmin}
        onAdminClick={handleAdminClick}
        onLogout={handleLogout}
      />
      <div className="flex-1 md:ml-70 overflow-auto relative z-10">
        <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full min-h-screen">
          {typeof children === 'function' ? children(user) : children}
        </main>
      </div>
    </div>
  );
}
