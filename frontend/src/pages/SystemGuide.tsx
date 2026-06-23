import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Palette, LayoutDashboard, Users, FileSpreadsheet, Activity, 
  Package, Bell, Map, UserPlus, HelpCircle, ArrowRight, ChevronDown,
  Zap, Target, Database
} from 'lucide-react';

const SEGMENT_COLORS = [
  { label: 'High Ranking Parties', color: '#10b981', bg: 'bg-emerald-500', textBg: 'bg-emerald-50', textColor: 'text-emerald-700', meaning: 'Top-tier customers with 20+ purchases. Priority follow-up. Maximum engagement.', icon: '🏆' },
  { label: 'Mid Revenue Parties', color: '#3b82f6', bg: 'bg-blue-500', textBg: 'bg-blue-50', textColor: 'text-blue-700', meaning: 'Active buyers with 3–20 purchases. Growth potential. Send personalized offers.', icon: '📈' },
  { label: 'Purchased < 3 Times', color: '#f59e0b', bg: 'bg-amber-500', textBg: 'bg-amber-50', textColor: 'text-amber-700', meaning: 'New or occasional buyers. Need nurturing. Share bestseller catalogs.', icon: '🌱' },
  { label: 'Cold Leads', color: '#6366f1', bg: 'bg-indigo-500', textBg: 'bg-indigo-50', textColor: 'text-indigo-700', meaning: 'No purchases yet. Send awareness content and introductory offers.', icon: '❄️' },
  { label: 'Lot Parties', color: '#94a3b8', bg: 'bg-slate-400', textBg: 'bg-slate-50', textColor: 'text-slate-600', meaning: 'Inactive / churned customers. Target with win-back campaigns and discounts.', icon: '🔴' },
];

const MAP_COLORS = [
  { label: 'Red Zone', color: '#ef4444', meaning: 'Very High Density / Revenue > ₹2Cr in territory', icon: '🔴' },
  { label: 'Orange Zone', color: '#f97316', meaning: 'High Revenue Territory > ₹1Cr', icon: '🟠' },
  { label: 'Yellow Zone', color: '#eab308', meaning: 'Medium Revenue Territory > ₹30L', icon: '🟡' },
  { label: 'Blue Zone', color: '#3b82f6', meaning: 'Emerging / Low Revenue territory', icon: '🔵' },
];

const INVENTORY_COLORS = [
  { label: 'Bestsellers', color: '#10b981', meaning: 'Top performing products with highest demand score.' },
  { label: 'Running Products', color: '#3b82f6', meaning: 'Moving consistently. Good stock health.' },
  { label: 'High Stock', color: '#f59e0b', meaning: 'Overstocked. Consider promotional pricing.' },
  { label: 'Stuck Stock', color: '#f97316', meaning: 'Not selling. Discount offers or bundle deals needed.' },
  { label: 'Dead Stock', color: '#ef4444', meaning: 'Zero movement. Liquidate or reallocate immediately.' },
  { label: 'Under 5 Piece', color: '#8b5cf6', meaning: 'Critical low stock alert. Reorder immediately.' },
];

const MODULES = [
  { icon: LayoutDashboard, path: '/', label: 'Dashboard', color: 'bg-indigo-100 text-indigo-600', desc: 'Real-time overview of all CRM KPIs including total revenue, customer counts, segment breakdown, and interaction history.' },
  { icon: Users, path: '/crm-lists', label: 'CRM Lists', color: 'bg-blue-100 text-blue-600', desc: 'Full searchable table of all Sundry Debtors from the Excel sheet. Filter by segment, state, revenue range. Click any row to view full party profile.' },
  { icon: FileSpreadsheet, path: '/data-hub', label: 'Data Hub', color: 'bg-emerald-100 text-emerald-600', desc: 'Analytical breakdown of your customer base. View segments, revenue trends, top parties, and behavioral patterns in chart form.' },
  { icon: Activity, path: '/interactions', label: 'Interactions', color: 'bg-purple-100 text-purple-600', desc: 'Timeline of all customer interactions: calls, meetings, demos. Filter by date range and contact type.' },
  { icon: Package, path: '/inventory', label: 'Inventory Insights', color: 'bg-amber-100 text-amber-600', desc: 'Visual breakdown of your product catalog by category. See bestsellers, dead stock, and under-5-piece alerts. Animated charts.' },
  { icon: Bell, path: '/reminders', label: 'Reminders', color: 'bg-rose-100 text-rose-600', desc: 'Smart follow-up reminder system for your parties. Set, edit and dismiss reminders linked directly to customer records.' },
  { icon: Map, path: '/map', label: 'Intelligence Map', color: 'bg-teal-100 text-teal-600', desc: 'Enterprise geospatial analytics with supercluster algorithm. Drill down from country → state → city → individual seller. Filter by category.' },
  { icon: UserPlus, path: '/add-lead', label: 'Add Lead', color: 'bg-pink-100 text-pink-600', desc: 'Add new Sundry Debtors directly into the CRM. Auto-classification into correct segment on submission.' },
  { icon: HelpCircle, path: '/help', label: 'Help Center', color: 'bg-slate-100 text-slate-600', desc: 'Documentation, FAQs and system usage guide for the CRM platform.' },
];

// Flowchart node types
const __FLOW_NODES = [
  { id: 1, label: 'Excel Data Upload', sublabel: '2,938 Ledger Records', color: 'from-indigo-500 to-indigo-700', icon: '📊', x: 'center' },
  { id: 2, label: 'Data Engine Parses', sublabel: 'Filter: Only Sundry Debtors', color: 'from-slate-600 to-slate-800', icon: '⚙️', x: 'center' },
  { id: 3, label: 'Customer Classification', sublabel: 'By Segment & Behavior', color: 'from-violet-500 to-violet-700', icon: '🔍', x: 'center' },
  { id: '3a', label: '🏆 High Ranking', color: 'from-emerald-500 to-emerald-700', icon: '', x: 'left' },
  { id: '3b', label: '📈 Mid Revenue', color: 'from-blue-500 to-blue-700', icon: '', x: 'center-left' },
  { id: '3c', label: '🌱 < 3 Purchases', color: 'from-amber-500 to-amber-700', icon: '', x: 'center-right' },
  { id: '3d', label: '🔴 Lot Parties', color: 'from-slate-400 to-slate-600', icon: '', x: 'right' },
  { id: 4, label: 'CRM Modules Activated', sublabel: 'All 9 Modules Live', color: 'from-teal-500 to-teal-700', icon: '🚀', x: 'center' },
  { id: '4a', label: 'Dashboard', color: 'from-indigo-400 to-indigo-600', icon: '📊', x: 'left' },
  { id: '4b', label: 'Map Intelligence', color: 'from-teal-400 to-teal-600', icon: '🗺️', x: 'center-left' },
  { id: '4c', label: 'Inventory', color: 'from-amber-400 to-amber-600', icon: '📦', x: 'center-right' },
  { id: '4d', label: 'Reminders', color: 'from-rose-400 to-rose-600', icon: '🔔', x: 'right' },
  { id: 5, label: 'Sales Actions Triggered', sublabel: 'Follow-up → Close → Revenue', color: 'from-emerald-600 to-emerald-800', icon: '💰', x: 'center' },
];

function AccordionSection({ title, icon: Icon, color, children }: any) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 ${color} rounded-2xl flex items-center justify-center shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-slate-50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple CRM Flowchart using pure CSS/HTML
function CRMFlowchart() {
  const steps = [
    { emoji: '📊', title: 'Excel Data Source', desc: '2,938 Ledger Records Loaded', color: 'bg-indigo-600', from: null },
    { emoji: '⚙️', title: 'Parse & Filter Engine', desc: 'Keep only Sundry Debtors', color: 'bg-slate-700', from: '↓' },
    { emoji: '🔍', title: 'Smart Classification', desc: 'Segment by Frequency & Revenue', color: 'bg-violet-600', from: '↓' },
  ];

  const segments = [
    { emoji: '🏆', title: 'High Ranking', desc: '20+ Purchases', color: 'bg-emerald-600' },
    { emoji: '📈', title: 'Mid Revenue', desc: '3-20 Purchases', color: 'bg-blue-600' },
    { emoji: '🌱', title: 'Cold Leads', desc: '1-2 Purchases', color: 'bg-amber-500' },
    { emoji: '🔴', title: 'Lot Parties', desc: '0 Purchases', color: 'bg-slate-400' },
  ];

  const modules = [
    { emoji: '📊', title: 'Dashboard', color: 'bg-indigo-500' },
    { emoji: '👥', title: 'CRM Lists', color: 'bg-blue-500' },
    { emoji: '🗺️', title: 'Map Intel', color: 'bg-teal-500' },
    { emoji: '📦', title: 'Inventory', color: 'bg-amber-500' },
    { emoji: '🔔', title: 'Reminders', color: 'bg-rose-500' },
    { emoji: '📁', title: 'Data Hub', color: 'bg-purple-500' },
  ];

  const actions = [
    { emoji: '📞', title: 'Follow-Up Calls', color: 'bg-emerald-700' },
    { emoji: '🎯', title: 'Targeted Offers', color: 'bg-indigo-700' },
    { emoji: '💰', title: 'Revenue Growth', color: 'bg-amber-700' },
  ];

  return (
    <div className="mt-6 space-y-4">
      {/* Step 1-3 */}
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center">
          {step.from && <div className="h-6 w-0.5 bg-slate-300 mb-1" />}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`${step.color} text-white px-8 py-4 rounded-2xl shadow-lg flex items-center gap-4 w-full max-w-lg`}
          >
            <span className="text-3xl">{step.emoji}</span>
            <div>
              <h4 className="font-black text-lg">{step.title}</h4>
              <p className="text-white/80 text-sm">{step.desc}</p>
            </div>
          </motion.div>
        </div>
      ))}

      {/* Segment Fork */}
      <div className="flex flex-col items-center">
        <div className="h-6 w-0.5 bg-slate-300" />
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {segments.map((seg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`${seg.color} text-white px-4 py-3 rounded-xl shadow-md flex items-center gap-2 min-w-[130px]`}
            >
              <span className="text-xl">{seg.emoji}</span>
              <div>
                <p className="font-bold text-sm">{seg.title}</p>
                <p className="text-white/75 text-xs">{seg.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Merge Arrow */}
      <div className="flex flex-col items-center">
        <div className="h-6 w-0.5 bg-slate-300" />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="bg-teal-600 text-white px-8 py-4 rounded-2xl shadow-lg flex items-center gap-4 w-full max-w-lg"
        >
          <span className="text-3xl">🚀</span>
          <div>
            <h4 className="font-black text-lg">CRM Modules Activated</h4>
            <p className="text-white/80 text-sm">All 9 Modules Work Together in Real-Time</p>
          </div>
        </motion.div>
      </div>

      {/* Modules Grid */}
      <div className="flex flex-col items-center">
        <div className="h-6 w-0.5 bg-slate-300" />
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {modules.map((mod, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className={`${mod.color} text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2`}
            >
              <span className="text-lg">{mod.emoji}</span>
              <span className="font-bold text-sm">{mod.title}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final Actions */}
      <div className="flex flex-col items-center">
        <div className="h-6 w-0.5 bg-slate-300" />
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {actions.map((act, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${act.color} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2`}
            >
              <span className="text-xl">{act.emoji}</span>
              <span className="font-bold">{act.title}</span>
            </motion.div>
          ))}
        </div>
        <div className="h-6 w-0.5 bg-slate-300" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-10 py-5 rounded-2xl shadow-xl flex items-center gap-4"
        >
          <span className="text-4xl">💰</span>
          <div>
            <h4 className="font-black text-xl">Business Growth</h4>
            <p className="text-white/80">Track → Engage → Convert → Retain</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function SystemGuide() {
  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-12">
      
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-indigo-400 blur-3xl" />
          <div className="absolute bottom-0 right-20 w-96 h-96 rounded-full bg-purple-400 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-8 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest">CRM Documentation</p>
                <h1 className="text-4xl font-black">System Guide & Color Reference</h1>
              </div>
            </div>
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
              A complete visual guide to how every module of your CRM works, what each color means, and how data flows from your Excel sheet to business insights.
            </p>
            <div className="flex gap-4 mt-8 flex-wrap">
              {['9 Modules', '2,938 Records', 'Real-time Analytics', 'Enterprise Map'].map((badge, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="bg-white/10 border border-white/20 text-white text-sm font-bold px-4 py-2 rounded-full backdrop-blur-sm"
                >
                  {badge}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12 space-y-8">

        {/* Module Overview */}
        <AccordionSection title="All CRM Modules" icon={LayoutDashboard} color="bg-indigo-100 text-indigo-600">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {MODULES.map((mod, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 ${mod.color} rounded-xl flex items-center justify-center`}>
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{mod.label}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{mod.desc}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-3 font-mono">{mod.path}</p>
              </motion.div>
            ))}
          </div>
        </AccordionSection>

        {/* Customer Segment Color Guide */}
        <AccordionSection title="Customer Segment Colors" icon={Palette} color="bg-purple-100 text-purple-600">
          <p className="text-sm text-slate-500 mt-4 mb-6">Every customer in the CRM is automatically classified into one of these segments based on their purchase frequency and revenue generated.</p>
          <div className="space-y-3">
            {SEGMENT_COLORS.map((seg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`${seg.textBg} border border-opacity-20 rounded-2xl p-5 flex items-center gap-5 hover:shadow-sm transition-all`}
                style={{ borderColor: seg.color + '40' }}
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-5 h-5 rounded-full shadow-md shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="font-black text-slate-900 flex items-center gap-2">
                    <span className="text-xl">{seg.icon}</span>
                    {seg.label}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                <p className={`text-sm ${seg.textColor} font-medium`}>{seg.meaning}</p>
              </motion.div>
            ))}
          </div>
        </AccordionSection>

        {/* Map Colors */}
        <AccordionSection title="Map Intelligence Color Scale" icon={Map} color="bg-teal-100 text-teal-600">
          <p className="text-sm text-slate-500 mt-4 mb-6">The Enterprise Sales Intelligence Map uses a revenue-density heatmap color scale. Cluster size also represents total revenue in that territory.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MAP_COLORS.map((mc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl shadow-lg shrink-0 flex items-center justify-center text-2xl" style={{ backgroundColor: mc.color + '20', border: `2px solid ${mc.color}` }}>
                  {mc.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{mc.label}</h4>
                  <p className="text-xs text-slate-500 mt-1">{mc.meaning}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 bg-slate-900 rounded-2xl p-5 text-white">
            <h4 className="font-bold mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-indigo-400" /> Map Category Icons</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[['🔥', 'Hot', 'Purchase Freq 20+'], ['🟡', 'Warm', 'Freq 3–20'], ['🔵', 'Cold', 'Freq 1–2'], ['🔴', 'Lot', 'Freq = 0']].map(([emoji, name, desc], i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <p className="font-bold text-sm">{name}</p>
                  <p className="text-white/60 text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AccordionSection>

        {/* Inventory Colors */}
        <AccordionSection title="Inventory Category Colors" icon={Package} color="bg-amber-100 text-amber-600">
          <p className="text-sm text-slate-500 mt-4 mb-6">Products in the Inventory Insights section are classified into these categories based on stock quantity and demand score.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {INVENTORY_COLORS.map((ic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3"
              >
                <div className="w-4 h-4 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: ic.color }} />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{ic.label}</h4>
                  <p className="text-xs text-slate-500 mt-1">{ic.meaning}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AccordionSection>

        {/* Data Flow Explanation */}
        <AccordionSection title="How Data Flows" icon={Database} color="bg-slate-100 text-slate-600">
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '📊', title: 'Excel Upload', desc: 'Your ledger Excel file is loaded and parsed at startup. All 2,938 rows are read.' },
              { step: '02', icon: '⚙️', title: 'Smart Filter', desc: 'Only Sundry Debtor rows pass through. All Creditors are automatically excluded.' },
              { step: '03', icon: '🔍', title: 'Classification', desc: 'Each customer is tagged with a Segment based on purchase frequency and revenue.' },
              { step: '04', icon: '📍', title: 'Geo-Mapping', desc: 'Customer state field is read and mapped to lat/lng coordinates for the map engine.' },
              { step: '05', icon: '🗺️', title: 'Clustering', desc: 'Supercluster algorithm groups nearby customers into territory clusters in real-time.' },
              { step: '06', icon: '📈', title: 'Analytics', desc: 'Revenue, outstanding amounts, follow-up counts and insights are computed on-the-fly.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative bg-white border border-slate-100 rounded-2xl p-5 shadow-soft hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="absolute top-4 right-4 text-slate-100 font-black text-3xl">{item.step}</div>
                <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </AccordionSection>

        {/* CRM Flowchart */}
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">CRM System Flowchart</h3>
              <p className="text-sm text-slate-500 mt-0.5">End-to-end data journey from Excel source to business results</p>
            </div>
          </div>
          <div className="px-6 pb-8">
            <CRMFlowchart />
          </div>
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-3xl p-8 text-center shadow-xl"
        >
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-2xl font-black mb-3">Enterprise CRM — Built for Your Business</h3>
          <p className="text-white/80 max-w-2xl mx-auto text-sm leading-relaxed">
            This entire CRM was built from your real ledger data. Every number, every color, every segment is driven by actual records from your Excel file — giving you real-time insights into your sales territory.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
