'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function ModernCard({
  id,
  title,
  subtitle,
  children,
  className,
  hover = true,
}: ModernCardProps) {
  return (
    <div className={cn('glass-panel p-6 sm:p-7', className, !hover && 'hover:transform-none')}>
      {(id || title) && (
        <div className="mb-4">
          {id && (
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              {id}
            </span>
          )}
          {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
          {subtitle && (
            <p className="text-xs font-mono text-white/40 uppercase tracking-wider mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
