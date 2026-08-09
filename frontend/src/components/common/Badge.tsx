import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'pink' | 'emerald' | 'amber' | 'blue' | 'rose' | 'gray';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gold', size = 'sm' }) => {
  const variantStyles = {
    gold: 'bg-amber-100 text-amber-900 border-amber-300',
    pink: 'bg-rose-100 text-rose-900 border-rose-200',
    emerald: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    amber: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    blue: 'bg-sky-100 text-sky-900 border-sky-300',
    rose: 'bg-red-100 text-red-900 border-red-300',
    gray: 'bg-stone-100 text-stone-700 border-stone-300',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold',
    md: 'px-3 py-1 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};
