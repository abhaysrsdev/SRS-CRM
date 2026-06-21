import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore } from '../../store';
import { useCustomers, useProducts, useSalesOrders } from '../../hooks/useQueries';
import { Lightbulb, X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AppLayout() {
  const { isInsightsPanelOpen, toggleInsightsPanel, aiInsights, generateInsights } = useAppStore();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: salesOrders } = useSalesOrders();

  useEffect(() => {
    if (customers && products) {
      generateInsights(customers, products, salesOrders);
    }
  }, [customers, products, salesOrders]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-brand-bg text-slate-900 font-sans overflow-hidden selection:bg-brand-primary/20">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto relative">
          <Outlet />

          {/* AI Insights Slide-Over Panel */}
          <AnimatePresence>
            {isInsightsPanelOpen && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white/90 backdrop-blur-xl shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.1)] border-l border-slate-200 z-50 p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                    <Lightbulb className="h-6 w-6 text-brand-primary" />
                    AI Smart Insights
                  </h2>
                  <button onClick={toggleInsightsPanel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                  {aiInsights.map((insight) => (
                    <motion.div
                      key={insight.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`p-4 rounded-xl border ${
                        insight.type === 'warning' ? 'bg-amber-50/50 border-amber-200' :
                        insight.type === 'success' ? 'bg-emerald-50/50 border-emerald-200' :
                        'bg-blue-50/50 border-blue-200'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                          {insight.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                          {insight.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm mb-1 ${
                            insight.type === 'warning' ? 'text-amber-900' :
                            insight.type === 'success' ? 'text-emerald-900' :
                            'text-blue-900'
                          }`}>{insight.title}</h4>
                          <p className={`text-xs leading-relaxed ${
                            insight.type === 'warning' ? 'text-amber-700' :
                            insight.type === 'success' ? 'text-emerald-700' :
                            'text-blue-700'
                          }`}>{insight.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
