/* eslint-disable */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Package, AlertTriangle, TrendingUp, Search, ShoppingBag, 
         Star, Flame, PackageX, Box, ChevronDown, ChevronUp, BarChart2, Tag, Activity } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { motion, AnimatePresence } from 'framer-motion';
import inventoryRaw from '../lib/inventory_data.json';
import {
  computeInventoryHealthScore, computeInventoryAging,
  getFastMovingProducts, getLowStockAlerts, getDeadStockItems, getStuckStockItems,
  type InventoryItem as EngineItem,
} from '../lib/inventoryEngine';

// ─── Types ────────────────────────────────────────────────────────────────────
interface InventoryItem {
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

// ─── Constants ────────────────────────────────────────────────────────────────
const CAT_META: Record<string, { color: string; bg: string; border: string; icon: any; desc: string; rule: string }> = {
  'Bestsellers':      { color: '#10b981', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: Star,      desc: 'Top 20% revenue items',      rule: 'High revenue + volume ≥ 10 pcs' },
  'Running Products': { color: '#3b82f6', bg: 'bg-blue-50',     border: 'border-blue-200',    icon: TrendingUp, desc: 'Consistent regular sellers',  rule: '10-100 pcs stock, active movement' },
  'High Stock':       { color: '#f59e0b', bg: 'bg-amber-50',    border: 'border-amber-200',   icon: Box,        desc: 'Overstocked items',           rule: 'Total pcs > 100, review pricing' },
  'Stuck Stock':      { color: '#f97316', bg: 'bg-orange-50',   border: 'border-orange-200',  icon: AlertTriangle, desc: 'Low movement',           rule: 'pcs 5-9, minimal turnover' },
  'Dead Stock':       { color: '#ef4444', bg: 'bg-rose-50',     border: 'border-rose-200',    icon: PackageX,   desc: 'Zero/negligible movement',    rule: 'Balance ≥ 50% of opening stock' },
  'Under 5 Piece':    { color: '#8b5cf6', bg: 'bg-purple-50',   border: 'border-purple-200',  icon: AlertTriangle, desc: 'Critical low stock alert', rule: 'Total pcs < 5 units' },
};

const SERIES_COLORS: Record<string, string> = {
  'Crop Top':     '#ec4899',
  'Gown':         '#8b5cf6',
  'FISH CUT':     '#06b6d4',
  'INDO WESTERN': '#f59e0b',
  'Lehenga':      '#10b981',
  'Drape Sarees': '#f43f5e',
  'Plazo':        '#6366f1',
  'Classic':      '#64748b',
};

const ALL_SERIES = ['All', 'Crop Top', 'Gown', 'FISH CUT', 'INDO WESTERN', 'Lehenga', 'Drape Sarees', 'Plazo', 'Classic'];
const ALL_CATS   = ['All', 'Bestsellers', 'Running Products', 'High Stock', 'Stuck Stock', 'Dead Stock', 'Under 5 Piece'];
const ALL_PRICES = ['All', 'Under ₹2000', '₹2000-5000', '₹5000-10000', 'Above ₹10000'];

const getTargetSection = (category: string): string => {
  switch (category) {
    case 'Bestsellers':      return 'VIP Showcase';
    case 'Running Products': return 'Main Gallery';
    case 'High Stock':       return 'Promo & Bundles';
    case 'Stuck Stock':      return 'Targeted Clearance';
    case 'Dead Stock':       return 'Clearance Corner';
    case 'Under 5 Piece':    return 'Reorder Desk';
    default:                 return 'General Stock';
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
      className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-soft flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left"
    >
      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0`} style={{ background: color + '18' }}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color }} />
      </div>
      <div className="min-w-0 w-full">
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mt-0.5 truncate">{value}</h3>
        {sub && <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 leading-tight">{sub}</p>}
      </div>
    </motion.div>
  );
}

function CategoryRuleBadge({ cat }: { cat: string }) {
  const m = CAT_META[cat];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${m.bg} ${m.border}`} style={{ color: m.color }}>
      <m.icon className="h-3 w-3" />
      {cat}
    </span>
  );
}

// Custom Pie label
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function InventoryInsights() {
  const items = inventoryRaw as InventoryItem[];

  const [searchQ, setSearchQ]     = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterSeries, setFilterSeries] = useState('All');
  const [filterPrice, setFilterPrice]   = useState('All');
  const [sortBy, setSortBy]       = useState<'amount' | 'pcs' | 'rate' | 'demand'>('amount');
  const [sortDesc, setSortDesc]   = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview'|'rules'|'aging'>('overview');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // ── Aggregated Metrics ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalItems    = items.length;
    const totalPcs      = items.reduce((s, i) => s + i.totalPcs, 0);
    const totalAmount   = items.reduce((s, i) => s + i.totalAmount, 0);
    const bestsellers   = items.filter(i => i.category === 'Bestsellers').length;
    const deadStock     = items.filter(i => i.category === 'Dead Stock').length;
    const critical      = items.filter(i => i.category === 'Under 5 Piece').length;
    const avgRate       = Math.round(items.reduce((s, i) => s + i.rate, 0) / items.length);
    return { totalItems, totalPcs, totalAmount, bestsellers, deadStock, critical, avgRate };
  }, [items]);

  // ── Pie Chart Data ──────────────────────────────────────────────────────────
  const catPieData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => { map[i.category] = (map[i.category] || 0) + i.totalAmount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [items]);

  const seriesPieData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => { 
      const s = i.series || 'Classic';
      map[s] = (map[s] || 0) + i.totalAmount; 
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 8);
  }, [items]);

  // ── Bar Chart — Top 15 items by Amount ─────────────────────────────────────
  const top15Bar = useMemo(() => 
    [...items].sort((a,b) => b.totalAmount - a.totalAmount).slice(0,15).map(i => ({
      code: `#${i.itemCode}`,
      amount: Math.round(i.totalAmount / 1000),
      pcs: i.totalPcs,
      color: CAT_META[i.category]?.color || '#64748b'
    })),
  [items]);

  // ── Price Distribution ──────────────────────────────────────────────────────
  const priceBar = useMemo(() => {
    const buckets = { 'Under ₹2000': 0, '₹2000-5000': 0, '₹5000-10000': 0, 'Above ₹10000': 0 };
    items.forEach(i => { buckets[i.priceBucket as keyof typeof buckets] = (buckets[i.priceBucket as keyof typeof buckets] || 0) + 1; });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [items]);

  // ── Filtered Table Data ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = items;
    if (filterCat !== 'All') result = result.filter(i => i.category === filterCat);
    if (filterSeries !== 'All') result = result.filter(i => (i.series || 'Classic') === filterSeries);
    if (filterPrice !== 'All') result = result.filter(i => i.priceBucket === filterPrice);
    if (searchQ) result = result.filter(i => i.itemCode.includes(searchQ) || (i.series || '').toLowerCase().includes(searchQ.toLowerCase()));
    result = [...result].sort((a, b) => {
      const key = sortBy === 'amount' ? 'totalAmount' : sortBy === 'pcs' ? 'totalPcs' : sortBy === 'demand' ? 'demandScore' : 'rate';
      return sortDesc ? b[key] - a[key] : a[key] - b[key];
    });
    return result;
  }, [items, filterCat, filterSeries, filterPrice, searchQ, sortBy, sortDesc]);

  const cycleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDesc(d => !d);
    else { setSortBy(field); setSortDesc(true); }
  };

  return (
    <div className="min-h-screen bg-brand-bg overflow-y-auto">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 py-5 flex items-center justify-between gap-6 flex-wrap">
          <FadeIn>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Inventory Intelligence</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-bold text-amber-600">{metrics.totalItems}</span> unique items · 
                  <span className="font-bold text-emerald-600 ml-1">{metrics.totalPcs.toLocaleString()}</span> total pieces · 
                  <span className="font-bold text-indigo-600 ml-1">₹{(metrics.totalAmount/10000000).toFixed(2)} Cr</span> value
                </p>
              </div>
            </div>
          </FadeIn>
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide shrink-0">
            {(['overview','rules','aging'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize whitespace-nowrap shrink-0 ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab === 'overview' ? '📊 Overview' : tab === 'rules' ? '📋 Rules' : '🔬 Aging Analysis'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        
          {/* ════════════════════ TAB: OVERVIEW ════════════════════════════════ */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

              {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StaggerItem><KPICard label="Total SKUs"        value={metrics.totalItems}       icon={Package}     color="#6366f1" /></StaggerItem>
                <StaggerItem><KPICard label="Total Pieces"      value={metrics.totalPcs.toLocaleString()} icon={Box} color="#3b82f6" /></StaggerItem>
                <StaggerItem><KPICard label="Total Value"       value={`₹${(metrics.totalAmount/10000000).toFixed(2)}Cr`} icon={BarChart2} color="#10b981" /></StaggerItem>
                <StaggerItem><KPICard label="🔥 Bestsellers"    value={metrics.bestsellers}       icon={Star}        color="#f59e0b" sub="Top revenue movers" /></StaggerItem>
                <StaggerItem><KPICard label="⚠️ Dead Stock"     value={metrics.deadStock}         icon={PackageX}    color="#ef4444" sub="Needs clearance action" /></StaggerItem>
                <StaggerItem><KPICard label="🚨 Critical < 5"  value={metrics.critical}          icon={AlertTriangle} color="#8b5cf6" sub="Reorder immediately" /></StaggerItem>
              </StaggerContainer>

              {/* ── 5 Category Quick-Access Panel ─────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-slate-900">Product Purchase History Tags</h3>
                  <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-bold">Reviewed and Updated</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {[
                    { cat: 'Bestsellers',      emoji: '⭐', label: 'Bestsellers', sub: 'Top 30 (duration - last)', color: '#10b981', bg: 'from-emerald-500 to-emerald-700', pcs: '5 pcs' },
                    { cat: 'Running Products', emoji: '🔵', label: 'Running Products', sub: '(20-100)',              color: '#3b82f6', bg: 'from-blue-500 to-blue-700',    pcs: '6 pcs' },
                    { cat: 'High Stock',       emoji: '📦', label: 'High Stock Products', sub: '',                  color: '#f59e0b', bg: 'from-amber-500 to-amber-700',  pcs: '3 pcs' },
                    { cat: 'Stuck Stock',      emoji: '⏸️', label: 'Stuck Stock', sub: '(aged stock - stocked)',    color: '#f97316', bg: 'from-orange-500 to-orange-700', pcs: '' },
                    { cat: 'Dead Stock',       emoji: '🔴', label: 'Dead Stock Possibility', sub: 'Stock (sale of)', color: '#ef4444', bg: 'from-rose-500 to-rose-700',   pcs: '8' },
                  ].map(({ cat, emoji, label, sub, color, bg }) => {
                    const count = items.filter(i => i.category === cat).length;
                    const totalVal = items.filter(i => i.category === cat).reduce((s, i) => s + i.totalAmount, 0);
                    const isActive = selectedCat === cat;
                    return (
                      <motion.button
                        key={cat}
                        onClick={() => setSelectedCat(isActive ? null : cat)}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative overflow-hidden rounded-3xl p-5 text-left transition-all shadow-md border-2 ${
                          isActive ? 'border-white ring-4 shadow-xl' : 'border-transparent'
                        }`}
                        style={isActive ? { boxShadow: `0 8px 30px ${color}40`, '--tw-ring-color': color } as any : {}}
                      >
                        {/* Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-90`} />
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -mr-8 -mt-8" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-black/10 -ml-4 -mb-4" />

                        <div className="relative z-10">
                          <div className="text-3xl mb-3">{emoji}</div>
                          <h4 className="font-black text-white text-sm leading-tight mb-1">{label}</h4>
                          {sub && <p className="text-white/70 text-[10px] font-medium mb-3">{sub}</p>}
                          <div className="flex items-end justify-between mt-3 flex-wrap gap-4">
                            <div>
                              <div className="text-2xl font-black text-white">{count}</div>
                              <div className="text-white/70 text-[10px] font-bold uppercase">SKUs</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-white">₹{(totalVal/100000).toFixed(1)}L</div>
                              <div className="text-white/60 text-[10px] font-bold">Value</div>
                            </div>
                          </div>
                          {isActive && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 bg-white/20 rounded-full px-3 py-1 text-center">
                              <span className="text-white text-[10px] font-black">▼ Viewing list</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* ── Item List Drawer ──────────────────────────────────────── */}
                <AnimatePresence>
                  {selectedCat && (() => {
                    const catItems = items
                      .filter(i => i.category === selectedCat)
                      .sort((a, b) => b.totalAmount - a.totalAmount);
                    const meta = CAT_META[selectedCat];
                    return (
                      <motion.div
                        key={selectedCat}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                          {/* Drawer Header */}
                          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-wrap gap-4" style={{ background: meta?.color + '10' }}>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: meta?.color + '20' }}>
                                {meta && <meta.icon className="h-5 w-5" style={{ color: meta.color }} />}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 text-base">{selectedCat}</h4>
                                <p className="text-xs text-slate-500">{catItems.length} items · {meta?.desc}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedCat(null)}
                              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                              <ChevronUp className="h-4 w-4 text-slate-500" />
                            </button>
                          </div>

                          {/* Item List */}
                          <div className="overflow-x-auto">
                            <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                  <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider w-8">#</th>
                                  <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Item Code</th>
                                  <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Series / Name</th>
                                  <th className="text-right px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Rate (Price)</th>
                                  <th className="text-right px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Pieces</th>
                                  <th className="text-right px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Stock Value</th>
                                  <th className="text-center px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Price Range</th>
                                  <th className="text-center px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Demand</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {catItems.map((item, idx) => (
                                  <motion.tr
                                    key={item.itemCode}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(idx * 0.015, 0.5) }}
                                    className="hover:bg-slate-50/70 transition-colors group"
                                  >
                                    <td className="px-5 py-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                                    <td className="px-5 py-3">
                                      <span className="font-black text-slate-900 text-base group-hover:text-brand-primary transition-colors">#{item.itemCode}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                      <span className="font-semibold text-slate-700">{item.series || 'Classic Series'}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      <span className="font-black text-slate-900 text-base">₹{item.rate.toLocaleString()}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      <span className="font-bold text-indigo-600">{item.totalPcs}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      <span className="font-black text-emerald-600">₹{(item.totalAmount / 1000).toFixed(0)}k</span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{item.priceBucket}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-2 justify-center">
                                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                          <div className="h-full rounded-full transition-all" style={{ width: `${item.demandScore}%`, background: meta?.color }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 w-6">{item.demandScore}</span>
                                      </div>
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
</div>
                          </div>

                          {/* Footer summary */}
                          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-6 flex-wrap text-sm">
                            <div><span className="text-slate-400 font-medium">Total SKUs: </span><span className="font-black text-slate-900">{catItems.length}</span></div>
                            <div><span className="text-slate-400 font-medium">Total Pieces: </span><span className="font-black text-indigo-600">{catItems.reduce((s,i) => s + i.totalPcs, 0).toLocaleString()}</span></div>
                            <div><span className="text-slate-400 font-medium">Total Value: </span><span className="font-black text-emerald-600">₹{(catItems.reduce((s,i) => s + i.totalAmount, 0)/100000).toFixed(1)}L</span></div>
                            <div><span className="text-slate-400 font-medium">Avg Rate: </span><span className="font-black text-slate-900">₹{Math.round(catItems.reduce((s,i) => s + i.rate, 0) / catItems.length).toLocaleString()}</span></div>
                            <div className="ml-auto">
                              <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ background: meta?.color + '15', color: meta?.color }}>Rule: {meta?.rule}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Pie */}
                <FadeIn>
                  <Card className="shadow-soft border-slate-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <Flame className="h-4 w-4 text-amber-500" /> Category Distribution
                      </CardTitle>
                      <p className="text-xs text-slate-400">By total stock value</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={catPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} labelLine={false} label={renderPieLabel}>
                            {catPieData.map((entry, i) => (
                              <Cell key={i} fill={CAT_META[entry.name]?.color || '#64748b'} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(v: any) => `₹${(v/100000).toFixed(1)}L`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {catPieData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs flex-wrap gap-4">
                            <span className="flex items-center gap-2 font-medium text-slate-600">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_META[d.name]?.color || '#64748b' }} />
                              {d.name}
                            </span>
                            <span className="font-bold text-slate-900">₹{(d.value/100000).toFixed(1)}L</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Series Pie */}
                <FadeIn delay={0.1}>
                  <Card className="shadow-soft border-slate-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <Tag className="h-4 w-4 text-pink-500" /> Product Series Mix
                      </CardTitle>
                      <p className="text-xs text-slate-400">By series value contribution</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={seriesPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} labelLine={false} label={renderPieLabel}>
                            {seriesPieData.map((entry, i) => (
                              <Cell key={i} fill={SERIES_COLORS[entry.name] || '#64748b'} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(v: any) => `₹${(v/100000).toFixed(1)}L`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                        {seriesPieData.slice(0, 8).map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SERIES_COLORS[d.name] || '#64748b' }} />
                            <span className="font-medium text-slate-600 truncate">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Price Distribution */}
                <FadeIn delay={0.2}>
                  <Card className="shadow-soft border-slate-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-indigo-500" /> Price Range Distribution
                      </CardTitle>
                      <p className="text-xs text-slate-400">Number of SKUs by rate</p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={priceBar} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#6366f1" radius={[6,6,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 bg-slate-50 rounded-xl p-3 space-y-1">
                        {priceBar.map((d, i) => {
                          const colors = ['#8b5cf6','#3b82f6','#10b981','#f59e0b'];
                          return (
                            <div key={i} className="flex items-center gap-3 text-xs">
                              <div className="w-24 shrink-0 font-medium text-slate-500">{d.name}</div>
                              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(d.count/metrics.totalItems)*100}%`, background: colors[i] }} />
                              </div>
                              <div className="w-8 font-bold text-slate-700 text-right">{d.count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>

              {/* Top 15 Items Bar Chart */}
              <FadeIn delay={0.1}>
                <Card className="shadow-soft border-slate-100">
                  <CardHeader>
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" /> Top 15 Items by Stock Value
                    </CardTitle>
                    <p className="text-xs text-slate-400">Color-coded by intelligence category</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={top15Bar} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="code" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}k`} />
                        <RechartsTooltip formatter={(v: any) => [`₹${v}k`, 'Value']} />
                        <Bar dataKey="amount" radius={[6,6,0,0]} isAnimationActive>
                          {top15Bar.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </FadeIn>
            </motion.div>
          )}

          {/* ════════════════════ TAB: LIST VIEW (merged into overview) ════════════════════════════════ */}
          {activeTab === 'overview' && (
            <motion.div key="overview_list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Filters Row */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by item code or series…"
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>

                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                    className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer font-medium text-slate-700">
                    {ALL_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>

                  <select value={filterSeries} onChange={e => setFilterSeries(e.target.value)}
                    className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer font-medium text-slate-700">
                    {ALL_SERIES.map(c => <option key={c}>{c}</option>)}
                  </select>

                  <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)}
                    className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer font-medium text-slate-700">
                    {ALL_PRICES.map(c => <option key={c}>{c}</option>)}
                  </select>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                    {(['amount','pcs','rate','demand'] as const).map(f => (
                      <button key={f} onClick={() => cycleSort(f)}
                        className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all flex items-center gap-1 ${sortBy === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                        {f === 'amount' ? '₹ Value' : f === 'pcs' ? '📦 Pcs' : f === 'rate' ? '🏷️ Rate' : '📈 Demand'}
                        {sortBy === f && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                      </button>
                    ))}
                  </div>

                  <span className="text-sm font-bold text-slate-400">{filtered.length} items</span>
                </div>
              </div>

              {/* Item Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filtered.slice(0, 120).map((item, i) => {
                  const meta = CAT_META[item.category] || CAT_META['Running Products'];
                  const isExpanded = expandedItem === item.itemCode;
                  return (
                    <motion.div
                      key={item.itemCode}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      onClick={() => setExpandedItem(isExpanded ? null : item.itemCode)}
                      className={`bg-white rounded-2xl border shadow-soft hover:shadow-md transition-all cursor-pointer group overflow-hidden ${isExpanded ? 'border-brand-primary/30 ring-2 ring-brand-primary/10' : 'border-slate-100'}`}
                    >
                      {/* Top stripe by category color */}
                      <div className="h-1.5 w-full" style={{ background: meta.color }} />
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3 flex-wrap gap-4">
                          <div>
                            <h4 className="font-black text-slate-900 text-lg leading-none">#{item.itemCode}</h4>
                            <p className="text-xs text-slate-500 mt-1 font-medium">{item.series || 'Classic Series'}</p>
                          </div>
                          <CategoryRuleBadge cat={item.category} />
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Pcs</p>
                            <p className="text-base font-black text-slate-900">{item.totalPcs}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Rate</p>
                            <p className="text-base font-black text-slate-900">₹{(item.rate/1000).toFixed(1)}k</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Value</p>
                            <p className="text-base font-black text-emerald-600">₹{(item.totalAmount/1000).toFixed(0)}k</p>
                          </div>
                        </div>

                        {/* Demand Score Bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 w-14 shrink-0">Demand</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.demandScore}%` }}
                              transition={{ duration: 0.8, delay: i * 0.01 }}
                              className="h-full rounded-full"
                              style={{ background: meta.color }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-600 w-6 text-right">{item.demandScore}</span>
                        </div>

                        {/* Expanded section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                <div className={`${meta.bg} ${meta.border} border rounded-xl p-3`}>
                                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: meta.color }}>Classification Rule</p>
                                  <p className="text-xs text-slate-600 font-medium">{meta.rule}</p>
                                  <p className="text-xs text-slate-500 mt-1">{meta.desc}</p>
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Price Bucket</p>
                                    <p className="text-xs font-bold text-slate-700 mt-0.5">{item.priceBucket}</p>
                                  </div>
                                  <div className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Balance Pcs</p>
                                    <p className="text-xs font-bold text-slate-700 mt-0.5">{item.balancePcs}</p>
                                  </div>
                                </div>
                                {/* Action suggestion */}
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                  <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Suggested Action</p>
                                  <p className="text-xs text-slate-600">
                                    {item.category === 'Bestsellers'    ? '✅ Maintain stock. Promote actively. Share with warm leads.' :
                                     item.category === 'Running Products'? '📦 Stable. Monitor weekly. Good for catalog pushes.' :
                                     item.category === 'High Stock'      ? '📢 Run promotional offer. Bundle with slower items.' :
                                     item.category === 'Stuck Stock'     ? '🎯 Target cold leads with personalized offers.' :
                                     item.category === 'Dead Stock'      ? '🚨 Clearance sale or bundling. Alert sales team.' :
                                     item.category === 'Under 5 Piece'   ? '🔁 Reorder immediately or source from alternate supplier.' : '—'}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {filtered.length > 120 && (
                <p className="text-center text-sm text-slate-400 font-medium py-4">
                  Showing 120 of {filtered.length} items. Use filters to narrow down.
                </p>
              )}
            </motion.div>
          )}

          {/* ════════════════════ TAB: RULES ══════════════════════════════════ */}
          {activeTab === 'rules' && (
            <motion.div key="rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category rules explanation */}
                {Object.entries(CAT_META).map(([cat, meta], i) => {
                  const count = items.filter(item => item.category === cat).length;
                  const totalVal = items.filter(item => item.category === cat).reduce((s,i) => s + i.totalAmount, 0);
                  const totalPcs = items.filter(item => item.category === cat).reduce((s,i) => s + i.totalPcs, 0);
                  return (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden"
                    >
                      <div className="h-2" style={{ background: meta.color }} />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: meta.color + '18' }}>
                              <meta.icon className="h-6 w-6" style={{ color: meta.color }} />
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900 text-lg">{cat}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                            </div>
                          </div>
                          <span className="text-2xl font-black" style={{ color: meta.color }}>{count}</span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Classification Rule</p>
                          <p className="text-sm font-bold text-slate-800">{meta.rule}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-xs text-slate-400 font-medium">SKUs</p>
                            <p className="text-xl font-black" style={{ color: meta.color }}>{count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-medium">Total Pcs</p>
                            <p className="text-xl font-black text-slate-900">{totalPcs.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-medium">Value</p>
                            <p className="text-xl font-black text-emerald-600">₹{(totalVal/100000).toFixed(1)}L</p>
                          </div>
                        </div>

                        {/* CRM action */}
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">CRM Action</p>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {cat === 'Bestsellers'    ? 'Feature in all pitch decks & WhatsApp catalog pushes. Recommend to Hot & Warm leads. Protect inventory for top 20% customers.' :
                             cat === 'Running Products'? 'Include in regular weekly catalogs. No aggressive discounting needed. Perfect for Mid Revenue customers.' :
                             cat === 'High Stock'      ? 'Create "Special Offer" pricing for this item. Alert sales team to include in all customer calls this week.' :
                             cat === 'Stuck Stock'     ? 'Bundle with bestsellers. Create value-added combos. Target Cold Leads and Purchased < 3 Times segments.' :
                             cat === 'Dead Stock'      ? 'Immediate clearance required. Offer max discount to Lot Parties for win-back opportunity. Consider writing off.' :
                             cat === 'Under 5 Piece'   ? 'Generate urgent reorder request. Do not offer to customers until stock is replenished. Alert procurement team.' : ''}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Flowchart-style business rules */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <span className="text-2xl">⚙️</span> Inventory Classification Engine — Rules
                </h3>
                <div className="space-y-3">
                  {[
                    { rule: 'Balance Pcs ≥ 50% of Opening Stock', result: 'Dead Stock 🔴', color: '#ef4444' },
                    { rule: 'Total Pcs < 5 units',                 result: 'Under 5 Piece 🟣', color: '#8b5cf6' },
                    { rule: 'Total Pcs > 100 units',               result: 'High Stock 🟡', color: '#f59e0b' },
                    { rule: 'Revenue in Top 20% of all SKUs',      result: 'Bestseller ⭐', color: '#10b981' },
                    { rule: 'Pcs between 10–100 (not above rules)','result': 'Running Product 🔵', color: '#3b82f6' },
                    { rule: 'All others (Pcs 5–9)',                 result: 'Stuck Stock 🟠', color: '#f97316' },
                  ].map((row, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <div className="text-white/40 font-black text-sm w-5 shrink-0">{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white/90">IF {row.rule}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white/30 text-xs">→ THEN</span>
                        <span className="px-3 py-1.5 rounded-full text-xs font-black" style={{ background: row.color + '30', color: row.color, border: `1px solid ${row.color}40` }}>
                          {row.result}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}


          {/* ════════════════════ TAB: AGING ANALYSIS ════════════════════════════ */}
          {activeTab === 'aging' && (() => {
            const engineItems = items as EngineItem[];
            const healthReport = computeInventoryHealthScore(engineItems);
            const agingBuckets = computeInventoryAging(engineItems);
            const fastMovers = getFastMovingProducts(engineItems, 10);
            const lowStock = getLowStockAlerts(engineItems, 5);
            const deadItems = getDeadStockItems(engineItems);
            const stuckItems = getStuckStockItems(engineItems);

            return (
              <motion.div key="aging" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                {/* Health Score Gauge */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-soft p-6 flex flex-col items-center justify-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Inventory Health Score</p>
                    <div className="relative h-40 w-40 flex items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        <circle cx="50" cy="50" r="40" fill="none"
                          stroke={healthReport.score >= 70 ? '#10b981' : healthReport.score >= 50 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="12" strokeLinecap="round"
                          strokeDasharray={`${(healthReport.score / 100) * 251.2} 251.2`}
                        />
                      </svg>
                      <div className="text-center">
                        <div className="text-4xl font-black text-slate-900">{healthReport.score}</div>
                        <div className={`text-2xl font-black ${healthReport.grade === 'A' ? 'text-emerald-600' : healthReport.grade === 'B' ? 'text-blue-600' : healthReport.grade === 'C' ? 'text-amber-600' : 'text-rose-600'}`}>
                          Grade {healthReport.grade}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-medium mt-4 text-center">{healthReport.summary}</p>
                  </div>

                  <div className="xl:col-span-2 space-y-4">
                    {healthReport.criticalAlerts.length > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
                        <h4 className="font-black text-rose-800 text-sm mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Critical Alerts</h4>
                        <div className="space-y-2">
                          {healthReport.criticalAlerts.map((alert, i) => <p key={i} className="text-sm text-rose-700 font-medium">{alert}</p>)}
                        </div>
                      </div>
                    )}
                    <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-5">
                      <h4 className="font-black text-brand-primary text-sm mb-3 flex items-center gap-2"><Activity className="h-4 w-4" /> Recommended Actions</h4>
                      <div className="space-y-2">
                        {healthReport.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-brand-primary font-black mt-0.5">→</span> {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aging Breakdown */}
                <div>
                  <h3 className="font-black text-slate-900 text-lg mb-4">📦 Inventory Aging Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {agingBuckets.map((bucket) => (
                      <div key={bucket.days} className={`bg-white rounded-2xl border shadow-soft p-5 ${
                        bucket.risk === 'critical' ? 'border-rose-200' :
                        bucket.risk === 'high' ? 'border-amber-200' :
                        bucket.risk === 'medium' ? 'border-orange-200' :
                        'border-emerald-200'
                      }`}>
                        <div className={`text-xs font-black uppercase tracking-wider mb-3 ${
                          bucket.risk === 'critical' ? 'text-rose-600' :
                          bucket.risk === 'high' ? 'text-amber-600' :
                          bucket.risk === 'medium' ? 'text-orange-600' :
                          'text-emerald-600'
                        }`}>{bucket.label}</div>
                        <div className="text-3xl font-black text-slate-900">{bucket.items.length}</div>
                        <div className="text-xs text-slate-500 mt-1">SKUs</div>
                        <div className="mt-3 border-t border-slate-100 pt-3 flex justify-between text-xs flex-wrap gap-4">
                          <span className="text-slate-400">{bucket.totalPcs.toLocaleString()} pcs</span>
                          <span className="font-black text-slate-700">₹{(bucket.totalValue / 100000).toFixed(1)}L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dead Stock & Stuck Stock Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-rose-100 shadow-soft overflow-hidden">
                    <div className="bg-rose-50 px-5 py-3 border-b border-rose-100 flex items-center gap-2">
                      <PackageX className="h-4 w-4 text-rose-600" />
                      <h4 className="font-black text-rose-800 text-sm">Dead Stock — {deadItems.length} SKUs</h4>
                      <span className="ml-auto font-black text-rose-700 text-sm">₹{(deadItems.reduce((s, i) => s + i.totalAmount, 0) / 100000).toFixed(1)}L at risk</span>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="text-left px-4 py-2 text-slate-400 font-bold">Code</th>
                            <th className="text-left px-4 py-2 text-slate-400 font-bold">Series</th>
                            <th className="text-left px-4 py-2 text-slate-400 font-bold">Category</th>
                            <th className="text-left px-4 py-2 text-slate-400 font-bold">Target Section</th>
                            <th className="text-right px-4 py-2 text-slate-400 font-bold">Pcs</th>
                            <th className="text-right px-4 py-2 text-slate-400 font-bold">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {deadItems.slice(0, 8).map((i) => (
                            <tr key={i.itemCode} className="hover:bg-rose-50/30 transition-colors">
                              <td className="px-4 py-2 font-bold text-slate-700">#{i.itemCode}</td>
                              <td className="px-4 py-2 text-slate-600 font-semibold">{i.series || 'Classic'}</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">{i.category}</span>
                              </td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{getTargetSection(i.category)}</span>
                              </td>
                              <td className="px-4 py-2 text-right text-slate-600">{i.totalPcs}</td>
                              <td className="px-4 py-2 text-right font-black text-rose-600">₹{(i.totalAmount / 1000).toFixed(0)}k</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-amber-100 shadow-soft overflow-hidden">
                    <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <h4 className="font-black text-amber-800 text-sm">Stuck Stock — {stuckItems.length} SKUs</h4>
                      <span className="ml-auto font-black text-amber-700 text-sm">₹{(stuckItems.reduce((s, i) => s + i.totalAmount, 0) / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="text-left px-4 py-2 text-slate-400 font-bold">Code</th>
                            <th className="text-left px-4 py-2 text-slate-400 font-bold">Series</th>
                            <th className="text-left px-4 py-2 text-slate-400 font-bold">Category</th>
                            <th className="text-left px-4 py-2 text-slate-400 font-bold">Target Section</th>
                            <th className="text-right px-4 py-2 text-slate-400 font-bold">Pcs</th>
                            <th className="text-right px-4 py-2 text-slate-400 font-bold">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {stuckItems.slice(0, 8).map((i) => (
                            <tr key={i.itemCode} className="hover:bg-amber-50/30 transition-colors">
                              <td className="px-4 py-2 font-bold text-slate-700">#{i.itemCode}</td>
                              <td className="px-4 py-2 text-slate-600 font-semibold">{i.series || 'Classic'}</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{i.category}</span>
                              </td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{getTargetSection(i.category)}</span>
                              </td>
                              <td className="px-4 py-2 text-right text-slate-600">{i.totalPcs}</td>
                              <td className="px-4 py-2 text-right font-black text-amber-600">₹{(i.totalAmount / 1000).toFixed(0)}k</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
</div>
                    </div>
                  </div>
                </div>

                {/* Fast Movers + Low Stock */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-emerald-100 shadow-soft p-5">
                    <h4 className="font-black text-emerald-800 text-sm mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> Fast Moving Products (Top 10)</h4>
                    <div className="space-y-3">
                      {fastMovers.map((item) => (
                        <div key={item.itemCode} className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50 gap-3 flex-wrap gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-xs">#{item.itemCode}</span>
                            <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-100 px-2 py-0.5 rounded-md">{item.series || 'Classic'}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">{item.category}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700">{getTargetSection(item.category)}</span>
                          </div>
                          <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap gap-4">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.demandScore}%` }} />
                            </div>
                            <span className="text-xs font-black text-emerald-700 w-12 text-right">{item.demandScore} score</span>
                            <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-1 border border-slate-100 rounded-lg shrink-0">{item.totalPcs} pcs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-purple-100 shadow-soft p-5">
                    <h4 className="font-black text-purple-800 text-sm mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-purple-600" /> 🚨 Low Stock Alerts</h4>
                    <div className="space-y-2">
                      {lowStock.slice(0, 10).map((item) => (
                        <div key={item.itemCode} className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2.5 border border-purple-100 flex-wrap gap-4">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-black text-slate-800 text-xs">#{item.itemCode}</span>
                            <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-100 px-2 py-0.5 rounded-md truncate max-w-[80px]">{item.series || 'Classic'}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700">{item.category}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700">{getTargetSection(item.category)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${item.totalPcs < 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              {item.totalPcs} pcs
                            </span>
                            <span className="text-[10px] text-purple-600 font-bold">REORDER</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
      </div>
    </div>
  );
}
