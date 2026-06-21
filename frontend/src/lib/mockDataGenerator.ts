import type { Customer, Product, PurchaseHistory, CustomerTag, Interaction } from '../types';
import { subDays } from 'date-fns';

const indianStates = [
  'Maharashtra', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'Karnataka', 
  'Tamil Nadu', 'Rajasthan', 'Madhya Pradesh', 'Punjab', 'Haryana'
];

const colors = ['Red', 'Maroon', 'Pink', 'Peach', 'Navy Blue', 'Bottle Green', 'Mustard', 'Pastel Green', 'Ivory'];
const priceBuckets = ['Under 2000', '2000-5000', '5000-10000', 'Above 10000'];

const generateId = (prefix: string, index: number) => `${prefix}${String(index).padStart(4, '0')}`;
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

import ledgerData from './ledger_data.json';

// Define the shape of ledger data row based on our parsing
interface LedgerRow {
  __EMPTY?: string;
  __EMPTY_1?: string;
  __EMPTY_2?: string;
  __EMPTY_3?: string;
  __EMPTY_4?: string;
  __EMPTY_8?: string;
  __EMPTY_9?: string;
  __EMPTY_12?: string;
  __EMPTY_13?: string;
  __EMPTY_14?: string;
}

export function generateMockData() {
  const products: Product[] = [];
  const customers: Customer[] = [];
  const purchases: PurchaseHistory[] = [];
  const interactions: Interaction[] = [];
  const tags: CustomerTag[] = [
    { id: 'tag1', name: 'High Spender', category: 'Customer Segment' },
    { id: 'tag2', name: 'Prefers Red', category: 'Colors' },
    { id: 'tag3', name: 'Premium Range', category: 'Price Range' },
    { id: 'tag4', name: 'Frequent Buyer', category: 'Willingness To Buy' },
    { id: 'tag5', name: 'Bridal Wear', category: 'Categories' },
  ];

  // 1. Generate 1000 Products
  for (let i = 1; i <= 1000; i++) {
    const stock = randomInt(1, 200);
    let category: Product['category'] = 'Running Products';
    if (stock < 5) category = 'Under 5 Piece';
    else if (stock > 100) category = 'High Stock';
    
    const color = randomItem(colors);
    const getLocalImage = (col: string): string => {
      const c = col.toLowerCase();
      if (c.includes('red')) return '/images/red_lehenga.png';
      if (c.includes('maroon')) return '/images/maroon_lehenga.png';
      if (c.includes('pink') || c.includes('peach')) return '/images/pink_lehenga.png';
      if (c.includes('ivory')) return '/images/ivory_lehenga.png';
      return '/images/red_lehenga.png';
    };

    products.push({
      id: generateId('PRD', i),
      name: `Bridal Lehenga ${i}`,
      designCode: `DZ-${randomInt(1000, 9999).toString(16).toUpperCase()}`,
      imageUrl: getLocalImage(color),
      category: category,
      color: color,
      priceBucket: randomItem(priceBuckets),
      demandScore: randomInt(10, 100),
      stockQuantity: stock,
    });
  }

  // 2. Load Customers from ledger_data.json (skip first row as it contains headers)
  const rows = ledgerData as LedgerRow[];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Some names might be missing
    const rawName = row.__EMPTY_2 || `Unknown Party ${i}`;
    const name = String(rawName);
    if (!name.trim()) continue;

    // Strict requirement: Only keep SUNDRY DEBTORS in the entire CRM
    if (String(row.__EMPTY || '').toUpperCase().trim() !== 'SUNDRY DEBTORS') {
      continue;
    }

    const purchaseCount = randomInt(0, 50);
    const rev = purchaseCount * randomInt(2000, 15000);
    let segment: Customer['segment'] = 'Cold Leads';
    
    if (purchaseCount > 20) segment = 'High Ranking Parties';
    else if (purchaseCount >= 3 && purchaseCount <= 20) segment = 'Mid Revenue Parties';
    else if (purchaseCount > 0 && purchaseCount < 3) segment = 'Purchased < 3 Times';
    else if (purchaseCount === 0 && randomInt(0,1) === 1) segment = 'Lot Parties';

    customers.push({
      id: generateId('CUS', i),
      name: name,
      mobileNumber: String(row.__EMPTY_8 || (row as any).__EMPTY_6 || '+91 Not Available'),
      address: String(row.__EMPTY_14 || 'Address Not Available'),
      state: String(row.__EMPTY_13 || randomItem(indianStates)),
      businessType: String(row.__EMPTY || 'Unknown Type').toUpperCase(),
      gstNumber: String(row.__EMPTY_4 || 'Not Registered'),
      partyScore: randomInt(10, 100),
      lastContactedDate: subDays(new Date(), randomInt(0, 60)).toISOString(),
      segment,
      tags: [randomItem(tags).id],
      purchaseFrequency: purchaseCount,
      revenueGenerated: rev,
      averageOrderValue: purchaseCount > 0 ? rev / purchaseCount : 0,
    });
  }

  // 3. Generate 5000 Purchases
  for (let i = 1; i <= 5000; i++) {
    const customer = randomItem(customers);
    const product = randomItem(products);
    const quantity = randomInt(1, 10);
    const basePrice = product.priceBucket === 'Under 2000' ? 1500 : 
                      product.priceBucket === '2000-5000' ? 3500 :
                      product.priceBucket === '5000-10000' ? 7500 : 15000;

    purchases.push({
      id: generateId('PUR', i),
      customerId: customer.id,
      date: subDays(new Date(), randomInt(0, 365)).toISOString(),
      productName: product.name,
      category: product.category,
      quantity,
      amount: quantity * basePrice,
    });
  }

  // Sort purchases by date descending
  purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { products, customers, purchases, tags, interactions };
}
