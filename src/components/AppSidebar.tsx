'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Clock,
  Target,
  DollarSign,
  History,
  LogOut,
  Users,
  ArrowLeft,
  CheckCircle,
  Trophy,
} from 'lucide-react';
import { usePendingApprovals } from '@/hooks/useQueries';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  activeTab: 'dashboard' | 'register' | 'goal' | 'conversion' | 'history';
  onTabChange: (tab: 'dashboard' | 'register' | 'goal' | 'conversion' | 'history') => void;
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  };
  isAdmin?: boolean;
  onAdminClick?: () => void;
  onLogout: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  hideNavigation?: boolean;
}

export default function AppSidebar({
  activeTab,
  onTabChange,
  user,
  isAdmin,
  onAdminClick,
  onLogout,
  showBackButton,
  onBackClick,
  hideNavigation = false,
}: AppSidebarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: pendingData } = usePendingApprovals(isAdmin || false);
  const pendingCount = pendingData?.total || 0;

  const links = [
    {
      label: 'Dashboard',
      href: '#',
      icon: (
        <LayoutDashboard
          className={cn(
            'h-6 w-6 shrink-0',
            activeTab === 'dashboard' ? 'text-blue-400' : 'text-neutral-400'
          )}
        />
      ),
      id: 'dashboard' as const,
    },
    {
      label: 'Registrar',
      href: '#',
      icon: (
        <Clock
          className={cn(
            'h-6 w-6 shrink-0',
            activeTab === 'register' ? 'text-blue-400' : 'text-neutral-400'
          )}
        />
      ),
      id: 'register' as const,
    },
    {
      label: 'Meta',
      href: '#',
      icon: (
        <Target
          className={cn(
            'h-6 w-6 shrink-0',
            activeTab === 'goal' ? 'text-blue-400' : 'text-neutral-400'
          )}
        />
      ),
      id: 'goal' as const,
    },
    {
      label: 'Converter Horas',
      href: '#',
      icon: (
        <DollarSign
          className={cn(
            'h-6 w-6 shrink-0',
            activeTab === 'conversion' ? 'text-blue-400' : 'text-neutral-400'
          )}
        />
      ),
      id: 'conversion' as const,
    },
    {
      label: 'Histórico',
      href: '#',
      icon: (
        <History
          className={cn(
            'h-6 w-6 shrink-0',
            activeTab === 'history' ? 'text-blue-400' : 'text-neutral-400'
          )}
        />
      ),
      id: 'history' as const,
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}
          {!hideNavigation && (
            <div className="mt-8 flex flex-col gap-2">
              {showBackButton && onBackClick && (
                <SidebarLink
                  link={{
                    label: 'Voltar',
                    href: '#',
                    icon: <ArrowLeft className="text-neutral-400 h-6 w-6 shrink-0" />,
                  }}
                  onClick={onBackClick}
                  className="mb-4 border-b border-neutral-800 pb-4"
                />
              )}
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  onClick={() => onTabChange(link.id)}
                  className={cn(activeTab === link.id && 'bg-blue-950 hover:bg-blue-900')}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          {isAdmin && (
            <>
              <SidebarLink
                link={{
                  label: 'Gerenciar Usuários',
                  href: '#',
                  icon: <Users className="text-neutral-400 h-6 w-6 shrink-0" />,
                }}
                onClick={onAdminClick}
              />
              <SidebarLink
                link={{
                  label: 'Ranking',
                  href: '#',
                  icon: <Trophy className="text-neutral-400 h-6 w-6 shrink-0" />,
                }}
                onClick={() => router.push('/admin/ranking')}
              />
              <SidebarLink
                link={{
                  label: 'Aprovações',
                  href: '#',
                  icon: (
                    <div className="relative">
                      <CheckCircle className="text-neutral-400 h-6 w-6 shrink-0" />
                      {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                          {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                      )}
                    </div>
                  ),
                }}
                onClick={() => router.push('/admin/approvals')}
              />
            </>
          )}
          <SidebarLink
            link={{
              label: 'Sair',
              href: '#',
              icon: <LogOut className="text-neutral-400 h-6 w-6 shrink-0" />,
            }}
            onClick={onLogout}
          />
          <div className="mt-6 pt-4 border-t border-neutral-800">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-neutral-200">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <motion.div
                animate={{
                  display: open ? 'block' : 'none',
                  opacity: open ? 1 : 0,
                }}
                className="text-neutral-200 text-sm"
              >
                <p className="font-semibold">{user.displayName || 'Usuário'}</p>
                <p className="text-neutral-400 text-xs truncate max-w-45">{user.email}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <div className="font-normal flex space-x-3 items-center text-base text-white py-2 relative z-20">
      <img
        src="/icon.jpeg"
        alt="Banco de Horas"
        className="h-8 w-8 rounded-lg shrink-0 object-cover"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-semibold text-neutral-100 whitespace-pre text-lg"
      >
        Banco de Horas
      </motion.span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-base text-white py-2 relative z-20">
      <img
        src="/icon.jpeg"
        alt="Banco de Horas"
        className="h-8 w-8 rounded-lg shrink-0 object-cover"
      />
    </div>
  );
};
