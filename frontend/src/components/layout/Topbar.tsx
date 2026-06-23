import React, { useState } from 'react';
import { Bell, Search, Settings, Lightbulb, Menu } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAppStore } from '../../store';
import { motion } from 'framer-motion';
import { NotificationsDropdown } from './NotificationsDropdown';
import { SettingsSheet } from './SettingsSheet';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const toggleInsightsPanel = useAppStore((state) => state.toggleInsightsPanel);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm relative z-40">
      <div className="flex items-center flex-1 max-w-xl mr-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden mr-2 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 shrink-0"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
          <Input
            placeholder="Search CRM..."
            className="w-full pl-10 bg-slate-50 border-transparent focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all rounded-xl text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={toggleInsightsPanel}
            className="gap-1 md:gap-2 bg-gradient-to-r from-brand-primary to-indigo-600 text-white shadow-md shadow-brand-primary/20 hover:shadow-lg transition-all rounded-xl border-0 h-9 px-3"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="font-semibold hidden sm:inline text-xs md:text-sm">AI Insights</span>
          </Button>
        </motion.div>

        <div className="h-8 w-px bg-slate-200 mx-0.5 md:mx-1" />

        <NotificationsDropdown />
        <SettingsSheet />

        {/* Company Badge */}
        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-slate-200">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-white font-black text-lg md:text-xl shrink-0">
            S
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-sm font-black text-slate-900 leading-tight">Shree Radha Studio</div>
            <div className="text-xs font-bold text-slate-500 leading-tight uppercase tracking-wider">Enterprise CRM</div>
          </div>
        </div>
      </div>
    </header>
  );
}
