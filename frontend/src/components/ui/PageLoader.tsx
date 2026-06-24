import React from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function PageLoader() {
  return (
    <div className="flex-1 w-full h-full min-h-[50vh] flex flex-col items-center justify-center bg-brand-bg relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center justify-center gap-6"
      >
        <div className="relative">
          {/* Outer rotating ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-brand-primary border-l-brand-primary"
          />
          {/* Inner pulse logo */}
          <motion.div 
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-8 w-8 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/30">
              <span className="text-white font-black text-sm">S</span>
            </div>
          </motion.div>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">SRS CRM</h2>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <RefreshCw className="h-3 w-3 animate-spin text-brand-primary" />
            Loading Workspace
          </div>
        </div>
      </motion.div>
    </div>
  );
}
