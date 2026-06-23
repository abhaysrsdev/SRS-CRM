import React from 'react';
import { Settings, Moon, Sun, Volume2, Maximize, Database, Download, RefreshCw, MessageCircle, Link, Key, Users } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Badge } from '../ui/badge';

export function SettingsSheet() {
  const toggleDarkMode = () => {
    // legacy function kept for lint
  };
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [compactMode, setCompactMode] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Google Drive Catalog successfully synced!');
    }, 2000);
  };

  return (
    <Sheet>
      <SheetTrigger className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors focus:outline-none">
        <Settings className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l-0 sm:border-l sm:rounded-l-3xl shadow-2xl">
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-10 border-b border-slate-100 p-6">
          <SheetHeader>
            <SheetTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5 text-slate-700" />
              </div>
              Control Center
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Account Overview */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-xl font-black">
                S
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight">Shree Radha Studio</h3>
                <p className="text-indigo-100 text-xs font-medium">Administrator Account</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-none">PRO Plan</Badge>
              <Badge className="bg-emerald-400/20 text-emerald-100 border-0 shadow-none flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
              </Badge>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Maximize className="h-4 w-4" /> Preferences
            </h4>
            <div className="space-y-1 bg-slate-50 border border-slate-100 rounded-2xl p-2">


              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors cursor-pointer" onClick={() => setSoundEnabled(!soundEnabled)}>
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${soundEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Notification Sounds</p>
                    <p className="text-xs text-slate-500">Play chime for alerts</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

            </div>
          </div>

          {/* Data Management */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Database className="h-4 w-4" /> Data Management
            </h4>
            <div className="space-y-3">
              <Button onClick={handleSync} disabled={isSyncing} className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 justify-start h-12 rounded-xl shadow-sm">
                <RefreshCw className={`h-4 w-4 mr-3 text-brand-primary ${isSyncing ? 'animate-spin' : ''}`} />
                <div className="text-left flex-1">
                  <p className="font-bold text-sm">Sync Google Drive</p>
                  <p className="text-[10px] text-slate-500">Force fetch new catalog images</p>
                </div>
              </Button>
              <Button className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 justify-start h-12 rounded-xl shadow-sm">
                <Download className="h-4 w-4 mr-3 text-indigo-500" />
                <div className="text-left flex-1">
                  <p className="font-bold text-sm">Export CRM Data</p>
                  <p className="text-[10px] text-slate-500">Download Excel/CSV backup</p>
                </div>
              </Button>
            </div>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Link className="h-4 w-4" /> Integrations
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                <div className="h-8 w-8 bg-[#25D366]/20 text-[#25D366] rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">WhatsApp API</p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Supabase DB</p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </SheetContent>
    </Sheet>
  );
}
