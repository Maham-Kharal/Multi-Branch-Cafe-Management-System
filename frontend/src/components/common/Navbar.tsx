import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import { LogOut, User as UserIcon, Menu, Coffee } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="pink">Super Admin</Badge>;
      case 'CAFE_OWNER':
        return <Badge variant="gold">Café Owner</Badge>;
      case 'BRANCH_STAFF':
        return <Badge variant="blue">Branch Staff</Badge>;
      default:
        return <Badge variant="emerald">Customer</Badge>;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Logo Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-900 font-bold">
              <Coffee className="w-5 h-5 text-stone-950" />
            </div>
            <span className="font-bold text-stone-900 tracking-tight">Brewly Café</span>
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-stone-800 tracking-tight leading-none">
                  {user.full_name || user.email}
                </span>
                <span className="mt-1">{getRoleBadge(user.role)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold shadow-xs">
                <UserIcon className="w-5 h-5 text-amber-700" />
              </div>
            </div>
          )}

          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-stone-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-stone-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
