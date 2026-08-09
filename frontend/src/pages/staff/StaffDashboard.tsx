import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types/order';
import { ShoppingBag, Clock, CheckCircle, RefreshCw, ChefHat, AlertCircle } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'ALL'>('LIVE');

  const fetchLiveOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getLiveBranchOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchLiveOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'IN_PREPARATION');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="blue">Branch Staff Terminal</Badge>
            <span className="text-xs font-bold text-stone-400">• Live POS & Order Kitchen Display</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-1.5">
            Branch Live Order Display
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track active walk-in and online orders and update kitchen preparation status.
          </p>
        </div>

        <Button onClick={fetchLiveOrders} variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
          Refresh Queue
        </Button>
      </div>

      {/* Live Order Status Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pending Orders Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-amber-100/60 rounded-2xl border border-amber-200">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Pending Orders</span>
            </div>
            <Badge variant="amber">{pendingOrders.length}</Badge>
          </div>

          <div className="space-y-3">
            {pendingOrders.map((o) => (
              <Card key={o.id} className="border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-stone-900 font-mono">#{o.id.substring(0, 8)}</span>
                  <Badge variant={o.order_type === 'CUSTOMER_ONLINE' ? 'blue' : 'gold'}>
                    {o.order_type === 'CUSTOMER_ONLINE' ? 'Online' : 'In-House'}
                  </Badge>
                </div>
                <div className="text-lg font-black text-stone-900 mb-1">${o.total_amount.toFixed(2)}</div>
                
                {o.items && o.items.length > 0 && (
                  <div className="my-2 py-2 border-y border-stone-100 space-y-1 text-xs text-stone-600">
                    {o.items.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span className="font-semibold text-stone-800">{it.item_name_snapshot}</span>
                        <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleUpdateStatus(o.id, 'CANCELLED')}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<ChefHat className="w-3.5 h-3.5" />}
                    onClick={() => handleUpdateStatus(o.id, 'IN_PREPARATION')}
                  >
                    Start Prep
                  </Button>
                </div>
              </Card>
            ))}

            {pendingOrders.length === 0 && (
              <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-stone-200 text-xs text-stone-400">
                No pending orders in queue.
              </div>
            )}
          </div>
        </div>

        {/* In Preparation Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-sky-100/60 rounded-2xl border border-sky-200">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
              <ChefHat className="w-4 h-4 text-sky-700 animate-pulse" />
              <span>In Kitchen Preparation</span>
            </div>
            <Badge variant="blue">{preparingOrders.length}</Badge>
          </div>

          <div className="space-y-3">
            {preparingOrders.map((o) => (
              <Card key={o.id} className="border-l-4 border-l-sky-500">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-stone-900 font-mono">#{o.id.substring(0, 8)}</span>
                  <Badge variant="blue">Preparing</Badge>
                </div>
                <div className="text-lg font-black text-stone-900 mb-1">${o.total_amount.toFixed(2)}</div>

                {o.items && o.items.length > 0 && (
                  <div className="my-2 py-2 border-y border-stone-100 space-y-1 text-xs text-stone-600">
                    {o.items.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span className="font-semibold text-stone-800">{it.item_name_snapshot}</span>
                        <span className="font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<CheckCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleUpdateStatus(o.id, 'COMPLETED')}
                  >
                    Mark Ready & Complete
                  </Button>
                </div>
              </Card>
            ))}

            {preparingOrders.length === 0 && (
              <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-stone-200 text-xs text-stone-400">
                No orders currently being prepared.
              </div>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-emerald-100/60 rounded-2xl border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Completed Today</span>
            </div>
            <Badge variant="emerald">{completedOrders.length}</Badge>
          </div>

          <div className="space-y-3">
            {completedOrders.slice(0, 5).map((o) => (
              <Card key={o.id} className="opacity-90 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-stone-900 font-mono">#{o.id.substring(0, 8)}</span>
                  <Badge variant="emerald">Completed</Badge>
                </div>
                <div className="text-base font-bold text-stone-800">${o.total_amount.toFixed(2)}</div>
              </Card>
            ))}

            {completedOrders.length === 0 && (
              <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-stone-200 text-xs text-stone-400">
                No completed orders yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
