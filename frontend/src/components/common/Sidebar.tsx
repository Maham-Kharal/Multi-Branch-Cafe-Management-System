import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  BookOpen,
  ShoppingBag,
  BarChart3,
  Users,
  ShieldCheck,
  Coffee,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const getNavLinks = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'Overview', path: '/admin', icon: LayoutDashboard },
          { label: 'Café Owners', path: '/admin/owners', icon: Users },
          { label: 'Cafés Platform', path: '/admin/cafes', icon: Store },
          { label: 'System Reports', path: '/admin/reports', icon: BarChart3 },
        ];
      case 'CAFE_OWNER':
        return [
          { label: 'Dashboard', path: '/owner', icon: LayoutDashboard },
          { label: 'Branches', path: '/owner/branches', icon: Store },
          { label: 'Master Menu', path: '/owner/master-menu', icon: BookOpen },
          { label: 'Branch Menu', path: '/owner/branch-menu', icon: UtensilsCrossed },
          { label: 'All Orders', path: '/owner/orders', icon: ShoppingBag },
        ];
      case 'BRANCH_STAFF':
        return [
          { label: 'POS Terminal', path: '/staff', icon: LayoutDashboard },
          { label: 'Live Orders', path: '/staff/orders', icon: ShoppingBag },
        ];
      default:
        return [
          { label: 'Café Menu', path: '/customer', icon: UtensilsCrossed },
          { label: 'My Orders', path: '/customer/orders', icon: ShoppingBag },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-stone-200/80 p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Coffee className="w-6 h-6 text-stone-950" />
              </div>
              <div>
                <h1 className="font-extrabold text-stone-900 text-lg tracking-tight leading-none">
                  Brewly Café
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                  Multi-Branch
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Navigation Group */}
          <div className="space-y-1">
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-stone-400 uppercase">
              Main Menu
            </div>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin' || item.path === '/owner' || item.path === '/staff'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/20'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer Tenant Badge */}
        <div className="pt-4 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-stone-800 truncate">
                {user?.tenant_id ? 'Enterprise Active' : 'System Account'}
              </p>
              <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
