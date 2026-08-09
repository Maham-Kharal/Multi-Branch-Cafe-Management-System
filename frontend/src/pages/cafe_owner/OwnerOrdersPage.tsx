import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types/order';
import { ShoppingBag, Eye, Search, CreditCard, DollarSign } from 'lucide-react';

export const OwnerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Receipt Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
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
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update status.');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="amber">Pending</Badge>;
      case 'IN_PREPARATION':
        return <Badge variant="blue">Preparing</Badge>;
      case 'COMPLETED':
        return <Badge variant="emerald">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="rose">Cancelled</Badge>;
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Enterprise Orders & Payments</h1>
          <p className="text-xs text-stone-500 mt-1">Real-time order tracking and financial transactions across all branches.</p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'IN_PREPARATION', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-stone-200/80">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter orders by Order ID..."
          className="bg-transparent text-sm w-full focus:outline-none text-stone-800 placeholder-stone-400"
        />
      </div>

      {/* Orders Table */}
      <Card title="Live Order Receipts & Transactions">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400">Loading order receipts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-4 font-bold">Order ID</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Items Count</th>
                  <th className="py-3 px-4 font-bold">Total Amount</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-900 font-mono">#{o.id.substring(0, 8)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={o.order_type === 'CUSTOMER_ONLINE' ? 'blue' : 'gold'}>
                        {o.order_type === 'CUSTOMER_ONLINE' ? 'Online Order' : 'In-House POS'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-800">
                      {o.items ? `${o.items.length} item(s)` : '1 item'}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-stone-900 text-sm">
                      ${o.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(o.status)}</td>
                    <td className="py-3.5 px-4 text-stone-400">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : 'Just now'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-stone-400">
                      No orders match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detailed Order Receipt Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Receipt & Payment Details">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID:</span>
                <span className="font-mono font-bold text-stone-900">#{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Order Type:</span>
                <Badge variant={selectedOrder.order_type === 'CUSTOMER_ONLINE' ? 'blue' : 'gold'}>
                  {selectedOrder.order_type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Current Status:</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <p className="font-bold text-stone-700 mb-1.5">Line Items Snapshot:</p>
                {selectedOrder.items?.map((it) => (
                  <div key={it.id} className="flex justify-between text-stone-600 py-1 border-b border-stone-100 last:border-none">
                    <span>
                      {it.item_name_snapshot} (x{it.quantity})
                    </span>
                    <span className="font-bold text-stone-900">${it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between font-extrabold text-sm text-stone-900">
                <span>Total Financial Amount:</span>
                <span className="text-amber-700">${selectedOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Status Change Controls */}
            {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'IN_PREPARATION')}
                  >
                    Start Preparation
                  </Button>
                )}
                {selectedOrder.status === 'IN_PREPARATION' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                  >
                    Mark Completed
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                >
                  Cancel Order
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
