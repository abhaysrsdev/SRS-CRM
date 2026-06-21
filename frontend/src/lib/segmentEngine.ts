import type { Customer, CustomerSegment } from '../types';

// ─── Segment Rules (configurable) ────────────────────────────────────────────
export interface SegmentRules {
  vipMinScore: number;          // default: 85
  vipMinRevenue: number;        // default: 500000 (₹5L)
  highRankingMinScore: number;  // default: 70
  newCustomerMaxDays: number;   // default: 90 (joined within last 90 days)
  newCustomerMaxPurchases: number; // default: 1
  inactiveMinDays: number;      // default: 60
  coldLeadMinDays: number;      // default: 30
  coldLeadMaxPurchases: number; // default: 2
  midRevenueMin: number;        // default: 50000 (₹50k)
  midRevenueMax: number;        // default: 500000 (₹5L)
}

export const DEFAULT_SEGMENT_RULES: SegmentRules = {
  vipMinScore: 85,
  vipMinRevenue: 500000,
  highRankingMinScore: 70,
  newCustomerMaxDays: 90,
  newCustomerMaxPurchases: 1,
  inactiveMinDays: 60,
  coldLeadMinDays: 30,
  coldLeadMaxPurchases: 2,
  midRevenueMin: 50000,
  midRevenueMax: 500000,
};

// ─── Extended segment types (superset of existing CustomerSegment) ───────────
export type ExtendedSegment =
  | CustomerSegment
  | 'VIP Buyers'
  | 'Inactive Customers'
  | 'New Customers'
  | 'All Parties';

// ─── Classify a single customer ──────────────────────────────────────────────
export function classifyCustomer(
  customer: Customer,
  partyScore: number,
  rules: SegmentRules = DEFAULT_SEGMENT_RULES
): ExtendedSegment {
  const daysSinceContact = Math.floor(
    (Date.now() - new Date(customer.lastContactedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // VIP: high score OR high revenue
  if (partyScore >= rules.vipMinScore || customer.revenueGenerated >= rules.vipMinRevenue) {
    return 'VIP Buyers';
  }

  // New Customer
  if (
    customer.purchaseFrequency <= rules.newCustomerMaxPurchases &&
    daysSinceContact <= rules.newCustomerMaxDays
  ) {
    return 'New Customers';
  }

  // Inactive: not contacted in 60+ days
  if (daysSinceContact >= rules.inactiveMinDays && customer.purchaseFrequency === 0) {
    return 'Inactive Customers';
  }

  // Lot Parties: zero purchases
  if (customer.purchaseFrequency === 0) {
    return 'Lot Parties';
  }

  // Cold Leads: not contacted in 30+ days + low purchases
  if (
    daysSinceContact >= rules.coldLeadMinDays &&
    customer.purchaseFrequency <= rules.coldLeadMaxPurchases
  ) {
    return 'Cold Leads';
  }

  // Purchased < 3 Times
  if (customer.purchaseFrequency < 3) {
    return 'Purchased < 3 Times';
  }

  // High Ranking: high score
  if (partyScore >= rules.highRankingMinScore) {
    return 'High Ranking Parties';
  }

  // Mid Revenue
  if (
    customer.revenueGenerated >= rules.midRevenueMin &&
    customer.revenueGenerated <= rules.midRevenueMax
  ) {
    return 'Mid Revenue Parties';
  }

  // Default fallback
  return 'Mid Revenue Parties';
}

// ─── Get count per segment ───────────────────────────────────────────────────
export function getSegmentCounts(
  customers: Customer[],
  scores: Map<string, number>,
  rules: SegmentRules = DEFAULT_SEGMENT_RULES
): Record<ExtendedSegment, number> {
  const counts: Record<string, number> = {
    'All Parties': customers.length,
    'VIP Buyers': 0,
    'High Ranking Parties': 0,
    'New Customers': 0,
    'Inactive Customers': 0,
    'Cold Leads': 0,
    'Purchased < 3 Times': 0,
    'Mid Revenue Parties': 0,
    'Lot Parties': 0,
  };

  for (const c of customers) {
    const score = scores.get(c.id) ?? c.partyScore;
    const seg = classifyCustomer(c, score, rules);
    counts[seg] = (counts[seg] || 0) + 1;
  }

  return counts as Record<ExtendedSegment, number>;
}

// ─── Filter customers by segment ─────────────────────────────────────────────
export function filterBySegment(
  customers: Customer[],
  segment: ExtendedSegment,
  scores: Map<string, number>,
  rules: SegmentRules = DEFAULT_SEGMENT_RULES
): Customer[] {
  if (segment === 'All Parties') return customers;

  return customers.filter((c) => {
    const score = scores.get(c.id) ?? c.partyScore;
    return classifyCustomer(c, score, rules) === segment;
  });
}
