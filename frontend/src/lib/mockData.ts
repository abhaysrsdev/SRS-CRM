import type { Customer, Interaction, PurchaseHistory, Product, CustomerTag } from '../types';

export const mockTags: CustomerTag[] = [
  { id: 't1', name: 'High Spender', category: 'Customer Segment' },
  { id: 't2', name: 'Premium Price', category: 'Price Range' },
  { id: 't3', name: 'Maharashtra', category: 'State' },
  { id: 't4', name: 'Gujarat', category: 'State' },
  { id: 't5', name: 'Blue/Black Preference', category: 'Colors' },
];

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Acme Traders',
    mobileNumber: '+91 9876543210',
    address: '123 Market Road, Mumbai',
    state: 'Maharashtra',
    businessType: 'Retailer',
    gstNumber: '27AABCU9603R1ZX',
    partyScore: 92, // Green
    lastContactedDate: '2026-05-28T10:00:00Z',
    segment: 'High Ranking Parties',
    tags: ['t1', 't2', 't3'],
    purchaseFrequency: 15,
    revenueGenerated: 250000,
    averageOrderValue: 16666,
  },
  {
    id: 'c2',
    name: 'Global Wholesale',
    mobileNumber: '+91 8765432109',
    address: '45 Ring Road, Surat',
    state: 'Gujarat',
    businessType: 'Wholesaler',
    gstNumber: '24BBBCU9603R1ZX',
    partyScore: 45, // Red
    lastContactedDate: '2026-04-10T10:00:00Z',
    segment: 'Cold Leads',
    tags: ['t4'],
    purchaseFrequency: 2,
    revenueGenerated: 15000,
    averageOrderValue: 7500,
  },
  {
    id: 'c3',
    name: 'Elite Boutique',
    mobileNumber: '+91 7654321098',
    address: '7th Avenue, Pune',
    state: 'Maharashtra',
    businessType: 'Boutique',
    gstNumber: '27CCCU9603R1ZX',
    partyScore: 75, // Blue
    lastContactedDate: '2026-06-01T10:00:00Z',
    segment: 'Mid Revenue Parties',
    tags: ['t3', 't5'],
    purchaseFrequency: 8,
    revenueGenerated: 85000,
    averageOrderValue: 10625,
  },
];

export const mockInteractions: Interaction[] = [
  {
    id: 'i1',
    customerId: 'c1',
    contactDate: '2026-05-28T10:00:00Z',
    narration: 'Called regarding new festive collection. Very interested.',
    discussionNotes: 'Send catalog on WhatsApp. Looking for premium range.',
    followUpDate: '2026-06-05T10:00:00Z',
    status: 'Completed',
  }
];

export const mockPurchases: PurchaseHistory[] = [
  { id: 'p1', customerId: 'c1', date: '2026-05-20T10:00:00Z', productName: 'Premium Silk Saree', category: 'Sarees', quantity: 50, amount: 75000 },
  { id: 'p2', customerId: 'c1', date: '2026-04-15T10:00:00Z', productName: 'Cotton Kurti Set', category: 'Kurtis', quantity: 100, amount: 50000 },
  { id: 'p3', customerId: 'c3', date: '2026-05-25T10:00:00Z', productName: 'Designer Lehenga', category: 'Lehengas', quantity: 10, amount: 35000 },
];

export const mockProducts: Product[] = [
  { id: 'prod1', name: 'Premium Silk Saree', category: 'Bestsellers', color: 'Red', priceBucket: 'Premium', demandScore: 95, stockQuantity: 200, designCode: 'DS001', imageUrl: '' },
  { id: 'prod2', name: 'Cotton Kurti Set', category: 'Running Products', color: 'Blue', priceBucket: 'Mid', demandScore: 70, stockQuantity: 500, designCode: 'DS002', imageUrl: '' },
  { id: 'prod3', name: 'Designer Lehenga', category: 'High Stock', color: 'Pink', priceBucket: 'Premium', demandScore: 60, stockQuantity: 1000, designCode: 'DS003', imageUrl: '' },
  { id: 'prod4', name: 'Winter Jacket 2024', category: 'Dead Stock', color: 'Black', priceBucket: 'Mid', demandScore: 10, stockQuantity: 400, designCode: 'DS004', imageUrl: '' },
  { id: 'prod5', name: 'Exclusive Velvet Gown', category: 'Under 5 Piece', color: 'Maroon', priceBucket: 'Luxury', demandScore: 85, stockQuantity: 3, designCode: 'DS005', imageUrl: '' },
];
