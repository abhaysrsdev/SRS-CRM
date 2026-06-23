import React, { useState, useMemo } from 'react';
import { useSalesOrders, useProducts } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import {
  ShoppingBag, Search, TrendingUp, AlertTriangle, CheckCircle, Package,
  Truck, ArrowUpDown, ChevronDown, ChevronUp, User, MapPin, Briefcase
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { motion, AnimatePresence } from 'framer-motion';
import { getLehengaFallback } from '../lib/utils';

const STATUS_COLORS = {
  Completed: '#10b981', // Emerald
  Pending: '#f59e0b',   // Amber
  Overdue: '#ef4444',   // Rose
};

const PIE_COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export function SalesOrders() {
  const [searchQ, setSearchQ] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'balPcs' | 'date' | 'overdue'>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Fetch sales orders from backend API
  const { data: salesOrders, isLoading } = useSalesOrders();
  const { data: products } = useProducts();

  // ── Aggregated Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!salesOrders) return { totalVal: 0, pendingPcs: 0, pendingVal: 0, overdueCount: 0, topBroker: 'DIRECT', topCity: 'N/A' };
    
    let totalVal = 0;
    let pendingPcs = 0;
    let pendingVal = 0;
    let overdueCount = 0;

    const brokers: Record<string, number> = {};
    const cities: Record<string, number> = {};

    salesOrders.forEach(o => {
      totalVal += o.amount;
      pendingPcs += o.balPcs;
      pendingVal += o.balPcs * o.rate;
      if (o.overDueDays > 0 && o.balPcs > 0) {
        overdueCount++;
      }
      if (o.broker) brokers[o.broker] = (brokers[o.broker] || 0) + o.amount;
      if (o.cityName) cities[o.cityName] = (cities[o.cityName] || 0) + o.amount;
    });

    const topBroker = Object.entries(brokers).sort((a, b) => b[1] - a[1])[0]?.[0] || 'DIRECT';
    const topCity = Object.entries(cities).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalVal, pendingPcs, pendingVal, overdueCount, topBroker, topCity };
  }, [salesOrders]);

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!salesOrders) return { citiesData: [], brokersData: [], statusData: [] };

    // City distribution
    const citiesMap: Record<string, number> = {};
    const brokersMap: Record<string, number> = {};
    let completedCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    salesOrders.forEach(o => {
      citiesMap[o.cityName] = (citiesMap[o.cityName] || 0) + o.amount;
      brokersMap[o.broker || 'DIRECT'] = (brokersMap[o.broker || 'DIRECT'] || 0) + o.amount;

      if (o.balPcs === 0) {
        completedCount++;
      } else if (o.overDueDays > 0) {
        overdueCount++;
      } else {
        pendingCount++;
      }
    });

    const citiesData = Object.entries(citiesMap)
      .map(([name, value]) => ({ name, amount: Math.round(value / 1000) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const brokersData = Object.entries(brokersMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const statusData = [
      { name: 'Completed', value: completedCount, color: STATUS_COLORS.Completed },
      { name: 'Pending Dispatch', value: pendingCount, color: STATUS_COLORS.Pending },
      { name: 'Overdue Dispatch', value: overdueCount, color: STATUS_COLORS.Overdue },
    ];

    return { citiesData, brokersData, statusData };
  }, [salesOrders]);

  // ── Filters & Sorting ───────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    if (!salesOrders) return [];
    let result = salesOrders;

    // Search query filter
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter(o => 
        o.customerName.toLowerCase().includes(q) ||
        o.productCode.toLowerCase().includes(q) ||
        o.broker.toLowerCase().includes(q) ||
        o.cityName.toLowerCase().includes(q) ||
        String(o.orderNo).includes(q)
      );
    }

    // Tab filter
    if (activeTab === 'pending') {
      result = result.filter(o => o.balPcs > 0);
    } else if (activeTab === 'overdue') {
      result = result.filter(o => o.overDueDays > 0 && o.balPcs > 0);
    } else if (activeTab === 'completed') {
      result = result.filter(o => o.balPcs === 0);
    }

    // Sorting
    return [...result].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortBy === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (sortBy === 'overdue') {
        valA = a.overDueDays;
        valB = b.overDueDays;
      } else if (sortBy === 'amount') {
        valA = a.amount;
        valB = b.amount;
      } else if (sortBy === 'balPcs') {
        valA = a.balPcs;
        valB = b.balPcs;
      }

      if (sortDesc) {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      } else {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
    });
  }, [salesOrders, searchQ, activeTab, sortBy, sortDesc]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDesc(d => !d);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-16 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm px-8 py-5">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-6 flex-wrap flex-wrap gap-4">
          <FadeIn>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Sales Orders Intelligence</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Analyze active sales orders, track dispatches, salesman performance, and outstanding metrics.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-8 py-8 space-y-8">
        {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <StaggerItem>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingBag className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Orders</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{salesOrders?.length || 0}</h3>
                <p className="text-xs text-slate-500 mt-0.5">₹{(stats.totalVal/100000).toFixed(2)}L Value</p>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Pieces</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.pendingPcs}</h3>
                <p className="text-xs text-slate-500 mt-0.5">₹{(stats.pendingVal/100000).toFixed(2)}L Outstanding</p>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Orders</p>
                <h3 className="text-2xl font-black text-rose-600 mt-0.5">{stats.overdueCount}</h3>
                <p className="text-xs text-rose-500 mt-0.5">Aged pending dispatches</p>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Broker</p>
                <h3 className="text-lg font-black text-slate-900 mt-1 truncate max-w-[150px]">{stats.topBroker}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Max order volume</p>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Ordering City</p>
                <h3 className="text-lg font-black text-slate-900 mt-1 truncate max-w-[150px]">{stats.topCity}</h3>
                <p className="text-xs text-slate-500 mt-0.5">By sales amount</p>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* ── Charts Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 10 Cities Bar Chart */}
          <FadeIn className="lg:col-span-2">
            <Card className="shadow-soft border-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  Top Ordering Cities (₹ thousands)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.citiesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}k`} />
                    <Tooltip formatter={(v: any) => [`₹${v}k`, 'Value']} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Status Breakdown & Brokers */}
          <FadeIn>
            <Card className="shadow-soft border-slate-100 flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-500" />
                  Dispatch Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {chartData.statusData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs font-semibold text-slate-700 flex-wrap gap-4">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-bold text-slate-900">{d.value} orders</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* ── Main Data View ─────────────────────────────────────────────────── */}
        <Card className="shadow-soft border-slate-100 rounded-2xl overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl w-fit">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'pending', label: 'Pending Dispatch' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'completed', label: 'Completed' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                    activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, product SKU, broker..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-semibold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Order No</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Product Code</th>
                  <th className="px-6 py-4 text-right">Order Pcs</th>
                  <th className="px-6 py-4 text-right">Pending Pcs</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Overdue Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-400 font-semibold">
                      No sales orders found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const isCompleted = o.balPcs === 0;
                    const isOverdue = o.overDueDays > 0 && o.balPcs > 0;
                    const isExpanded = expandedOrder === o.id;
                    const matchedProduct = products?.find(pr => pr.designCode === o.productCode);
                    const imgUrl = matchedProduct?.imageUrl || getLehengaFallback(o.productCode);

                    return (
                      <React.Fragment key={o.id}>
                        <tr
                          onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                          className={`hover:bg-slate-50/70 transition-colors cursor-pointer group ${
                            isOverdue ? 'bg-red-50/20' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-bold text-slate-900">#{o.orderNo}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                            {new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800 group-hover:text-brand-primary transition-colors text-sm max-w-[250px] truncate">
                              {o.customerName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">{o.cityName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                <img 
                                  src={imgUrl} 
                                  onError={(e) => { e.currentTarget.src = getLehengaFallback(o.productCode); }}
                                  alt={o.productCode} 
                                  loading="lazy"
                                  className="h-full w-full object-cover" 
                                />
                              </div>
                              <span className="font-bold text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {o.productCode}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-700">{o.orderPcs}</td>
                          <td className="px-6 py-4 text-right font-black">
                            <span className={o.balPcs > 0 ? (isOverdue ? 'text-rose-600' : 'text-amber-500') : 'text-emerald-500'}>
                              {o.balPcs}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">
                            ₹{o.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : isOverdue
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}
                            >
                              {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {o.overDueDays > 0 ? (
                              <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs">
                                {o.overDueDays} days
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600"
                                >
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Broker</p>
                                    <p className="text-slate-800 text-sm mt-1">{o.broker || 'DIRECT'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Sales Man</p>
                                    <p className="text-slate-800 text-sm mt-1">{o.salesMan || 'Not Assigned'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Catalog / Series</p>
                                    <p className="text-slate-800 text-sm mt-1">
                                      {o.catalog || 'General'} {o.vol ? `(Vol ${o.vol})` : ''}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Color & Packing</p>
                                    <p className="text-slate-800 text-sm mt-1">
                                      {o.color} / {o.packing || 'None'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">GSTIN</p>
                                    <p className="text-slate-800 text-sm mt-1">{o.gstNumber || 'Not Registered'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Unit Rate</p>
                                    <p className="text-slate-800 text-sm mt-1">₹{o.rate.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Dispatched Pieces</p>
                                    <p className="text-slate-800 text-sm mt-1">{o.dispPcs} units</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">Due Credit Days</p>
                                    <p className="text-slate-800 text-sm mt-1">{o.dueDays} days</p>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
</div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 flex-wrap gap-4">
            <span>Showing {filteredOrders.length} of {salesOrders?.length || 0} orders</span>
            <div className="flex gap-2">
              <span className="text-[10px] font-black text-slate-400">SORT BY:</span>
              <button onClick={() => toggleSort('date')} className={`hover:text-slate-700 capitalize ${sortBy === 'date' ? 'text-indigo-600 underline' : ''}`}>Date</button>
              <button onClick={() => toggleSort('amount')} className={`hover:text-slate-700 capitalize ${sortBy === 'amount' ? 'text-indigo-600 underline' : ''}`}>Amount</button>
              <button onClick={() => toggleSort('balPcs')} className={`hover:text-slate-700 capitalize ${sortBy === 'balPcs' ? 'text-indigo-600 underline' : ''}`}>Pending Pcs</button>
              <button onClick={() => toggleSort('overdue')} className={`hover:text-slate-700 capitalize ${sortBy === 'overdue' ? 'text-indigo-600 underline' : ''}`}>Overdue Days</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
