import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { superAdminService, GlobalTelemetry, Tenant } from '../../services/superAdminService';
import { branchService } from '../../services/branchService';
import { orderService } from '../../services/orderService';
import { Branch } from '../../types/branch';
import { MasterMenuItem } from '../../types/menu';
import { User } from '../../types/auth';
import { Order } from '../../types/order';
import { Store, Users, Building, BookOpen, Eye, UserCheck, RefreshCw, Truck, Utensils } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [telemetry, setTelemetry] = useState<GlobalTelemetry | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Enterprise Detail Modal State
  const [inspectingTenant, setInspectingTenant] = useState<Tenant | null>(null);
  const [tenantBranches, setTenantBranches] = useState<Branch[]>([]);
  const [tenantMenu, setTenantMenu] = useState<MasterMenuItem[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const fetchPlatformData = async () => {
    try {
      const [telData, tenData, ownerData, branchData, orderData] = await Promise.all([
        superAdminService.getTelemetry(),
        superAdminService.getTenants(),
        superAdminService.getUsers('CAFE_OWNER'),
        branchService.getBranches(),
        orderService.getLiveBranchOrders().catch(() => []),
      ]);
      setTelemetry(telData);
      setTenants(tenData);
      setOwners(ownerData);
      setAllBranches(branchData);
      setAllOrders(orderData);
    } catch (err) {
      console.error('Error loading super admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
    // Auto-refresh real-time orders every 4 seconds
    const interval = setInterval(() => {
      fetchPlatformData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInspectEnterprise = async (tenant: Tenant) => {
    setInspectingTenant(tenant);
    setIsModalLoading(true);
    try {
      const [bList, mList] = await Promise.all([
        superAdminService.getTenantBranches(tenant.id),
        superAdminService.getTenantMasterMenu(tenant.id).catch(() => []),
      ]);
      setTenantBranches(bList);
      setTenantMenu(mList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const getBranchName = (branchId: string) => {
    const found = allBranches.find((b) => b.id === branchId);
    return found ? found.name : 'Branch';
  };

  const getOwnerForBranch = (tenantId: string) => {
    return owners.find((o) => o.tenant_id === tenantId);
  };

  const getTenantName = (tenantId: string) => {
    const found = tenants.find((t) => t.id === tenantId);
    return found ? found.name : 'Café Enterprise';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-500 p-6 rounded-3xl text-stone-950 shadow-md">
        <div>
          <Badge variant="pink">Super Admin Telemetry</Badge>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2">Platform Global Overview</h1>
          <p className="text-xs font-medium text-stone-900 mt-1">
            Monitor multi-tenant café enterprises, physical branches, owner directories, and live order completion.
          </p>
        </div>
        <button
          onClick={fetchPlatformData}
          className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Real-Time Data</span>
        </button>
      </div>

      {/* Real Dynamic Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-2xl text-amber-800">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Cafés</p>
            <h4 className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {isLoading ? '...' : tenants.length}
            </h4>
            <span className="text-[10px] font-semibold text-emerald-600">Enterprise Tenants</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-2xl text-rose-800">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Café Owners</p>
            <h4 className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {isLoading ? '...' : owners.length}
            </h4>
            <span className="text-[10px] text-stone-400">Verified Owner Accounts (Excl. Customers)</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-800">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active Branches</p>
            <h4 className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {isLoading ? '...' : allBranches.length}
            </h4>
            <span className="text-[10px] text-emerald-600 font-semibold">Physical Locations</span>
          </div>
        </Card>
      </div>

      {/* Physical Branches & Owner Assignment Directory */}
      <Card title="Physical Branches & Owner Directory" subtitle="Shows every physical branch location mapped directly to its Enterprise and Café Owner">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-stone-400">Loading branch directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-4 font-bold">Branch Name</th>
                  <th className="py-3 px-4 font-bold">Location / City</th>
                  <th className="py-3 px-4 font-bold">Café Enterprise</th>
                  <th className="py-3 px-4 font-bold">Assigned Café Owner</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {allBranches.map((b) => {
                  const owner = getOwnerForBranch(b.tenant_id);
                  return (
                    <tr key={b.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-stone-900">{b.name}</td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {b.city} — <span className="text-[11px] text-stone-400">{b.address}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-800">{getTenantName(b.tenant_id)}</td>
                      <td className="py-3.5 px-4">
                        {owner ? (
                          <div>
                            <p className="font-extrabold text-stone-900 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {owner.full_name}
                            </p>
                            <p className="text-[10px] text-stone-400">{owner.email}</p>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">No assigned owner</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={b.is_active ? 'emerald' : 'rose'}>
                          {b.is_active ? 'Active Location' : 'Disabled'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}

                {allBranches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      No physical branches created on platform yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Global Orders Monitoring Table */}
      <Card title="Global Orders & Live Branch Activity" subtitle="Real-time order receipts, branch routing, and live completion status tracking (Auto-refreshes every 4s)">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-stone-400">Loading global orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-4 font-bold">Order ID</th>
                  <th className="py-3 px-4 font-bold">Target Branch & ID</th>
                  <th className="py-3 px-4 font-bold">Total Price</th>
                  <th className="py-3 px-4 font-bold">Live Status</th>
                  <th className="py-3 px-4 font-bold">Fulfillment Info</th>
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {allOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-900 font-mono">#{o.id.substring(0, 8)}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-extrabold text-stone-900">{getBranchName(o.branch_id)}</p>
                        <p className="text-[10px] text-stone-400 font-mono">ID: {o.branch_id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-stone-900 text-sm">${o.total_amount.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          o.status === 'DELIVERED'
                            ? 'emerald'
                            : o.status === 'COMPLETED'
                            ? 'emerald'
                            : o.status === 'IN_PREPARATION'
                            ? 'blue'
                            : o.status === 'PENDING'
                            ? 'amber'
                            : 'rose'
                        }
                      >
                        {o.status === 'DELIVERED' ? 'Delivered 🚚' : o.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-stone-800 text-[11px]">
                        {o.delivery_address && o.delivery_address !== 'Dine-In / Pickup' ? (
                          <>
                            <Truck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="truncate max-w-[140px]">{o.delivery_address}</span>
                          </>
                        ) : (
                          <>
                            <Utensils className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                            <span>Dine-In / Pickup</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-400">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : 'Just now'}
                    </td>
                  </tr>
                ))}

                {allOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No orders placed on platform yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Multi-Tenant Enterprise List */}
      <Card title="Multi-Tenant Café Enterprises" subtitle="Inspect enterprise details, owned physical branches, and master catalogs">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-stone-400">Loading platform enterprises...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-4 font-bold">Enterprise Name</th>
                  <th className="py-3 px-4 font-bold">Tenant ID</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-stone-900">{t.name}</td>
                    <td className="py-3.5 px-4 font-mono text-stone-500">{t.id}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={t.is_active ? 'emerald' : 'rose'}>
                        {t.is_active ? 'Active Tenant' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspectEnterprise(t)}
                        className="p-1.5 text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Enterprise</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">
                      No café enterprises registered on platform yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inspection Modal */}
      <Modal
        isOpen={!!inspectingTenant}
        onClose={() => setInspectingTenant(null)}
        title={`Enterprise Inspection — ${inspectingTenant?.name || ''}`}
      >
        {isModalLoading ? (
          <div className="py-8 text-center text-xs text-stone-400">Loading enterprise details...</div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Enterprise Branches Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 font-bold text-stone-900 text-sm">
                <Store className="w-4 h-4 text-amber-700" />
                <span>Physical Branches ({tenantBranches.length})</span>
              </div>

              <div className="space-y-2">
                {tenantBranches.map((b) => (
                  <div key={b.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-stone-900">{b.name}</p>
                      <p className="text-[11px] text-stone-500">{b.city} — {b.address}</p>
                    </div>
                    <Badge variant={b.is_active ? 'emerald' : 'rose'}>
                      {b.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                ))}
                {tenantBranches.length === 0 && (
                  <p className="text-stone-400 italic">No physical branches created for this enterprise yet.</p>
                )}
              </div>
            </div>

            {/* Master Catalog Items Section */}
            <div className="pt-3 border-t border-stone-200">
              <div className="flex items-center gap-2 mb-2 font-bold text-stone-900 text-sm">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span>Master Menu Catalog ({tenantMenu.length})</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {tenantMenu.map((m) => (
                  <div key={m.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="flex justify-between">
                      <span className="font-bold text-stone-800">{m.name}</span>
                      <span className="font-extrabold text-amber-800">${m.base_price.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] text-stone-400">{m.category}</span>
                  </div>
                ))}
                {tenantMenu.length === 0 && (
                  <p className="text-stone-400 italic col-span-2">No master menu items defined yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
