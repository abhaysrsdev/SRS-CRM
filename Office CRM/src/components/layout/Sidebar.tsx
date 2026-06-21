import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, FileSpreadsheet, Activity, HelpCircle, Package, Bell, Map, BookOpen, TrendingUp, BookMarked, Tag, ShoppingBag, Brain, Settings, X, FolderClosed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const topNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'CRM Lists', path: '/crm-lists' },
  { icon: FileSpreadsheet, label: 'Data Hub', path: '/data-hub' },
  { icon: Activity, label: 'Interactions', path: '/interactions' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: FolderClosed, label: 'Catalog', path: '/drive-catalog' },
  { icon: ShoppingBag, label: 'Sales Orders', path: '/sales-orders' },
  { icon: Brain, label: 'Sales Intelligence', path: '/intelligence' },
  { icon: BookOpen, label: 'Master Data Center', path: '/master-data' },
  { icon: Bell, label: 'Reminders', path: '/reminders' },
  { icon: Map, label: 'Map View', path: '/map' },
  { icon: TrendingUp, label: 'Forecasting', path: '/forecast' },
];

const bottomNavItems = [
  { icon: UserPlus, label: 'Add Lead', path: '/add-lead' },
  { icon: Tag, label: 'Tag Management', path: '/tags' },
  { icon: BookMarked, label: 'Catalog Builder', path: '/catalog' },
  { icon: BookOpen, label: 'System Guide', path: '/guide' },
  { icon: HelpCircle, label: 'Help', path: '/help' },
  { icon: Settings, label: 'Control Center', path: '/control-center' },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const sidebarContent = (
    <div className="h-full w-20 bg-brand-primary text-white flex flex-col items-center py-6 shadow-2xl relative z-50">
      {/* Close button on mobile */}
      {onClose && (
        <button onClick={onClose} className="md:hidden mb-4 p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
          <X className="h-6 w-6 text-white" />
        </button>
      )}

      <div className="mb-8 p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner shrink-0">
        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center font-bold text-brand-primary text-lg shadow-sm">
          S
        </div>
      </div>
      
      {/* Scrollable Navigation Wrapper */}
      <div className="flex-1 w-full overflow-y-auto scroll-smooth scrollbar-hide flex flex-col justify-between">
        <nav className="w-full space-y-4 px-3 flex flex-col items-center mt-4 pb-6">
          {topNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative p-3 rounded-2xl transition-all duration-300 flex justify-center w-full ${
                  isActive 
                    ? 'bg-white text-brand-primary shadow-lg shadow-black/20 scale-110' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
              title={item.label}
            >
              {({ isActive }) => (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <item.icon className={`h-6 w-6 transition-all ${isActive ? 'drop-shadow-sm' : ''}`} />
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 font-medium z-50">
                    {item.label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="w-full space-y-4 px-3 mb-4 pb-6 shrink-0">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative p-3 rounded-2xl transition-all duration-300 flex justify-center w-full ${
                  isActive 
                    ? 'bg-white text-brand-primary shadow-lg scale-110' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
              title={item.label}
            >
              {({ isActive }) => (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <item.icon className="h-6 w-6" />
                  <span className="absolute left-16 bg-slate-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium z-50">
                    {item.label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-20 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden h-screen w-20 bg-brand-primary"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
