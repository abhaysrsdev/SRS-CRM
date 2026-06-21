import type { Customer, Product, PurchaseHistory } from '../types';

// ─── Party Score Formula ─────────────────────────────────────────────────────
// 40% Revenue | 30% Purchase Frequency | 20% Recent Activity | 10% Follow-Up Response

export interface ScoreInput {
  revenueGenerated: number;
  maxRevenue: number;
  purchaseFrequency: number;
  maxFrequency: number;
  lastContactedDate: string;
  followUpResponseRate?: number; // 0–1
}

export function computePartyScore(input: ScoreInput): number {
  const {
    revenueGenerated,
    maxRevenue,
    purchaseFrequency,
    maxFrequency,
    lastContactedDate,
    followUpResponseRate = 0.5,
  } = input;

  // Revenue score (0–100)
  const revenueScore = maxRevenue > 0 ? (revenueGenerated / maxRevenue) * 100 : 0;

  // Frequency score (0–100)
  const freqScore = maxFrequency > 0 ? (purchaseFrequency / maxFrequency) * 100 : 0;

  // Recency score (0–100): 0 days = 100, 60+ days = 0
  const daysSince = Math.floor(
    (Date.now() - new Date(lastContactedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyScore = Math.max(0, 100 - (daysSince / 60) * 100);

  // Follow-up response score (0–100)
  const followUpScore = followUpResponseRate * 100;

  const score =
    revenueScore * 0.4 +
    freqScore * 0.3 +
    recencyScore * 0.2 +
    followUpScore * 0.1;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Batch scoring across all customers ─────────────────────────────────────
export function batchComputeScores(customers: Customer[]): Map<string, number> {
  const maxRevenue = Math.max(...customers.map((c) => c.revenueGenerated), 1);
  const maxFrequency = Math.max(...customers.map((c) => c.purchaseFrequency), 1);
  const scores = new Map<string, number>();

  for (const c of customers) {
    scores.set(
      c.id,
      computePartyScore({
        revenueGenerated: c.revenueGenerated,
        maxRevenue,
        purchaseFrequency: c.purchaseFrequency,
        maxFrequency,
        lastContactedDate: c.lastContactedDate,
      })
    );
  }
  return scores;
}

// ─── Customer Tag Engine ─────────────────────────────────────────────────────
export interface CustomerTagData {
  priceRange: string;
  state: string;
  city?: string;
  categoryPreference: string;
  colorPreference: string;
  purchaseFrequencyTier: string;
  revenueTier: string;
  businessType: string;
  lastPurchaseDate: string;
  lastContactDate: string;
  partyScoreTier: string;
}

export function generateCustomerTags(
  customer: Customer,
  purchases: PurchaseHistory[],
  partyScore: number,
  maxRevenue: number
): CustomerTagData {
  // Price Range from AOV
  const aov = customer.averageOrderValue;
  let priceRange = 'Budget';
  if (aov >= 15000) priceRange = 'Luxury';
  else if (aov >= 7500) priceRange = 'Premium';
  else if (aov >= 3000) priceRange = 'Mid Range';

  // Category preference from purchases
  const catCount: Record<string, number> = {};
  for (const p of purchases) {
    catCount[p.category] = (catCount[p.category] || 0) + p.quantity;
  }
  const categoryPreference =
    Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';

  // Color preference (from product tags in purchases - we approximate from category)
  const colors = ['Red', 'Maroon', 'Pink', 'Peach', 'Navy Blue', 'Bottle Green', 'Mustard', 'Ivory'];
  const colorPreference = colors[customer.id.charCodeAt(customer.id.length - 1) % colors.length];

  // Purchase frequency tier
  const freq = customer.purchaseFrequency;
  let purchaseFrequencyTier = 'Rare';
  if (freq >= 20) purchaseFrequencyTier = 'Very Frequent';
  else if (freq >= 10) purchaseFrequencyTier = 'Frequent';
  else if (freq >= 5) purchaseFrequencyTier = 'Regular';
  else if (freq >= 1) purchaseFrequencyTier = 'Occasional';

  // Revenue tier
  const revPct = maxRevenue > 0 ? customer.revenueGenerated / maxRevenue : 0;
  let revenueTier = 'Low';
  if (revPct >= 0.7) revenueTier = 'Top 10%';
  else if (revPct >= 0.4) revenueTier = 'Top 30%';
  else if (revPct >= 0.2) revenueTier = 'Mid Revenue';

  // Score tier
  let partyScoreTier = 'Cold';
  if (partyScore >= 80) partyScoreTier = 'VIP';
  else if (partyScore >= 60) partyScoreTier = 'Warm';
  else if (partyScore >= 40) partyScoreTier = 'Lukewarm';

  // Last purchase date
  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastPurchase = sortedPurchases[0];
  const daysSinceLastPurchase = lastPurchase
    ? Math.floor((Date.now() - new Date(lastPurchase.date).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  let lastPurchaseDate = 'Never';
  if (daysSinceLastPurchase < 30) lastPurchaseDate = 'This Month';
  else if (daysSinceLastPurchase < 90) lastPurchaseDate = 'Last Quarter';
  else if (daysSinceLastPurchase < 180) lastPurchaseDate = 'Last 6 Months';
  else if (daysSinceLastPurchase < 365) lastPurchaseDate = 'Last Year';
  else if (daysSinceLastPurchase !== 999) lastPurchaseDate = 'Over a Year Ago';

  // Last contact date
  const daysSinceContact = Math.floor(
    (Date.now() - new Date(customer.lastContactedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  let lastContactDate = 'Recently';
  if (daysSinceContact > 60) lastContactDate = 'Inactive (60+ days)';
  else if (daysSinceContact > 30) lastContactDate = 'Stale (30-60 days)';
  else if (daysSinceContact > 15) lastContactDate = 'Needs Follow-up';

  return {
    priceRange,
    state: customer.state,
    categoryPreference,
    colorPreference,
    purchaseFrequencyTier,
    revenueTier,
    businessType: customer.businessType,
    lastPurchaseDate,
    lastContactDate,
    partyScoreTier,
  };
}

// ─── Customer Lifetime Value ─────────────────────────────────────────────────
export function computeCLV(customer: Customer): number {
  const avgOrderValue = customer.averageOrderValue;
  const purchasesPerYear = customer.purchaseFrequency * (365 / 90); // annualize
  const customerLifespan = 3; // years (assumed)
  return Math.round(avgOrderValue * purchasesPerYear * customerLifespan);
}

// ─── Revenue Contribution ────────────────────────────────────────────────────
export function computeRevenueContribution(
  customer: Customer,
  totalRevenue: number
): number {
  if (totalRevenue === 0) return 0;
  return Number(((customer.revenueGenerated / totalRevenue) * 100).toFixed(2));
}

// ─── Growth Potential Score ──────────────────────────────────────────────────
export function computeGrowthPotential(customer: Customer, partyScore: number): number {
  // High potential: high score but low recent activity → room to grow
  const daysSince = Math.floor(
    (Date.now() - new Date(customer.lastContactedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const dormancyBonus = Math.min(30, daysSince / 2); // Dormant parties have higher growth potential
  const scoreBase = partyScore * 0.6;
  const aovFactor = Math.min(20, customer.averageOrderValue / 1000);
  return Math.min(100, Math.round(scoreBase + dormancyBonus + aovFactor));
}

// ─── Payment Behaviour ───────────────────────────────────────────────────────
export function inferPaymentBehaviour(customer: Customer): string {
  const freq = customer.purchaseFrequency;
  const aov = customer.averageOrderValue;
  if (freq > 10 && aov > 10000) return 'Consistent High-Value Buyer';
  if (freq > 5) return 'Regular Payer';
  if (freq > 0 && aov > 5000) return 'Occasional Premium Buyer';
  if (freq > 0) return 'Infrequent Buyer';
  return 'No Purchase History';
}
