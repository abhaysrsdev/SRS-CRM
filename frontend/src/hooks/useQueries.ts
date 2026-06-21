import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: api.customers.getAll,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: api.products.getAll,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.customers.getById(id),
    enabled: !!id,
  });
}

export function usePurchases(customerId: string) {
  return useQuery({
    queryKey: ['purchases', customerId],
    queryFn: () => api.purchases.getByCustomerId(customerId),
    enabled: !!customerId,
  });
}

export function useInteractions(customerId: string) {
  return useQuery({
    queryKey: ['interactions', customerId],
    queryFn: () => api.interactions.getByCustomerId(customerId),
    enabled: !!customerId,
  });
}

export function useSalesOrders(search?: string, customerName?: string) {
  return useQuery({
    queryKey: ['salesOrders', search, customerName],
    queryFn: () => api.salesOrders.getAll(search, customerName),
  });
}

