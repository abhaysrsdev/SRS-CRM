/* eslint-disable */
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Search, Filter, Copy, ChevronRight, PenTool, MessageCircle,
  TrendingUp, BarChart2, Clock, Star, ChevronDown, ChevronUp,
  Activity, Award, Target, Zap, X, ShoppingBag, Download, Check,
} from 'lucide-react';
import { useCustomers, useProducts, usePurchases, useSalesOrders } from '../hooks/useQueries';
import type { Customer, Product } from '../types';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLocation } from 'react-router-dom';
import { FadeIn, StaggerContainer, StaggerItem, SlideInRight } from '../components/ui/motion';
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from 'recharts';

// New engines
import { batchComputeScores, computeCLV, computeRevenueContribution, computeGrowthPotential, inferPaymentBehaviour, generateCustomerTags } from '../lib/customerEngine';
import { filterBySegment, getSegmentCounts, DEFAULT_SEGMENT_RULES, type ExtendedSegment } from '../lib/segmentEngine';
import { getAllRecommendations } from '../lib/recommendationEngine';
import { VoiceNotePanel } from '../components/crm/VoiceNotePanel';
import { WhatsAppPanel } from '../components/crm/WhatsAppPanel';
import { RecommendationPanel } from '../components/crm/RecommendationPanel';
import { getLehengaFallback } from '../lib/utils';
import { API_BASE_URL } from '../lib/api';

const extractDriveId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try { return new URL(url).searchParams.get('id'); } catch { return null; }
};

const getOptimizedImageUrl = (url: string | null | undefined, fallbackId: string) => {
  if (!url) return getLehengaFallback(fallbackId);
  const id = extractDriveId(url);
  if (id) return `/catalog_thumbnails/${id}.webp`;
  return url;
};

const SEGMENTS: ExtendedSegment[] = [
  'All Parties',
  'Purchased < 3 Times',
  'High Ranking Parties',
  'Cold Leads',
  'Mid Revenue Parties',
  'Lot Parties',
  'VIP Buyers',
  'Inactive Customers',
  'New Customers',
];

const SEGMENT_COLORS: Record<ExtendedSegment, string> = {
  'All Parties': 'text-slate-600',
  'VIP Buyers': 'text-purple-600',
  'High Ranking Parties': 'text-emerald-600',
  'New Customers': 'text-blue-600',
  'Cold Leads': 'text-cyan-600',
  'Mid Revenue Parties': 'text-amber-600',
  'Purchased < 3 Times': 'text-orange-600',
  'Lot Parties': 'text-rose-600',
  'Inactive Customers': 'text-slate-400',
};

const SEGMENT_EMOJIS: Record<ExtendedSegment, string> = {
  'All Parties': '👥',
  'VIP Buyers': '👑',
  'High Ranking Parties': '🔥',
  'New Customers': '✨',
  'Cold Leads': '❄️',
  'Mid Revenue Parties': '📈',
  'Purchased < 3 Times': '🛒',
  'Lot Parties': '⏸️',
  'Inactive Customers': '💤',
};

export function CustomerLists() {
  const location = useLocation();
  const initialFilter = location.state?.filter;
  const initialCustomerId = location.state?.customerId;

  let initialSegment: ExtendedSegment = 'High Ranking Parties';
  if (initialFilter === 'Hot Parties') initialSegment = 'High Ranking Parties';
  if (initialFilter === 'Cold Leads') initialSegment = 'Cold Leads';
  if (initialFilter === 'Lot Parties') initialSegment = 'Lot Parties';
  if (initialFilter === 'Total Parties') initialSegment = 'All Parties';

  const { data: customers, isLoading: isCustomersLoading } = useCustomers();
  const { data: products, isLoading: isProductsLoading } = useProducts();

  // Fetch real drive catalog folders to map images by designCode
  const [catalogFolders, setCatalogFolders] = useState<any[]>([]);
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/catalog/folders/?limit=1000`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCatalogFolders(data);
      })
      .catch(console.error);
  }, []);

  const [activeSegment, setActiveSegment] = useState<ExtendedSegment>(initialSegment);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId || null);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [copyingImgId, setCopyingImgId] = useState<string | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());

  const [mobileView, setMobileView] = useState<'segments' | 'list' | 'detail'>(initialCustomerId ? 'detail' : 'list');

  const toggleImageSelection = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  React.useEffect(() => {
    if (initialCustomerId) {
      setActiveSegment('All Parties');
      setSelectedCustomerId(initialCustomerId);
      setMobileView('detail');
    }
  }, [initialCustomerId]);

  const selectedCustomer = customers?.find((c) => c.id === selectedCustomerId);
  const { data: purchases, isLoading: isPurchasesLoading } = usePurchases(selectedCustomerId || '');
  const { data: customerSalesOrders } = useSalesOrders(undefined, selectedCustomer?.name);

  // Compute party scores for all customers (memoized)
  const partyScores = useMemo(() => {
    if (!customers) return new Map<string, number>();
    return batchComputeScores(customers);
  }, [customers]);

  // Total revenue for contribution calc
  const totalRevenue = useMemo(
    () => customers?.reduce((s, c) => s + c.revenueGenerated, 0) || 0,
    [customers]
  );

  // Segment counts
  const segmentCounts = useMemo(() => {
    if (!customers) return {} as Record<ExtendedSegment, number>;
    return getSegmentCounts(customers, partyScores, DEFAULT_SEGMENT_RULES);
  }, [customers, partyScores]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    const bySegment = filterBySegment(customers, activeSegment, partyScores, DEFAULT_SEGMENT_RULES);
    if (!searchTerm) return bySegment;
    return bySegment.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [customers, searchTerm, activeSegment, partyScores]);

  // Virtualizer
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredCustomers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  // Current customer's score
  const selectedScore = selectedCustomer ? (partyScores.get(selectedCustomer.id) ?? selectedCustomer.partyScore) : 0;

  // AI Recommendations for selected customer
  const recommendations = useMemo(() => {
    if (!selectedCustomer || !products || !purchases) return [];
    return getAllRecommendations(selectedCustomer, purchases, products, selectedScore);
  }, [selectedCustomer, products, purchases, selectedScore]);

  // Party intelligence data
  const customerTags = useMemo(() => {
    if (!selectedCustomer || !purchases) return null;
    const maxRevenue = Math.max(...(customers?.map((c) => c.revenueGenerated) ?? [1]), 1);
    return generateCustomerTags(selectedCustomer, purchases, selectedScore, maxRevenue);
  }, [selectedCustomer, purchases, selectedScore, customers]);

  const clv = useMemo(() => selectedCustomer ? computeCLV(selectedCustomer) : 0, [selectedCustomer]);
  const revenueContrib = useMemo(() => selectedCustomer ? computeRevenueContribution(selectedCustomer, totalRevenue) : 0, [selectedCustomer, totalRevenue]);
  const growthPotential = useMemo(() => selectedCustomer ? computeGrowthPotential(selectedCustomer, selectedScore) : 0, [selectedCustomer, selectedScore]);
  const paymentBehaviour = useMemo(() => selectedCustomer ? inferPaymentBehaviour(selectedCustomer) : '', [selectedCustomer]);

  // Fake order trend for sparkline
  const orderTrend = useMemo(() => {
    if (!purchases) return [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((m, i) => ({
      month: m,
      amount: Math.floor(Math.random() * (selectedCustomer?.averageOrderValue ?? 5000) * 1.5),
    }));
  }, [purchases, selectedCustomer]);

  const handleCopy = (prods: Product[], listName: string) => {
    if (!selectedCustomer) return;
    let text = `Hello ${selectedCustomer.name},\n\nCheck out our ${listName}:\n\n`;
    prods.slice(0, 5).forEach((p) => {
      text += `• ${p.name} (Code: ${p.designCode}) | Color: ${p.color} | Stock: ${p.stockQuantity}\n`;
    });
    navigator.clipboard.writeText(text);
    alert(`Copied ${listName} to clipboard!`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const getScoreBar = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getProductCopyText = (p: Product) => {
    return `*Shree Radha Studio*\n\nDesign Code: *${p.designCode}*\nProduct: ${p.name}\nColor: ${p.color}\nPrice Range: ${p.priceBucket}\nStock Status: ${p.stockQuantity > 10 ? 'Available' : 'Limited Stock'}`;
  };

  const copyImageToClipboard = async (product: Product, imageUrl: string) => {
    setCopyingImgId(product.id);
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(blob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Context failed');
      ctx.drawImage(img, 0, 0);

      // Add Code and Color watermark on the copied image
      const colorText = product.color ? ` | Color: ${product.color}` : '';
      const watermarkText = `Code: ${product.designCode}${colorText}`;
      const fontSize = Math.max(20, Math.floor(canvas.width / 25));
      ctx.font = `bold ${fontSize}px sans-serif`;
      
      const padding = Math.floor(fontSize * 0.8);
      const bgHeight = fontSize + padding * 2;
      
      // Draw semi-transparent background at the bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, canvas.height - bgHeight, canvas.width, bgHeight);
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(watermarkText, canvas.width / 2, canvas.height - bgHeight / 2);

      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) {
          setCopyingImgId(null);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob })
          ]);
          alert('Product image copied to clipboard! Paste it directly in WhatsApp.');
        } catch (err) {
          await navigator.clipboard.writeText(imageUrl);
          alert('Copied image URL to clipboard!');
        }
        setCopyingImgId(null);
      }, 'image/png');
    } catch (error) {
      console.error(error);
      await navigator.clipboard.writeText(imageUrl);
      alert('Copied image URL to clipboard!');
      setCopyingImgId(null);
    }
  };

  const copyTextToClipboard = async (productId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTextId(productId);
      setTimeout(() => setCopiedTextId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (isCustomersLoading || isProductsLoading) {
    return <div className="p-8"><Skeleton className="h-full w-full min-h-[600px]" /></div>;
  }

  // Map recommendation types to display config
  const recDisplayConfig = [
    { type: 'Recommended For Them', color: 'text-brand-primary', title: 'Recommended for Them' },
    { type: 'Bestseller List', color: 'text-emerald-600', title: 'Bestseller List' },
    { type: 'Dead Stock Push', color: 'text-rose-600', title: 'Dead Stock Possibility' },
    { type: 'Under 5 Piece Alert', color: 'text-amber-600', title: 'Under 5 Pcs Stock' },
    { type: 'Curated For You', color: 'text-purple-600', title: 'Curated For You' },
    { type: 'Trending Right Now', color: 'text-indigo-600', title: 'Trending Right Now' },
    { type: 'VIP Early Access', color: 'text-rose-600', title: '👑 VIP Early Access' },
  ] as const;

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-brand-bg relative">

      {/* WhatsApp Panel Overlay */}
      <AnimatePresence>
        {showWhatsApp && selectedCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowWhatsApp(false)}
            />
            <WhatsAppPanel
              customer={selectedCustomer}
              recommendedProducts={recommendations.find((r) => r.type === 'Recommended For Them')?.products ?? []}
              bestsellerProducts={recommendations.find((r) => r.type === 'Bestseller List')?.products ?? []}
              onClose={() => setShowWhatsApp(false)}
            />
          </>
        )}
      </AnimatePresence>

      {/* COLUMN 1: Segments Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`w-full md:w-64 bg-white/50 backdrop-blur-md border-r border-slate-200 flex flex-col shrink-0 z-10 ${
          mobileView === 'segments' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="p-5 border-b border-slate-200/50">
          <h2 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
            <Filter className="h-4 w-4 text-brand-primary" />
            Segments
          </h2>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto flex-1 scrollbar-hide">
          {SEGMENTS.map((segment) => {
            const isActive = activeSegment === segment;
            const count = segmentCounts[segment];
            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={segment}
                onClick={() => {
                  setActiveSegment(segment);
                  setSelectedCustomerId(null);
                  setMobileView('list');
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-soft'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
                }`}
              >
                {isActive && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-brand-primary z-0" />
                )}
                <span className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                  <span className="flex items-center gap-2">
                    <span className="text-base">{SEGMENT_EMOJIS[segment]}</span>
                    {segment}
                  </span>
                  <span className="flex items-center gap-1">
                    {count !== undefined && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    )}
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* COLUMN 2: Customer Cards (Virtualized) */}
      <div className={`w-full md:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)] z-20 ${
        mobileView === 'list' ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="p-5 border-b border-slate-200/50 bg-slate-50/50 backdrop-blur-md space-y-3">
          <button
            onClick={() => setMobileView('segments')}
            className="md:hidden flex items-center gap-1.5 text-brand-primary text-xs font-bold mb-1"
          >
            &larr; View Segments
          </button>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
            <Input
              placeholder="Search by Name..."
              className="pl-10 bg-white border-slate-200 shadow-sm transition-all focus-visible:ring-brand-primary h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center text-xs flex-wrap gap-4">
            <span className="text-slate-500 font-medium">Showing {filteredCustomers.length} parties</span>
            <Badge
              variant="secondary"
              className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 cursor-pointer shadow-none border-none"
              onClick={() => { setSearchTerm(''); setActiveSegment('All Parties'); }}
            >
              Clear Filters
            </Badge>
          </div>
        </div>

        <div ref={parentRef} className="flex-1 overflow-y-auto scrollbar-hide p-3">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const customer = filteredCustomers[virtualRow.index];
              const isSelected = selectedCustomerId === customer.id;
              const score = partyScores.get(customer.id) ?? customer.partyScore;
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="px-1 py-1"
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setMobileView('detail');
                    }}
                    className={`h-full bg-white p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-primary ring-1 ring-brand-primary shadow-md'
                        : 'border-slate-200 hover:border-brand-primary/40 shadow-sm'
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-sm mb-1.5 truncate pr-4">{customer.name}</div>
                    <div className="flex justify-between items-center text-xs flex-wrap gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-500">Score:</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded-md ${getScoreColor(score)}`}>
                          {score}
                        </span>
                      </span>
                      <span className="text-slate-400 font-medium truncate max-w-[120px]">{customer.mobileNumber}</span>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
          {filteredCustomers.length === 0 && (
            <div className="text-center text-slate-400 text-sm p-8">No parties match this filter.</div>
          )}
        </div>
      </div>

      {/* COLUMN 3: Details & Recommendations */}
      <div className={`flex-1 bg-brand-bg overflow-y-auto scrollbar-hide relative ${
        mobileView === 'detail' ? 'block' : 'hidden md:block'
      }`}>
        <AnimatePresence mode="wait">
          {selectedCustomer ? (
            <SlideInRight key={selectedCustomer.id} className="min-h-full p-4 md:p-8 max-w-6xl mx-auto space-y-8">
              <button
                onClick={() => setMobileView('list')}
                className="md:hidden flex items-center gap-1.5 text-brand-primary text-xs font-bold mb-4"
              >
                &larr; Back to List
              </button>

              {/* ── Top Row: Info Cards ──────────────────────────────────────── */}
              <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Party Info */}
                <StaggerItem className="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <PenTool className="h-4 w-4 text-brand-primary" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Party Info</h4>
                    {/* WhatsApp Button */}
                    <button
                      onClick={() => setShowWhatsApp(true)}
                      className="ml-auto h-8 w-8 bg-[#25D366] text-white rounded-lg flex items-center justify-center hover:bg-[#1ebe5c] transition-colors shadow-sm"
                      title="Open WhatsApp Commerce"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-1">{selectedCustomer.name}</h2>

                  {/* Party Score Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1 flex-wrap gap-4">
                      <span className="text-xs font-bold text-slate-500">Party Score</span>
                      <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${getScoreColor(selectedScore)}`}>{selectedScore}/100</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedScore}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${getScoreBar(selectedScore)}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="flex justify-between border-b border-slate-50 pb-2 flex-wrap gap-4">
                      <span className="text-slate-400">Mobile</span>
                      <span className="font-medium text-slate-900">{selectedCustomer.mobileNumber}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-50 pb-2 flex-wrap gap-4">
                      <span className="text-slate-400">State</span>
                      <span className="font-medium text-slate-900">{selectedCustomer.state}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-50 pb-2 flex-wrap gap-4">
                      <span className="text-slate-400">Business</span>
                      <span className="font-medium text-slate-900">{selectedCustomer.businessType}</span>
                    </p>
                    <p className="flex justify-between flex-wrap gap-4">
                      <span className="text-slate-400">GST</span>
                      <span className="font-mono text-xs text-slate-700">{selectedCustomer.gstNumber}</span>
                    </p>
                  </div>
                </StaggerItem>

                {/* Voice Notes (replaces mocked player) */}
                <StaggerItem className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-soft">
                  <VoiceNotePanel customerId={selectedCustomer.id} customerName={selectedCustomer.name} />
                </StaggerItem>

                {/* Purchase History */}
                <StaggerItem className="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft hover:shadow-lg transition-shadow flex flex-col">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Recent History</h4>
                  {isPurchasesLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div className="space-y-3 text-sm flex-1">
                      {purchases?.slice(0, 3).map((p) => (
                        <div key={p.id} className="flex justify-between items-center group flex-wrap gap-4">
                          <span className="text-slate-600 truncate pr-3 group-hover:text-brand-primary transition-colors">{p.productName}</span>
                          <span className="font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-md">x{p.quantity}</span>
                        </div>
                      ))}
                      {(!purchases || purchases.length === 0) && (
                        <p className="text-slate-400 text-xs">No purchase history</p>
                      )}
                    </div>
                  )}
                  <Button variant="ghost" className="w-full mt-4 text-xs font-semibold text-brand-primary hover:bg-brand-primary/5">
                    View All Transactions &rarr;
                  </Button>
                </StaggerItem>
              </StaggerContainer>

              {/* ── Active Sales Orders Section ────────────────────────────────── */}
              {customerSalesOrders && customerSalesOrders.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Active Sales Orders</h3>
                        <p className="text-xs text-slate-500">Track pending dispatches and overdue statuses for this party</p>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                      {customerSalesOrders.length} Orders
                    </span>
                  </div>
                  <div className="p-5 overflow-x-auto">
                    <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-400 font-bold">
                          <th className="py-2">Order No</th>
                          <th className="py-2">Product</th>
                          <th className="py-2 text-right">Order Pcs</th>
                          <th className="py-2 text-right">Pending Pcs</th>
                          <th className="py-2 text-right">Amount</th>
                          <th className="py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {customerSalesOrders.map((o) => {
                          const matchedProduct = products?.find(pr => pr.designCode === o.productCode);
                          const imgUrl = getOptimizedImageUrl(matchedProduct?.imageUrl, o.productCode);
                          return (
                            <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 font-bold text-slate-700">#{o.orderNo}</td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded overflow-hidden shrink-0 border border-slate-200">
                                    <img src={imgUrl} alt={o.productCode} loading="lazy" className="h-full w-full object-cover" />
                                  </div>
                                  <span className="text-slate-600">{o.productCode} ({o.color})</span>
                                </div>
                              </td>
                              <td className="py-2 text-right">{o.orderPcs}</td>
                              <td className="py-2 text-right font-bold text-indigo-600">{o.balPcs}</td>
                              <td className="py-2 text-right font-black text-slate-900">₹{o.amount.toLocaleString()}</td>
                              <td className="py-2 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  o.balPcs === 0 ? 'bg-emerald-100 text-emerald-700' :
                                  o.overDueDays > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {o.balPcs === 0 ? 'Completed' : o.overDueDays > 0 ? `Overdue (${o.overDueDays}d)` : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
</div>
                  </div>
                </div>
              )}

              {/* ── Party Intelligence Section ────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                <button
                  onClick={() => setShowIntelligence((v) => !v)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors flex-wrap gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-900 text-base">Party Intelligence</h3>
                      <p className="text-xs text-slate-500">CLV, revenue contribution, preferences & growth potential</p>
                    </div>
                  </div>
                  {showIntelligence ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showIntelligence && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* CLV */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                          <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider">Lifetime Value</p>
                          <p className="text-xl font-black text-slate-900 mt-1">₹{(clv / 100000).toFixed(1)}L</p>
                          <p className="text-[10px] text-slate-500 mt-1">Projected 3-year CLV</p>
                        </div>

                        {/* AOV */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Avg Order Value</p>
                          <p className="text-xl font-black text-slate-900 mt-1">₹{selectedCustomer.averageOrderValue.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 mt-1">Per transaction</p>
                        </div>

                        {/* Revenue Contribution */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Revenue Share</p>
                          <p className="text-xl font-black text-slate-900 mt-1">{revenueContrib}%</p>
                          <p className="text-[10px] text-slate-500 mt-1">Of total revenue</p>
                        </div>

                        {/* Growth Potential */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Growth Potential</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xl font-black text-slate-900">{growthPotential}</p>
                            <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${growthPotential}%` }} />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Upsell opportunity</p>
                        </div>
                      </div>

                      {/* Tags and Preferences */}
                      {customerTags && (
                        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Customer Profile Tags</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { label: customerTags.priceRange, color: 'bg-purple-100 text-purple-700' },
                                { label: customerTags.purchaseFrequencyTier, color: 'bg-blue-100 text-blue-700' },
                                { label: customerTags.revenueTier, color: 'bg-emerald-100 text-emerald-700' },
                                { label: customerTags.partyScoreTier, color: 'bg-amber-100 text-amber-700' },
                                { label: customerTags.categoryPreference, color: 'bg-pink-100 text-pink-700' },
                                { label: customerTags.colorPreference, color: 'bg-indigo-100 text-indigo-700' },
                                { label: customerTags.lastPurchaseDate, color: 'bg-slate-100 text-slate-600' },
                                { label: customerTags.lastContactDate, color: 'bg-rose-100 text-rose-700' },
                              ].map((tag, i) => (
                                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-bold ${tag.color}`}>
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Behaviour</p>
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-xs font-bold text-slate-700">{paymentBehaviour}</p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  {selectedCustomer.purchaseFrequency} purchases · ₹{selectedCustomer.revenueGenerated.toLocaleString()} total spend
                                </p>
                              </div>
                            </div>

                            {/* Mini Order Trend */}
                            <div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Order Trend</p>
                              <div className="h-16">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={orderTrend}>
                                    <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2} dot={false} />
                                    <Tooltip
                                      formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Amount']}
                                      contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Last 10 Purchases */}
                      {purchases && purchases.length > 0 && (
                        <div className="border-t border-slate-100 px-5 pb-5">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 mt-4">Last {Math.min(10, purchases.length)} Purchases</p>
                          <div className="overflow-x-auto">
                            <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-100">
                                  <th className="text-left py-2 text-slate-400 font-bold">Product</th>
                                  <th className="text-right py-2 text-slate-400 font-bold">Qty</th>
                                  <th className="text-right py-2 text-slate-400 font-bold">Amount</th>
                                  <th className="text-right py-2 text-slate-400 font-bold">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {purchases.slice(0, 10).map((p) => (
                                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-2 pr-4 font-medium text-slate-700 truncate max-w-[160px]">{p.productName}</td>
                                    <td className="py-2 text-right font-bold text-indigo-600">{p.quantity}</td>
                                    <td className="py-2 text-right font-bold text-emerald-600">₹{p.amount.toLocaleString()}</td>
                                    <td className="py-2 text-right text-slate-400">{format(new Date(p.date), 'dd MMM yy')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
</div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Tag-Based AI Recommendation Panel ───────────────────────── */}
              <RecommendationPanel customerId={selectedCustomer.id} />

              {/* ── Rule-Based Recommendations ──────────────────────────────── */}
              <StaggerContainer className="space-y-8 pt-2">
                {recDisplayConfig.map((config) => {
                  const rec = recommendations.find((r) => r.type === config.type);
                  const items = rec?.products ?? [];
                  if (items.length === 0) return null;

                  return (
                    <StaggerItem
                      key={config.type}
                      className="flex items-stretch gap-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-soft transition-shadow"
                    >
                      <div className="w-48 shrink-0 flex flex-col justify-center gap-1">
                        <h3 className={`font-bold text-sm ${config.color}`}>{config.title}</h3>
                        {rec?.reason && (
                          <p className="text-[10px] text-slate-400 leading-relaxed">{rec.reason}</p>
                        )}
                      </div>

                      <div className="flex-1 flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-hide px-2">
                        {items.map((p) => (
                          <motion.div
                            whileHover={{ y: -4, scale: 1.05 }}
                            key={p.id}
                            onClick={(e) => toggleImageSelection(p.id, e)}
                            className={`w-24 h-24 shrink-0 rounded-xl overflow-hidden border shadow-sm relative group cursor-pointer ${selectedImageIds.has(p.id) ? 'border-brand-primary ring-2 ring-brand-primary/50' : 'border-slate-200'}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedImageIds.has(p.id)}
                              readOnly
                              className="absolute top-1.5 right-1.5 z-20 h-4 w-4 rounded border-white/50 bg-black/20 text-brand-primary focus:ring-brand-primary pointer-events-none"
                            />
                            <img 
                              src={getOptimizedImageUrl(p.imageUrl, p.id)} 
                              onError={(e) => { e.currentTarget.src = getLehengaFallback(p.id); }}
                              alt="" 
                              loading="lazy"
                              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${selectedImageIds.has(p.id) ? 'scale-105' : ''}`} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 z-10 pointer-events-none">
                              <span className="text-[10px] text-white font-bold truncate">{p.designCode}</span>
                              <span className="text-[10px] text-white/80">{p.stockQuantity} in stock</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="w-28 shrink-0 flex flex-col items-center justify-center gap-2 pl-2 border-l border-slate-100">
                        {items.some(p => selectedImageIds.has(p.id)) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const selected = items.filter(p => selectedImageIds.has(p.id));
                              handleCopy(selected, config.title);
                              setShowWhatsApp(true);
                            }}
                            className="bg-[#25D366] hover:bg-[#1ebe5c] text-white shadow-md shadow-[#25D366]/20 w-full rounded-xl"
                          >
                            <MessageCircle className="h-4 w-4 mr-1.5" /> Send
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleCopy(items, config.title)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 w-full rounded-xl"
                        >
                          <Copy className="h-4 w-4 mr-1.5" /> Copy
                        </Button>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>

              {/* ── Direct WhatsApp Copy-Paste & Media Hub ── */}
              <FadeIn delay={0.4} className="bg-[#131722] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Zap className="h-5 w-5 text-emerald-400" />
                      Quick Send & Media Hub
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Tap cards to select — copy images & text in bulk or individually.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const allIds = Array.from(new Set(recommendations.flatMap(r => r.products))).slice(0, 10).map(p => p.id);
                        if (selectedImageIds.size === allIds.length) {
                          setSelectedImageIds(new Set());
                        } else {
                          setSelectedImageIds(new Set(allIds));
                        }
                      }}
                      className="border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-full text-[10px] h-8 px-4"
                    >
                      {selectedImageIds.size > 0 && selectedImageIds.size === Array.from(new Set(recommendations.flatMap(r => r.products))).slice(0, 10).length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      onClick={() => setShowWhatsApp(true)}
                      className="bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold rounded-full flex items-center gap-1.5 h-8 px-4 text-xs"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Gather all unique recommended products from all tabs */}
                  {Array.from(new Set(recommendations.flatMap(r => r.products))).slice(0, 10).map((p) => {
                    const isImgCopying = copyingImgId === p.id;
                    const isTextCopied = copiedTextId === p.id;
                    const descText = getProductCopyText(p);
                    const isSelected = selectedImageIds.has(p.id);

                    // Fetch actual drive image using catalog folders
                    const folder = catalogFolders.find(f => f.folder_name === p.designCode);
                    let driveImgUrl = getOptimizedImageUrl(p.imageUrl, p.id);
                    if (driveImgUrl.startsWith('http') && folder && folder.thumbnail_url) {
                      driveImgUrl = getOptimizedImageUrl(folder.thumbnail_url, p.id);
                    }
                    
                    const colors = (p.color || '').split(/[,\/]/).map(c => c.trim()).filter(Boolean);

                    return (
                      <div 
                        key={p.id} 
                        onClick={(e) => toggleImageSelection(p.id, e)}
                        className={`bg-[#1E253A] border ${isSelected ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-white/5'} rounded-2xl p-3 flex flex-col justify-between hover:bg-[#252D43] transition-all group cursor-pointer`}
                      >
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-black/20 mb-3 bg-black">
                          <img 
                            src={driveImgUrl} 
                            onError={(e) => { e.currentTarget.src = getLehengaFallback(p.id); }}
                            alt={p.name} 
                            loading="lazy"
                            crossOrigin="anonymous"
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isSelected ? 'scale-105 opacity-90' : ''}`} 
                          />
                          <div className="absolute top-2 right-2 z-10">
                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-black/20 border-white/40'}`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-sm flex items-center gap-1.5 max-w-[90%] overflow-hidden">
                            <span>#{p.designCode}</span>
                            {p.color && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/50 shrink-0" />
                                <span className="text-white/90 truncate capitalize">{p.color}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col" onClick={e => e.stopPropagation()}>
                          <h4 className="text-[13px] font-bold text-white line-clamp-1 mb-1">Classic #{p.designCode}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <span className="border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 rounded-full px-2 py-0.5 text-[9px] font-bold">General</span>
                            {colors.slice(0, 2).map((c, i) => (
                              <span key={i} className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${i === 0 ? 'bg-amber-500/10 text-amber-200' : 'bg-purple-500/10 text-purple-200'}`}>
                                {c}
                              </span>
                            ))}
                          </div>
                          
                          <div className="mt-auto space-y-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); copyImageToClipboard(p, driveImgUrl); }}
                                disabled={isImgCopying}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-[11px] font-bold rounded-xl h-8 flex-1 flex items-center justify-center gap-1.5"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                {isImgCopying ? '...' : 'Copy'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const a = document.createElement('a');
                                  a.href = driveImgUrl;
                                  a.download = `${p.designCode}.jpg`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                                className="bg-[#2C344A] hover:bg-[#38425C] text-slate-300 rounded-xl h-8 w-8 px-0 flex shrink-0 items-center justify-center"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); copyTextToClipboard(p.id, descText); }}
                              className={`${
                                isTextCopied ? 'bg-emerald-600/20 text-emerald-400' : 'bg-[#2C344A] text-slate-300 hover:bg-[#38425C]'
                              } text-[11px] font-bold rounded-xl h-8 w-full flex items-center justify-center gap-1.5 transition-colors`}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {isTextCopied ? 'Copied Text!' : 'Copy Text'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FadeIn>
              {/* End of details panel */}
            </SlideInRight>
          ) : (
            <FadeIn className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <button
                onClick={() => setMobileView('list')}
                className="md:hidden flex items-center gap-1.5 text-brand-primary text-xs font-bold mb-4"
              >
                &larr; Back to List
              </button>
              <div className="h-24 w-24 bg-white rounded-full shadow-soft flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-brand-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Party Selected</h3>
              <p className="text-slate-500 max-w-sm text-center">
                Click on any party from the list on the left to instantly load their intelligence dashboard.
              </p>
            </FadeIn>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Missing icon import fix ───────────────────────────────────────────────────
function Brain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

