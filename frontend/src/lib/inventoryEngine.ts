// ─── Inventory Intelligence Engine ──────────────────────────────────────────

export interface InventoryItem {
  itemCode: string;
  series: string;
  rate: number;
  totalPcs: number;
  totalAmount: number;
  balancePcs: number;
  category: string;
  priceBucket: string;
  demandScore: number;
}

export interface InventoryAgingBucket {
  label: string;
  days: string;
  items: InventoryItem[];
  totalValue: number;
  totalPcs: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export interface InventoryHealthReport {
  score: number; // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  deadStockValue: number;
  stuckStockValue: number;
  overstockValue: number;
  healthyValue: number;
  totalValue: number;
  deadStockPct: number;
  stuckStockPct: number;
  criticalAlerts: string[];
  recommendations: string[];
}

// ─── Inventory Health Score ───────────────────────────────────────────────────
export function computeInventoryHealthScore(items: InventoryItem[]): InventoryHealthReport {
  if (!items.length) {
    return {
      score: 0, grade: 'F', summary: 'No inventory data',
      deadStockValue: 0, stuckStockValue: 0, overstockValue: 0, healthyValue: 0,
      totalValue: 0, deadStockPct: 0, stuckStockPct: 0,
      criticalAlerts: [], recommendations: [],
    };
  }

  const totalValue = items.reduce((s, i) => s + i.totalAmount, 0);
  const deadStock = items.filter((i) => i.category === 'Dead Stock');
  const stuckStock = items.filter((i) => i.category === 'Stuck Stock');
  const highStock = items.filter((i) => i.category === 'High Stock');
  const bestsellers = items.filter((i) => i.category === 'Bestsellers');
  const running = items.filter((i) => i.category === 'Running Products');
  const critical = items.filter((i) => i.category === 'Under 5 Piece');

  const deadStockValue = deadStock.reduce((s, i) => s + i.totalAmount, 0);
  const stuckStockValue = stuckStock.reduce((s, i) => s + i.totalAmount, 0);
  const overstockValue = highStock.reduce((s, i) => s + i.totalAmount, 0);
  const healthyValue = [...bestsellers, ...running].reduce((s, i) => s + i.totalAmount, 0);

  const deadStockPct = totalValue > 0 ? (deadStockValue / totalValue) * 100 : 0;
  const stuckStockPct = totalValue > 0 ? (stuckStockValue / totalValue) * 100 : 0;
  const overstockPct = totalValue > 0 ? (overstockValue / totalValue) * 100 : 0;
  const healthyPct = totalValue > 0 ? (healthyValue / totalValue) * 100 : 0;

  // Score formula: start at 100, deduct for bad inventory
  let score = 100;
  score -= deadStockPct * 1.5;      // Dead stock is worst
  score -= stuckStockPct * 1.0;     // Stuck stock is bad
  score -= overstockPct * 0.3;      // Overstock is a concern
  score -= (critical.length / items.length) * 50; // Critical low stock
  score += healthyPct * 0.2;        // Healthy items add back

  score = Math.min(100, Math.max(0, Math.round(score)));

  let grade: InventoryHealthReport['grade'] = 'F';
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';

  const summary =
    score >= 85 ? 'Excellent inventory health — most products are active movers' :
    score >= 70 ? 'Good health — minor dead stock concerns' :
    score >= 55 ? 'Moderate — significant stuck/dead stock needs attention' :
    score >= 40 ? 'Poor — urgent clearance action required for dead stock' :
    'Critical — major inventory issues, immediate action needed';

  const criticalAlerts: string[] = [];
  if (deadStockPct > 20) criticalAlerts.push(`🔴 ${deadStockPct.toFixed(0)}% of inventory by value is Dead Stock (₹${(deadStockValue / 100000).toFixed(1)}L)`);
  if (stuckStockPct > 15) criticalAlerts.push(`🟠 ${stuckStockPct.toFixed(0)}% is Stuck Stock — low movement detected`);
  if (critical.length > 0) criticalAlerts.push(`🚨 ${critical.length} SKUs are critically low (< 5 pieces) — reorder immediately`);
  if (overstockPct > 30) criticalAlerts.push(`📦 ${overstockPct.toFixed(0)}% of stock is overstocked — review pricing`);

  const recommendations: string[] = [];
  if (deadStock.length > 0) recommendations.push(`Run a clearance campaign for ${deadStock.length} dead stock items`);
  if (stuckStock.length > 0) recommendations.push(`Create bundled offers for ${stuckStock.length} stuck stock items`);
  if (critical.length > 0) recommendations.push(`Reorder ${critical.length} critical items immediately`);
  if (bestsellers.length > 0) recommendations.push(`Promote top ${Math.min(5, bestsellers.length)} bestsellers actively in WhatsApp campaigns`);

  return {
    score, grade, summary,
    deadStockValue, stuckStockValue, overstockValue, healthyValue, totalValue,
    deadStockPct, stuckStockPct,
    criticalAlerts, recommendations,
  };
}

// ─── Inventory Aging Analysis ─────────────────────────────────────────────────
// Since we don't have actual purchase dates per item in the static data,
// we approximate aging using the balance/total ratio and demand score
export function computeInventoryAging(items: InventoryItem[]): InventoryAgingBucket[] {
  const buckets: InventoryAgingBucket[] = [
    { label: 'Active (0–30 days)', days: '0-30', items: [], totalValue: 0, totalPcs: 0, risk: 'low' },
    { label: 'Slow (31–60 days)', days: '31-60', items: [], totalValue: 0, totalPcs: 0, risk: 'medium' },
    { label: 'Aging (61–90 days)', days: '61-90', items: [], totalValue: 0, totalPcs: 0, risk: 'high' },
    { label: 'Dead (90+ days)', days: '90+', items: [], totalValue: 0, totalPcs: 0, risk: 'critical' },
  ];

  for (const item of items) {
    const balanceRatio = item.totalPcs > 0 ? item.balancePcs / item.totalPcs : 0;
    const agingScore = (1 - item.demandScore / 100) * 100 + balanceRatio * 50;

    let bucket: InventoryAgingBucket;
    if (item.category === 'Dead Stock' || agingScore > 90) {
      bucket = buckets[3];
    } else if (item.category === 'Stuck Stock' || agingScore > 60) {
      bucket = buckets[2];
    } else if (item.category === 'High Stock' || agingScore > 30) {
      bucket = buckets[1];
    } else {
      bucket = buckets[0];
    }

    bucket.items.push(item);
    bucket.totalValue += item.totalAmount;
    bucket.totalPcs += item.totalPcs;
  }

  return buckets;
}

// ─── Fast Moving Products ─────────────────────────────────────────────────────
export function getFastMovingProducts(items: InventoryItem[], limit = 20): InventoryItem[] {
  return items
    .filter((i) => i.demandScore >= 70 && i.category !== 'Dead Stock')
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, limit);
}

// ─── Low Stock Alerts ─────────────────────────────────────────────────────────
export function getLowStockAlerts(items: InventoryItem[], threshold = 5): InventoryItem[] {
  return items
    .filter((i) => i.totalPcs < threshold || i.category === 'Under 5 Piece')
    .sort((a, b) => a.totalPcs - b.totalPcs);
}

// ─── Dead Stock Detection ─────────────────────────────────────────────────────
export function getDeadStockItems(items: InventoryItem[]): InventoryItem[] {
  return items
    .filter((i) => i.category === 'Dead Stock')
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

// ─── Stuck Stock Detection ────────────────────────────────────────────────────
export function getStuckStockItems(items: InventoryItem[]): InventoryItem[] {
  return items
    .filter((i) => i.category === 'Stuck Stock')
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

// ─── Overstock Detection ──────────────────────────────────────────────────────
export function getOverstockItems(items: InventoryItem[], minPcs = 100): InventoryItem[] {
  return items
    .filter((i) => i.totalPcs >= minPcs || i.category === 'High Stock')
    .sort((a, b) => b.totalPcs - a.totalPcs);
}
