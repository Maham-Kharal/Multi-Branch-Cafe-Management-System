import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { branchService } from '../../services/branchService';
import { menuService } from '../../services/menuService';
import { orderService } from '../../services/orderService';
import { Branch } from '../../types/branch';
import { MasterMenuItem } from '../../types/menu';
import { Order } from '../../types/order';
import { Store, ShoppingBag, UtensilsCrossed, Plus, ArrowRight } from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [masterItems, setMasterItems] = useState<MasterMenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bData, mData, oData] = await Promise.all([
          branchService.getBranches(),
          menuService.getMasterMenu(),
          orderService.getLiveBranchOrders().catch(() => []),
        ]);
        setBranches(bData);
        setMasterItems(mData);
        setOrders(oData);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold">Café Enterprise Admin</Badge>
            <span className="text-xs font-bold text-stone-400">• Multi-Branch Control</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-1.5">
            Enterprise Performance Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage your physical café branches, master menu catalog, and location-based pricing overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/owner/branches">
            <Button icon={<Plus className="w-4 h-4" />}>Add New Branch</Button>
          </Link>
          <Link to="/owner/master-menu">
            <Button variant="outline" icon={<UtensilsCrossed className="w-4 h-4" />}>
              Master Menu
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-100 rounded-2xl text-amber-900">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Owned Branches</p>
            <h4 className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {isLoading ? '...' : branches.length}
            </h4>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">All Operating</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3.5 bg-sky-100 rounded-2xl text-sky-900">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Orders Today</p>
            <h4 className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {isLoading ? '...' : orders.length}
            </h4>
            <span className="text-[10px] text-stone-400 mt-0.5">
              {orders.length === 0 ? 'No orders placed yet' : 'Real-time orders'}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3.5 bg-rose-100 rounded-2xl text-rose-900">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Master Menu Items</p>
            <h4 className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {isLoading ? '...' : masterItems.length}
            </h4>
            <span className="text-[10px] text-stone-400 mt-0.5">Global Catalog</span>
          </div>
        </Card>
      </div>

      {/* Enterprise Branches Grid */}
      <Card
        title="Physical Café Branches"
        subtitle="Manage locations and configure branch-specific menu items"
        action={
          <Link to="/owner/branches" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        }
      >
        {isLoading ? (
          <div className="py-8 text-center text-xs text-stone-400">Loading your branches...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 hover:border-amber-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                      {b.city}
                    </span>
                    <Badge variant={b.is_active ? 'emerald' : 'rose'}>
                      {b.is_active ? 'Operating' : 'Closed'}
                    </Badge>
                  </div>
                  <h4 className="text-base font-extrabold text-stone-900 mt-2">{b.name}</h4>
                  <p className="text-xs text-stone-500 mt-1">{b.address}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium">{b.phone || 'No phone set'}</span>
                  <Link
                    to="/owner/branch-menu"
                    className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    Menu Pricing →
                  </Link>
                </div>
              </div>
            ))}

            {branches.length === 0 && (
              <div className="col-span-full py-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <Store className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-700">No branches added yet</p>
                <p className="text-xs text-stone-400 mt-1">Set up your first physical branch to begin operations.</p>
                <div className="mt-3">
                  <Link to="/owner/branches">
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                      Create Branch
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
