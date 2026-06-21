import type { Customer, Product, PurchaseHistory } from '../types';

// ─── Recommendation List Types ───────────────────────────────────────────────
export type RecommendationType =
  | 'Recommended For Them'
  | 'Bestseller List'
  | 'Dead Stock Push'
  | 'Under 5 Piece Alert'
  | 'VIP Early Access'
  | 'Curated For You'
  | 'Trending Right Now';

export interface RecommendationList {
  type: RecommendationType;
  products: Product[];
  reason: string;
}

// ─── Helper: get customer's preferred categories and price buckets ────────────
function getCustomerPreferences(
  customer: Customer,
  purchases: PurchaseHistory[]
): { categories: Set<string>; priceBuckets: Set<string>; totalSpend: number } {
  const categories = new Set<string>();
  const priceBuckets = new Set<string>();
  let totalSpend = 0;

  for (const p of purchases) {
    if (p.customerId === customer.id) {
      categories.add(p.category);
      totalSpend += p.amount;
    }
  }

  // Map total spend to price bucket preference
  const avgAmount = purchases.filter((p) => p.customerId === customer.id).reduce(
    (sum, p) => sum + p.amount / Math.max(1, p.quantity),
    0
  ) / Math.max(1, purchases.filter((p) => p.customerId === customer.id).length);

  if (avgAmount >= 10000) priceBuckets.add('Above ₹10000');
  else if (avgAmount >= 5000) priceBuckets.add('₹5000-10000');
  else if (avgAmount >= 2000) priceBuckets.add('₹2000-5000');
  else priceBuckets.add('Under ₹2000');

  return { categories, priceBuckets, totalSpend };
}

// ─── 1. Recommended For Them ─────────────────────────────────────────────────
export function getRecommendedForCustomer(
  customer: Customer,
  purchases: PurchaseHistory[],
  products: Product[],
  limit = 10
): Product[] {
  const { categories, priceBuckets } = getCustomerPreferences(customer, purchases);

  const scored = products
    .filter((p) => p.stockQuantity > 0)
    .map((p) => {
      let score = p.demandScore;
      if (categories.size > 0 && categories.has(p.category)) score += 30;
      if (priceBuckets.size > 0 && priceBuckets.has(p.priceBucket)) score += 20;
      if (p.category === 'Bestsellers') score += 15;
      if (p.category === 'Running Products') score += 10;
      return { ...p, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  return scored;
}

// ─── 2. Bestseller List ──────────────────────────────────────────────────────
export function getBestsellerList(products: Product[], limit = 10): Product[] {
  return products
    .filter((p) => p.category === 'Bestsellers' && p.stockQuantity > 0)
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, limit);
}

// ─── 3. Dead Stock Push List ─────────────────────────────────────────────────
export function getDeadStockPushList(products: Product[], limit = 10): Product[] {
  return products
    .filter((p) => p.category === 'Dead Stock' || p.category === 'Stuck Stock')
    .sort((a, b) => b.stockQuantity - a.stockQuantity)
    .slice(0, limit);
}

// ─── 4. Under 5 Piece Alert List ────────────────────────────────────────────
export function getUnder5PieceAlerts(products: Product[], limit = 10): Product[] {
  return products
    .filter((p) => p.category === 'Under 5 Piece' || p.stockQuantity < 5)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, limit);
}

// ─── 5. VIP Early Access Catalog ─────────────────────────────────────────────
export function getVIPEarlyAccessCatalog(products: Product[], limit = 10): Product[] {
  return products
    .filter(
      (p) =>
        (p.category === 'Bestsellers' || p.category === 'Running Products') &&
        p.demandScore >= 70 &&
        p.stockQuantity > 0
    )
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, limit);
}

// ─── 6. Curated For You ──────────────────────────────────────────────────────
export function getCuratedForCustomer(
  customer: Customer,
  purchases: PurchaseHistory[],
  products: Product[],
  limit = 10
): Product[] {
  const { categories } = getCustomerPreferences(customer, purchases);

  // Pick a mix: 40% matching category + 30% bestsellers + 30% trending
  const matching = products
    .filter((p) => categories.has(p.category) && p.stockQuantity > 0)
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, Math.ceil(limit * 0.4));

  const bestsellers = products
    .filter((p) => p.category === 'Bestsellers' && !matching.find((m) => m.id === p.id))
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, Math.ceil(limit * 0.3));

  const trending = products
    .filter((p) => p.demandScore >= 75 && !matching.find((m) => m.id === p.id) && !bestsellers.find((b) => b.id === p.id))
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, Math.ceil(limit * 0.3));

  return [...matching, ...bestsellers, ...trending].slice(0, limit);
}

// ─── 7. Trending Right Now ───────────────────────────────────────────────────
export function getTrendingProducts(products: Product[], limit = 10): Product[] {
  return products
    .filter((p) => p.stockQuantity > 0)
    .sort((a, b) => {
      // Trending = high demand + reasonable stock (not dead stock)
      const aScore = a.demandScore * (a.category === 'Dead Stock' ? 0.2 : 1);
      const bScore = b.demandScore * (b.category === 'Dead Stock' ? 0.2 : 1);
      return bScore - aScore;
    })
    .slice(0, limit);
}

// ─── Get all recommendations for a customer ──────────────────────────────────
export function getAllRecommendations(
  customer: Customer,
  purchases: PurchaseHistory[],
  products: Product[],
  partyScore: number
): RecommendationList[] {
  const isVIP = partyScore >= 80;

  const lists: RecommendationList[] = [
    {
      type: 'Recommended For Them',
      products: getRecommendedForCustomer(customer, purchases, products),
      reason: 'Based on purchase history, category preference and price bucket',
    },
    {
      type: 'Bestseller List',
      products: getBestsellerList(products),
      reason: 'Top-selling products with highest demand scores',
    },
    {
      type: 'Dead Stock Push',
      products: getDeadStockPushList(products),
      reason: 'High inventory items with low sales velocity — push to clear',
    },
    {
      type: 'Under 5 Piece Alert',
      products: getUnder5PieceAlerts(products),
      reason: 'Critical low stock — act fast before these sell out',
    },
    {
      type: 'Curated For You',
      products: getCuratedForCustomer(customer, purchases, products),
      reason: 'Personalized mix based on your preferences and buying patterns',
    },
    {
      type: 'Trending Right Now',
      products: getTrendingProducts(products),
      reason: 'Fastest moving products this season',
    },
  ];

  if (isVIP) {
    lists.push({
      type: 'VIP Early Access',
      products: getVIPEarlyAccessCatalog(products),
      reason: 'Exclusive early access catalog for premium buyers',
    });
  }

  return lists;
}
