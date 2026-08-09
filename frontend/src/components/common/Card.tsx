import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
}) => {
  return (
    <div className={`cafe-card rounded-2xl p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
          <div>
            {title && <h3 className="text-lg font-bold text-stone-800 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
