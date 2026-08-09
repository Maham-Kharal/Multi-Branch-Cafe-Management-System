import { api } from './api';
import { CreateOrderRequest, Order, OrderStatus } from '../types/order';

export const orderService = {
  // Customer Online Order
  async placeCustomerOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post<Order>('/orders/customer', data);
    return response.data;
  },

  async getMyCustomerOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/customer/my-orders');
    return response.data;
  },

  // Staff Live Branch Orders
  async getLiveBranchOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/inhouse/live');
    return response.data;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const response = await api.patch<Order>(`/orders/customer/${orderId}/status`, { status });
    return response.data;
  },
};
