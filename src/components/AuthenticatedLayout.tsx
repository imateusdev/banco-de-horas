'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/AppSidebar';
import ModernBackground from '@/components/ModernBackground';
import { cn } from '@/lib/utils';
import { useEffect, ReactNode } from 'react';

interface AuthenticatedLayoutProps {
  children: ReactNode | ((user: any) => ReactNode);
  activeTab: 'dashboard' | 'register' | 'goal' | 'conversion' | 'history';
}

export default function AuthenticatedLayout({ children, activeTab }: AuthenticatedLayoutProps) {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
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
        onTabChange={(tab) => {
          const routes = {
            dashboard: '/dashboard',
            register: '/registrar',
            goal: '/meta',
            conversion: '/converter',
            history: '/historico',
          };
          router.push(routes[tab]);
        }}
        user={user}
        isAdmin={isAdmin}
        onAdminClick={() => router.push('/admin/users')}
        onLogout={() => signOut()}
      />
      <div className="flex-1 md:ml-[280px] overflow-auto relative z-10">
        <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full min-h-screen">
          {typeof children === 'function' ? children(user) : children}
        </main>
      </div>
    </div>
  );
}
