import React from 'react';
import { Outlet } from 'react-router-dom';
import { Coffee } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative Warm Glass Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/25 mb-3">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Brewly Café</h1>
          <p className="text-sm font-medium text-stone-500 mt-1">Multi-Branch Management Platform</p>
        </div>

        {/* Auth Content Box */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-stone-200/80">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
