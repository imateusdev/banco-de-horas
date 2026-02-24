'use client';

import { ReactNode } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

interface AdminLayoutProps {
  children: ReactNode | ((user: any) => ReactNode);
  loading?: boolean;
}

export default function AdminLayout({ children, loading = false }: AdminLayoutProps) {
  return (
    <AuthenticatedLayout adminOnly loading={loading}>
      {children}
    </AuthenticatedLayout>
  );
}
