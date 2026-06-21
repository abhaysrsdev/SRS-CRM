import { useState, useMemo } from 'react';
import { useCustomers, useProducts } from '../hooks/useQueries';
import { Skeleton } from '../components/ui/skeleton';
import { FadeIn } from '../components/ui/motion';
import {
  BookMarked, Download, Copy, Share2, ChevronRight, Search,
  Star, Flame, Package, TrendingDown, Zap, CheckCircle2, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Customer, Product } from '../types';
import { getLehengaFallback } from '../lib/utils';
import {
  getBestsellerList, getDeadStockPushList, getTrendingProducts,
  getVIPEarlyAccessCatalog, getCuratedForCustomer,
} from '../lib/recommendationEngine';
import { batchComputeScores } from '../lib/customerEngine';

type CatalogType = 'vip' | 'bestseller' | 'deadstock' | 'trending' | 'curated';

const CATALOG_TYPES: { type: CatalogType; label: string; emoji: string; color: string; bg: string; description: string }[] = [
  { type: 'vip',        label: 'VIP Catalog',            emoji: '👑', color: '#7c3aed', bg: 'from-purple-500 to-indigo-600',   description: 'Exclusive designs for premium buyers'         },
  { type: 'bestseller', label: 'Bestseller Catalog',     emoji: '⭐', color: '#10b981', bg: 'from-emerald-500 to-teal-600',   description: 'Top 20% revenue products'                     },
  { type: 'deadstock',  label: 'Dead Stock Clearance',   emoji: '🔴', color: '#ef4444', bg: 'from-rose-500 to-red-600',       description: 'Clearance catalog for stuck inventory'        },
  { type: 'trending',   label: 'Trending Right Now',     emoji: '🔥', color: '#f59e0b', bg: 'from-amber-500 to-orange-600',   description: 'Fastest moving products this season'          },
  { type: 'curated',    label: 'Curated For Customer',   emoji: '✨', color: '#6366f1', bg: 'from-indigo-500 to-blue-600',    description: 'Personalized selection based on history'      },
];

function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
    >
      <div className="relative h-40 overflow-hidden bg-slate-50">
        <img 
          src={product.imageUrl || getLehengaFallback(product.id)} 
          onError={(e) => { e.currentTarget.src = getLehengaFallback(product.id); }}
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
          {product.stockQuantity} pcs
        </div>
      </div>
      <div className="p-3">
        <p className="font-black text-slate-900 text-sm">#{product.designCode}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{product.priceBucket}</span>
          <span className="text-xs font-bold text-indigo-600">{product.color}</span>
        </div>
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-primary rounded-full" style={{ width: `${product.demandScore}%` }} />
        </div>
        <p className="text-[9px] text-slate-400 mt-0.5 text-right">Demand: {product.demandScore}</p>
      </div>
    </motion.div>
  );
}

export function CatalogBuilder() {
  const { data: customers, isLoading: cl } = useCustomers();
  const { data: products, isLoading: pl } = useProducts();
  const [activeCatalog, setActiveCatalog] = useState<CatalogType | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const partyScores = useMemo(() => {
    if (!customers) return new Map<string, number>();
    return batchComputeScores(customers);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!customers || !searchCustomer) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(searchCustomer.toLowerCase())).slice(0, 8);
  }, [customers, searchCustomer]);

  const catalogProducts = useMemo(() => {
    if (!products) return [];
    if (activeCatalog === 'vip') return getVIPEarlyAccessCatalog(products, 20);
    if (activeCatalog === 'bestseller') return getBestsellerList(products, 20);
    if (activeCatalog === 'deadstock') return getDeadStockPushList(products, 20);
    if (activeCatalog === 'trending') return getTrendingProducts(products, 20);
    if (activeCatalog === 'curated' && selectedCustomer) {
      return getCuratedForCustomer(selectedCustomer, [], products, 20);
    }
    return [];
  }, [activeCatalog, products, selectedCustomer]);

  const catalogDef = CATALOG_TYPES.find((c) => c.type === activeCatalog);

  const generateTextCatalog = () => {
    if (!catalogProducts.length) return '';
    const header = `🛍️ ${catalogDef?.label} — Shree Radha Studio\n${'─'.repeat(40)}\n\n`;
    const items = catalogProducts.map((p, i) =>
      `${i + 1}. ${p.name}\n   Code: #${p.designCode} | Color: ${p.color} | Price: ${p.priceBucket} | Stock: ${p.stockQuantity} pcs\n`
    ).join('\n');
    const footer = `\n${'─'.repeat(40)}\n📞 Contact Shree Radha Studio for orders\n✅ Bulk orders welcome`;
    return header + items + footer;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateTextCatalog());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (cl || pl) return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;

  return (
    <div className="min-h-full bg-brand-bg pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1700px] mx-auto px-8 py-5">
          <FadeIn>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                <BookMarked className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Catalog Builder</h1>
                <p className="text-sm text-slate-500 mt-0.5">Generate, preview and share product catalogs</p>
              </div>
              {activeCatalog && catalogProducts.length > 0 && (
                <div className="ml-auto flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
                  >
                    {copied ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Text</>}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-bold rounded-xl transition-all text-sm shadow-md shadow-brand-primary/20"
                  >
                    <Download className="h-4 w-4" /> Export PDF
                  </motion.button>
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-8 py-8 space-y-8">
        {/* Catalog Type Selector */}
        <FadeIn>
          <div>
            <h2 className="font-black text-slate-900 text-lg mb-4">Select Catalog Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              {CATALOG_TYPES.map((ct) => (
                <motion.button
                  key={ct.type}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setActiveCatalog(ct.type); setGenerated(true); }}
                  className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all shadow-md border-2 ${
                    activeCatalog === ct.type ? 'border-white ring-4 shadow-xl' : 'border-transparent'
                  }`}
                  style={activeCatalog === ct.type ? { boxShadow: `0 8px 30px ${ct.color}40` } : {}}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${ct.bg} opacity-90`} />
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -mr-6 -mt-6" />
                  <div className="relative z-10">
                    <div className="text-3xl mb-2">{ct.emoji}</div>
                    <h4 className="font-black text-white text-sm leading-tight">{ct.label}</h4>
                    <p className="text-white/70 text-[10px] mt-1">{ct.description}</p>
                    {activeCatalog === ct.type && (
                      <div className="mt-3 bg-white/20 rounded-full px-3 py-1 text-center">
                        <span className="text-white text-[10px] font-black">▼ Active</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Customer selector for Curated */}
        {activeCatalog === 'curated' && (
          <FadeIn delay={0.1}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
              <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2">
                <Search className="h-5 w-5 text-brand-primary" /> Select Customer for Personalized Catalog
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer name..."
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="w-full px-4 py-3 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              {filteredCustomers.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setSearchCustomer(c.name); }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                        selectedCustomer?.id === c.id
                          ? 'bg-brand-primary/10 text-brand-primary font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{c.state}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* Catalog Preview */}
        {activeCatalog && catalogProducts.length > 0 && (
          <FadeIn delay={0.15}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black text-slate-900 text-lg">
                    {catalogDef?.emoji} {catalogDef?.label}
                  </h2>
                  <p className="text-sm text-slate-500">{catalogProducts.length} products · {catalogDef?.description}</p>
                </div>
                <button
                  onClick={() => setActiveCatalog(null)}
                  className="h-8 w-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {catalogProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>

              {/* Share Footer */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{catalogProducts.length} Products Ready</p>
                  <p className="text-xs text-slate-500">Copy text catalog or export as PDF</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm">
                    {copied ? '✓ Copied!' : <><Copy className="h-4 w-4" /> Copy for WhatsApp</>}
                  </button>
                  <button onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 text-sm hover:bg-brand-secondary transition-all">
                    <Download className="h-4 w-4" /> Export PDF
                  </button>
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {!activeCatalog && (
          <FadeIn delay={0.2}>
            <div className="text-center py-20 text-slate-400">
              <BookMarked className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">Select a Catalog Type Above</h3>
              <p className="text-sm">Choose from VIP, Bestseller, Dead Stock, Trending, or Curated catalog</p>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
