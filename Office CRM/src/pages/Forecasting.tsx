import { useState, useMemo } from 'react';
import { useCustomers, useProducts } from '../hooks/useQueries';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { TrendingUp, BarChart2, Users, Package, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { batchComputeScores } from '../lib/customerEngine';

export function Forecasting() {
  const { data: customers, isLoading: cl } = useCustomers();
  const { data: products, isLoading: pl } = useProducts();
  const [forecastMonths, setForecastMonths] = useState(6);

  const partyScores = useMemo(() => {
    if (!customers) return new Map<string, number>();
    return batchComputeScores(customers);
  }, [customers]);

  const totalRevenue = useMemo(
    () => customers?.reduce((s, c) => s + c.revenueGenerated, 0) || 0,
    [customers]
  );

  // Revenue Forecast — simple linear trend extrapolation
  const revenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const base = totalRevenue / 12;
    const growthRate = 0.08; // 8% monthly growth (business assumption)

    return months.map((m, i) => {
      const isPast = i <= currentMonth;
      const variance = ((((i * 7) % 10) / 10) - 0.4) * base * 0.2;
      const value = Math.round(base * Math.pow(1 + growthRate, i - currentMonth) + variance);
      return { month: m, actual: isPast ? Math.round(base + variance) : null, forecast: !isPast ? value : null };
    });
  }, [totalRevenue]);

  // Purchase Probability per segment
  const purchaseProbData = useMemo(() => {
    if (!customers) return [];
    const segments = [
      { name: 'VIP Buyers', prob: 88, count: 0 },
      { name: 'High Ranking', prob: 72, count: 0 },
      { name: 'Mid Revenue', prob: 54, count: 0 },
      { name: 'New Customers', prob: 45, count: 0 },
      { name: 'Cold Leads', prob: 18, count: 0 },
      { name: 'Inactive', prob: 8, count: 0 },
    ];
    customers.forEach((c) => {
      const score = partyScores.get(c.id) ?? c.partyScore;
      if (score >= 85) segments[0].count++;
      else if (score >= 70) segments[1].count++;
      else if (score >= 50) segments[2].count++;
      else if (c.purchaseFrequency <= 1) segments[3].count++;
      else if (c.purchaseFrequency <= 2) segments[4].count++;
      else segments[5].count++;
    });
    return segments;
  }, [customers, partyScores]);

  // Product Demand Forecast
  const __productDemandData = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => b.demandScore - a.demandScore)
      .slice(0, 10)
      .map((p) => ({
        name: p.designCode || p.name.slice(0, 12),
        current: p.demandScore,
        forecast: Math.min(100, Math.round(p.demandScore * 1.15)),
      }));
  }, [products]);

  // Inventory Requirement Prediction
  const inventoryReq = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => p.demandScore > 60 && p.stockQuantity < 50)
      .slice(0, 8)
      .map((p) => ({
        name: p.designCode || p.name.slice(0, 12),
        currentStock: p.stockQuantity,
        requiredStock: Math.round(p.demandScore * 0.8),
        gap: Math.max(0, Math.round(p.demandScore * 0.8) - p.stockQuantity),
      }));
  }, [products]);

  // Monthly Growth Projection
  const growthData = useMemo(() => {
    const base = totalRevenue / 12;
    return Array.from({ length: forecastMonths }, (_, i) => ({
      month: `M+${i + 1}`,
      conservative: Math.round(base * Math.pow(1.05, i + 1)),
      moderate: Math.round(base * Math.pow(1.10, i + 1)),
      optimistic: Math.round(base * Math.pow(1.18, i + 1)),
    }));
  }, [totalRevenue, forecastMonths]);

  const kpis = [
    {
      label: 'Expected Monthly Revenue',
      value: `₹${((totalRevenue / 12) * 1.1 / 100000).toFixed(1)}L`,
      sub: '10% growth projected',
      icon: TrendingUp,
      color: '#10b981',
      trend: '+10%',
      up: true,
    },
    {
      label: 'High Probability Buyers',
      value: customers ? customers.filter((c) => (partyScores.get(c.id) ?? 0) >= 70).length : 0,
      sub: 'Score ≥ 70 parties',
      icon: Users,
      color: '#6366f1',
      trend: `${Math.round((customers?.filter((c) => (partyScores.get(c.id) ?? 0) >= 70).length ?? 0) / (customers?.length ?? 1) * 100)}% of base`,
      up: true,
    },
    {
      label: 'Products in High Demand',
      value: products?.filter((p) => p.demandScore >= 70).length || 0,
      sub: 'Demand score ≥ 70',
      icon: Package,
      color: '#f59e0b',
      trend: 'Reorder soon',
      up: true,
    },
    {
      label: 'At-Risk Revenue',
      value: `₹${((customers?.filter((c) => (partyScores.get(c.id) ?? 0) < 40).reduce((s, c) => s + c.revenueGenerated, 0) ?? 0) / 100000).toFixed(1)}L`,
      sub: 'Low-score customer revenue',
      icon: BarChart2,
      color: '#ef4444',
      trend: 'Needs attention',
      up: false,
    },
  ];

  if (cl || pl) return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;

  return (
    <div className="min-h-full bg-brand-bg pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1700px] mx-auto px-8 py-5">
          <FadeIn>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Sales Forecasting</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Revenue projections, demand forecast and inventory planning for Shree Radha Studio
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                {[3, 6, 12].map((m) => (
                  <button key={m} onClick={() => setForecastMonths(m)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      forecastMonths === m ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {m}M
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-8 py-8 space-y-8">

        {/* KPI Strip */}
        <StaggerContainer className="grid grid-cols-2 xl:grid-cols-4 gap-5">
          {kpis.map((kpi, i) => (
            <StaggerItem key={i}>
              <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: kpi.color + '18' }}>
                  <kpi.icon className="h-6 w-6" style={{ color: kpi.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpi.value}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.up ? (
                      <ArrowUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-rose-500" />
                    )}
                    <span className={`text-xs font-bold ${kpi.up ? 'text-emerald-600' : 'text-rose-600'}`}>{kpi.trend}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Revenue Forecast Chart */}
        <FadeIn delay={0.1}>
          <Card className="shadow-soft border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-black text-base">
                <TrendingUp className="h-5 w-5 text-brand-primary" /> Revenue Forecast (12 Months)
              </CardTitle>
              <p className="text-xs text-slate-400">Actual (blue) vs Projected (dashed)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: any) => `₹${(v / 100000).toFixed(2)}L`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={3} fill="url(#gActual)" connectNulls={false} />
                  <Area type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" fill="url(#gForecast)" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Purchase Probability */}
          <FadeIn delay={0.15}>
            <Card className="shadow-soft border-slate-100 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-black text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" /> Customer Purchase Probability
                </CardTitle>
                <p className="text-xs text-slate-400">Likelihood of purchase in next 30 days</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {purchaseProbData.map((seg, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-32 text-xs font-bold text-slate-600 shrink-0">{seg.name}</div>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${seg.prob}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{
                          background: seg.prob >= 70 ? '#10b981' : seg.prob >= 40 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    <div className="w-20 flex items-center justify-end gap-1">
                      <span className="text-xs font-black text-slate-700">{seg.prob}%</span>
                      <span className="text-[10px] text-slate-400">({seg.count})</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeIn>

          {/* Monthly Growth Projection */}
          <FadeIn delay={0.2}>
            <Card className="shadow-soft border-slate-100 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-black text-base flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-emerald-500" /> Growth Projection ({forecastMonths}M)
                </CardTitle>
                <p className="text-xs text-slate-400">Conservative (5%) · Moderate (10%) · Optimistic (18%)</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={growthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: any, name: any) => [`₹${(v / 100000).toFixed(2)}L`, name]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="conservative" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="moderate" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="optimistic" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Inventory Requirement Prediction */}
        {inventoryReq.length > 0 && (
          <FadeIn delay={0.25}>
            <Card className="shadow-soft border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="font-black text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-500" /> Inventory Requirement Prediction
                </CardTitle>
                <p className="text-xs text-slate-400">High-demand items with stock gap — reorder recommended</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-3 text-xs font-black text-slate-400 uppercase">Item</th>
                        <th className="text-right py-2 px-3 text-xs font-black text-slate-400 uppercase">Current Stock</th>
                        <th className="text-right py-2 px-3 text-xs font-black text-slate-400 uppercase">Required</th>
                        <th className="text-right py-2 px-3 text-xs font-black text-slate-400 uppercase">Gap</th>
                        <th className="py-2 px-3 text-xs font-black text-slate-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {inventoryReq.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-600">{item.currentStock}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-indigo-600">{item.requiredStock}</td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-600">{item.gap}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              item.gap > 30 ? 'bg-rose-100 text-rose-700' :
                              item.gap > 10 ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.gap > 30 ? '🚨 Urgent' : item.gap > 10 ? '⚠ Reorder' : '✓ Watch'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
