import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { branchService } from '../../services/branchService';
import { menuService } from '../../services/menuService';
import { orderService } from '../../services/orderService';
import { Branch } from '../../types/branch';
import { MasterMenuItem } from '../../types/menu';
import { Order } from '../../types/order';
import { ShoppingBag, Plus, Minus, CheckCircle2, AlertCircle, Store, CreditCard, DollarSign, Smartphone, Eye, RotateCcw, Truck, Utensils, MapPin, PackageCheck, Clock } from 'lucide-react';

interface DisplayMenuItem {
  id: string;
  isBranchItem: boolean;
  branchMenuItemId?: string;
  masterMenuItemId?: string;
  name: string;
  category: string;
  price: number;
}

interface CartItem {
  displayItem: DisplayMenuItem;
  quantity: number;
}

export const CustomerMenuPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [displayItems, setDisplayItems] = useState<DisplayMenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Fulfillment & Payment Selection
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'MOBILE_PAYMENT'>('CASH');

  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Customer Past Orders & History
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [viewingReceipt, setViewingReceipt] = useState<Order | null>(null);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getBranches();
      setBranches(data);
      if (data.length > 0) {
        setSelectedBranchId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const data = await orderService.getMyCustomerOrders();
      setMyOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchMyOrders();
  }, []);

  const fetchMenu = async (branchId: string) => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const selectedBranch = branches.find((b) => b.id === branchId);
      const branchItems = await menuService.getBranchMenu(branchId);
      const availableBranchItems = branchItems.filter((i) => i.is_available);

      if (availableBranchItems.length > 0) {
        setDisplayItems(
          availableBranchItems.map((i) => ({
            id: i.id,
            isBranchItem: true,
            branchMenuItemId: i.id,
            masterMenuItemId: i.master_menu_item_id || undefined,
            name: i.name,
            category: i.category,
            price: i.effective_price || i.price_override || 0.0,
          }))
        );
      } else {
        let masterCatalog: MasterMenuItem[] = [];
        if (selectedBranch?.tenant_id) {
          masterCatalog = await menuService.getMasterMenuByTenant(selectedBranch.tenant_id);
        } else {
          masterCatalog = await menuService.getMasterMenu();
        }

        const activeMaster = masterCatalog.filter((m) => m.is_active);
        setDisplayItems(
          activeMaster.map((m) => ({
            id: m.id,
            isBranchItem: false,
            masterMenuItemId: m.id,
            name: m.name,
            category: m.category,
            price: m.base_price,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      setDisplayItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchMenu(selectedBranchId);
      setCart([]);
    }
  }, [selectedBranchId]);

  const addToCart = (item: DisplayMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.displayItem.id === item.id);
      if (existing) {
        return prev.map((ci) => (ci.displayItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
      }
      return [...prev, { displayItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.displayItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((ci) => (ci.displayItem.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci));
      }
      return prev.filter((ci) => ci.displayItem.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((acc, ci) => acc + ci.displayItem.price * ci.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !selectedBranchId) return;
    if (fulfillmentType === 'DELIVERY' && !deliveryAddress.trim()) {
      setOrderError('Please enter a valid Delivery Street Address for home delivery.');
      return;
    }

    setIsOrdering(true);
    setOrderError(null);

    try {
      const orderPayloadItems = [];

      for (const ci of cart) {
        let branchMenuItemId = ci.displayItem.branchMenuItemId || ci.displayItem.masterMenuItemId || ci.displayItem.id;

        if (!ci.displayItem.isBranchItem && ci.displayItem.masterMenuItemId) {
          try {
            const createdBranchItem = await menuService.addBranchMenuItem({
              branch_id: selectedBranchId,
              master_menu_item_id: ci.displayItem.masterMenuItemId,
              name: ci.displayItem.name,
              category: ci.displayItem.category,
              price_override: ci.displayItem.price,
            });
            branchMenuItemId = createdBranchItem.id;
          } catch (e) {
            // Backend will auto-link if master ID is passed
          }
        }

        orderPayloadItems.push({
          branch_menu_item_id: branchMenuItemId,
          quantity: ci.quantity,
        });
      }

      const orderData = await orderService.placeCustomerOrder({
        branch_id: selectedBranchId,
        items: orderPayloadItems,
        order_type: 'CUSTOMER_ONLINE',
        delivery_address: fulfillmentType === 'DELIVERY' ? deliveryAddress.trim() : 'Dine-In / Pickup',
        delivery_notes: deliveryNotes.trim() || undefined,
      });

      setPlacedOrder(orderData);
      setCart([]);
      fetchMyOrders();
    } catch (err: any) {
      console.error('Order error:', err);
      let errMsg = 'Failed to place order. Please check inputs.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map((e: any) => e.msg || 'Validation error').join(', ');
        }
      }
      setOrderError(errMsg);
    } finally {
      setIsOrdering(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'DELIVERED');
      fetchMyOrders();
      if (placedOrder && placedOrder.id === orderId) {
        setPlacedOrder((prev) => (prev ? { ...prev, status: 'DELIVERED' } : null));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to update order status.');
    }
  };

  const handleReorder = (order: Order) => {
    if (order.branch_id && order.branch_id !== selectedBranchId) {
      setSelectedBranchId(order.branch_id);
    }

    const newCartItems: CartItem[] = [];
    order.items?.forEach((it) => {
      const existingDisplayItem = displayItems.find((d) => d.name === it.item_name_snapshot);
      if (existingDisplayItem) {
        newCartItems.push({ displayItem: existingDisplayItem, quantity: it.quantity });
      }
    });

    setCart(newCartItems);
  };

  const selectedBranchName = branches.find((b) => b.id === selectedBranchId)?.name || 'Selected Branch';
  const recentActiveOrder = myOrders.find((o) => o.status === 'PENDING' || o.status === 'IN_PREPARATION' || o.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="emerald">Customer Dashboard & Ordering</Badge>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-1">
            Browse Menu — {selectedBranchName}
          </h1>
        </div>

        {/* Branch Selector Dropdown */}
        <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
          <Store className="w-4 h-4 text-amber-700 ml-1" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="bg-transparent text-xs font-extrabold text-stone-800 focus:outline-none pr-2"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Recent Order Widget on Dashboard */}
      {recentActiveOrder && (
        <div className="bg-linear-to-r from-amber-500 via-amber-400 to-yellow-400 p-5 rounded-3xl text-stone-950 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="amber">Active Order #{recentActiveOrder.id.substring(0, 8)}</Badge>
              <span className="text-xs font-extrabold bg-stone-950 text-white px-2 py-0.5 rounded-md">
                {recentActiveOrder.status}
              </span>
            </div>
            <p className="text-xs font-bold text-stone-900 mt-1">
              {recentActiveOrder.items?.map((it) => `${it.item_name_snapshot} (x${it.quantity})`).join(', ')} — Total: ${recentActiveOrder.total_amount.toFixed(2)}
            </p>
            <p className="text-[11px] text-stone-800 mt-0.5">
              Fulfillment: {recentActiveOrder.delivery_address || 'Dine-In / Pickup'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {recentActiveOrder.status === 'COMPLETED' && (
              <Button
                size="sm"
                icon={<PackageCheck className="w-4 h-4" />}
                onClick={() => handleMarkDelivered(recentActiveOrder.id)}
                className="bg-stone-950 text-white hover:bg-stone-800"
              >
                Mark as Delivered 🚚
              </Button>
            )}
            <button
              onClick={() => setViewingReceipt(recentActiveOrder)}
              className="px-3 py-2 bg-white/80 hover:bg-white text-stone-950 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" /> Receipt Details
            </button>
          </div>
        </div>
      )}

      {orderError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-semibold">{orderError}</span>
        </div>
      )}

      {/* Main Grid: Left Branch Menu Items, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Branch Specific Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-stone-900">Branch Menu Items</h3>
            <span className="text-xs text-stone-500">{displayItems.length} item(s) available</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-stone-400">Loading branch menu items...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayItems.map((item) => {
                const inCart = cart.find((ci) => ci.displayItem.id === item.id);
                return (
                  <Card key={item.id} className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="amber">{item.category}</Badge>
                        <span className="text-base font-extrabold text-stone-900 bg-amber-100/80 px-2.5 py-0.5 rounded-lg border border-amber-200">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-stone-900 mt-1">{item.name}</h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        Available Today
                      </span>
                      {inCart ? (
                        <div className="flex items-center gap-2 bg-amber-100 px-2 py-1 rounded-xl">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-0.5 text-amber-900 hover:bg-amber-200 rounded-md"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-amber-950 px-1">{inCart.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-0.5 text-amber-900 hover:bg-amber-200 rounded-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => addToCart(item)}>
                          Add to Order
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}

              {displayItems.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-stone-200 text-xs text-stone-400">
                  No active menu items available at this branch yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart & Fulfillment Selection */}
        <div>
          <Card title="Your Order Cart" subtitle="Select delivery address and payment option">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                Your cart is empty. Click "+ Add to Order" to select items.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-stone-100">
                  {cart.map((ci) => (
                    <div key={ci.displayItem.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-stone-800">{ci.displayItem.name}</p>
                        <p className="text-[10px] text-stone-400">
                          ${ci.displayItem.price.toFixed(2)} x {ci.quantity}
                        </p>
                      </div>
                      <span className="font-extrabold text-stone-900">
                        ${(ci.displayItem.price * ci.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Fulfillment Type (Delivery vs Pickup) */}
                <div className="pt-3 border-t border-stone-100">
                  <label className="block text-xs font-bold text-stone-700 mb-2 uppercase tracking-wider">
                    Fulfillment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('DELIVERY')}
                      className={`p-2.5 rounded-xl border text-center flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        fulfillmentType === 'DELIVERY'
                          ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Home Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('PICKUP')}
                      className={`p-2.5 rounded-xl border text-center flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        fulfillmentType === 'PICKUP'
                          ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Dine-In / Pickup</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Address Field */}
                {fulfillmentType === 'DELIVERY' && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                    <label className="flex items-center gap-1 text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      Delivery Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="House / Apartment #, Street Name, City..."
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200">
                  <div className="flex justify-between items-center text-sm font-extrabold text-stone-900 mb-4">
                    <span>Total Amount</span>
                    <span className="text-xl text-amber-700">${cartTotal.toFixed(2)}</span>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    isLoading={isOrdering}
                    icon={<ShoppingBag className="w-4 h-4" />}
                    className="w-full"
                  >
                    {fulfillmentType === 'DELIVERY' ? 'Order For Delivery 🛵' : 'Confirm & Place Order ☕'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Dashboard Widget: Customer Order History & Re-Order Widget */}
      <Card title="My Order History & Past Receipts" subtitle="View all previous orders placed by your account and re-order with 1 click">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider bg-stone-50/50">
                <th className="py-3 px-4 font-bold">Order Receipt ID</th>
                <th className="py-3 px-4 font-bold">Fulfillment / Address</th>
                <th className="py-3 px-4 font-bold">Items Summary</th>
                <th className="py-3 px-4 font-bold">Total Amount</th>
                <th className="py-3 px-4 font-bold">Kitchen Status</th>
                <th className="py-3 px-4 font-bold">Date & Time</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
              {myOrders.map((o) => (
                <tr key={o.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-stone-900 font-mono">#{o.id.substring(0, 8)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-stone-800 font-semibold">
                      {o.delivery_address && o.delivery_address !== 'Dine-In / Pickup' ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate max-w-36">{o.delivery_address}</span>
                        </>
                      ) : (
                        <>
                          <Utensils className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <span>Dine-In / Pickup</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {o.items && o.items.length > 0 ? (
                      <div className="space-y-0.5">
                        {o.items.map((it) => (
                          <div key={it.id} className="text-stone-700 font-medium">
                            • {it.item_name_snapshot} (x{it.quantity})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>1 item</span>
                    )}
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
                  <td className="py-3.5 px-4 text-stone-400">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : 'Just now'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {o.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleMarkDelivered(o.id)}
                          className="p-1.5 text-emerald-950 bg-emerald-400 hover:bg-emerald-500 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </button>
                      )}
                      <button
                        onClick={() => setViewingReceipt(o)}
                        className="p-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                      <button
                        onClick={() => handleReorder(o)}
                        className="p-1.5 text-stone-950 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-order</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {myOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400">
                    You haven't placed any orders yet. Select items from the menu to place your first order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Receipt Modal */}
      <Modal isOpen={!!viewingReceipt} onClose={() => setViewingReceipt(null)} title="Order Receipt Details">
        {viewingReceipt && (
          <div className="space-y-4">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID:</span>
                <span className="font-mono font-bold text-stone-900">#{viewingReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status:</span>
                <Badge variant="emerald">{viewingReceipt.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Fulfillment:</span>
                <span className="font-bold text-stone-900">{viewingReceipt.delivery_address || 'Dine-In / Pickup'}</span>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <p className="font-bold text-stone-700 mb-1.5">Line Items:</p>
                {viewingReceipt.items?.map((it) => (
                  <div key={it.id} className="flex justify-between text-stone-600 py-0.5">
                    <span>
                      {it.item_name_snapshot} x {it.quantity}
                    </span>
                    <span className="font-bold text-stone-900">${it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between font-extrabold text-sm text-stone-900">
                <span>Total Amount:</span>
                <span className="text-amber-700">${viewingReceipt.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              {viewingReceipt.status === 'COMPLETED' && (
                <Button
                  size="sm"
                  onClick={() => {
                    handleMarkDelivered(viewingReceipt.id);
                    setViewingReceipt(null);
                  }}
                  icon={<PackageCheck className="w-4 h-4" />}
                >
                  Mark Delivered 🚚
                </Button>
              )}
              <Button variant="outline" onClick={() => setViewingReceipt(null)}>
                Close Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
