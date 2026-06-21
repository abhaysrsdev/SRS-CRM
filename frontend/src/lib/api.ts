import type { Customer, Product, PurchaseHistory, CustomerTag, Interaction, SalesOrder } from '../types';

export const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000/api/v1"
  : `${window.location.origin}/api/v1`;

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  return response.json();
}

function mapPartyToCustomer(p: any): Customer {
  return {
    id: p.id,
    name: p.name,
    mobileNumber: p.mobile_number,
    address: p.address,
    state: p.state,
    businessType: p.business_type,
    gstNumber: p.gst_number,
    partyScore: p.party_score,
    lastContactedDate: p.last_contacted_date || "",
    segment: p.segment as any,
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => typeof t === 'string' ? t : t.id) : [],
    purchaseFrequency: p.purchase_frequency,
    revenueGenerated: p.revenue_generated,
    averageOrderValue: p.average_order_value,
  };
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    designCode: p.design_code,
    imageUrl: p.image_url,
    category: p.category as any,
    color: p.color,
    priceBucket: p.price_bucket,
    demandScore: p.demand_score,
    stockQuantity: p.stock_quantity,
  };
}

function mapPurchase(p: any): PurchaseHistory {
  return {
    id: p.id,
    customerId: p.party_id,
    date: p.date,
    productName: p.product_name || "",
    category: p.category || "",
    quantity: p.quantity,
    amount: p.amount,
  };
}

function mapInteraction(i: any): Interaction {
  return {
    id: i.id,
    customerId: i.party_id,
    contactDate: i.contact_date,
    narration: i.narration || "",
    discussionNotes: i.discussion_notes || "",
    followUpDate: i.follow_up_date || "",
    status: i.status as any,
  };
}

function mapTag(t: any): CustomerTag {
  return {
    id: t.id,
    name: t.name,
    category: t.category,
  };
}

export const api = {
  customers: {
    getAll: async (): Promise<Customer[]> => {
      const data = await fetchAPI<any[]>('/customers/');
      return data.map(mapPartyToCustomer);
    },
    getById: async (id: string): Promise<Customer | undefined> => {
      const data = await fetchAPI<any>(`/customers/${id}`);
      return data ? mapPartyToCustomer(data) : undefined;
    }
  },
  products: {
    getAll: async (): Promise<Product[]> => {
      const data = await fetchAPI<any[]>('/products/');
      return data.map(mapProduct);
    }
  },
  purchases: {
    getByCustomerId: async (customerId: string): Promise<PurchaseHistory[]> => {
      const data = await fetchAPI<any[]>(`/purchases/?party_id=${customerId}`);
      return data.map(mapPurchase);
    }
  },
  interactions: {
    getByCustomerId: async (customerId: string): Promise<Interaction[]> => {
      const data = await fetchAPI<any[]>(`/interactions/?party_id=${customerId}`);
      return data.map(mapInteraction);
    }
  },
  tags: {
    getAll: async (): Promise<CustomerTag[]> => {
      const data = await fetchAPI<any[]>('/tags/');
      return data.map(mapTag);
    }
  },
  salesOrders: {
    getAll: async (search?: string, customerName?: string): Promise<SalesOrder[]> => {
      let url = '/sales-orders/';
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (customerName) params.push(`customer_name=${encodeURIComponent(customerName)}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      const data = await fetchAPI<any[]>(url);
      return data.map(mapSalesOrder);
    },
    getById: async (id: string): Promise<SalesOrder | undefined> => {
      const data = await fetchAPI<any>(`/sales-orders/${id}`);
      return data ? mapSalesOrder(data) : undefined;
    }
  }
};

function mapSalesOrder(so: any): SalesOrder {
  return {
    id: so.id,
    date: so.date,
    customerName: so.customer_name,
    gstNumber: so.gst_number || "",
    broker: so.broker || "",
    orderNo: so.order_no,
    cityName: so.city_name || "",
    catalog: so.catalog || "",
    vol: so.vol || "",
    productCode: so.product_code || "",
    packing: so.packing || "",
    color: so.color || "",
    orderPcs: so.order_pcs || 0,
    dispPcs: so.disp_pcs || 0,
    balPcs: so.bal_pcs || 0,
    rate: so.rate || 0,
    amount: so.amount || 0,
    overDueDays: so.over_due_days || 0,
    dueDays: so.due_days || 0,
    salesMan: so.sales_man || "",
    createdAt: so.created_at || "",
  };
}

