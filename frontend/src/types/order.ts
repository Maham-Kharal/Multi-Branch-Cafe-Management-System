export type OrderType = 'CUSTOMER_ONLINE' | 'INHOUSE_POS';
export type OrderStatus = 'PENDING' | 'IN_PREPARATION' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  branch_menu_item_id?: string | null;
  item_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  branch_id: string;
  customer_id?: string | null;
  staff_id?: string | null;
  order_type: OrderType;
  status: OrderStatus;
  total_amount: number;
  created_at?: string;
  items: OrderItem[];
}

export interface OrderItemCreate {
  branch_menu_item_id: string;
  quantity: number;
}

export interface CreateOrderRequest {
  branch_id: string;
  items: OrderItemCreate[];
  order_type?: OrderType;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
