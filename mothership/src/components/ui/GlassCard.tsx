import React from 'react';

import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'danger' | 'success';
}

export function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
  const variants = {
    default: 'bg-white/70 border-white/20 text-gray-800',
    dark: 'bg-slate-900/80 border-slate-700/50 text-white',
    danger: 'bg-red-500/10 border-red-500/20 text-red-100',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100',
  };

  return (
    <div
      className={twMerge(
        'backdrop-blur-md border shadow-xl rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
