import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, ShieldAlert, FolderSync, Info, AlertTriangle, FileText, CheckCircle2, History } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';

export function CatalogSyncCenter() {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [reports, setReports] = useState<any>({
    empty_folders: [],
    broken_images: [],
    missing_images: [],
    duplicate_folders: []
  });
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'reports'>('logs');

  useEffect(() => {
    fetchSyncStatus();
    fetchReports();

    // Poll status when syncing
    const interval = setInterval(() => {
      fetchSyncStatus();
      fetchReports();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalog/sync/status');
      const data = await res.json();
      setSyncStatus(data);
      setSyncing(data.is_syncing);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalog/reports/');
      const data = await res.json();
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSync = async (reSync = false) => {
    setSyncing(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/catalog/sync/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ re_sync: reSync })
      });
      const data = await res.json();
      setSyncStatus(data);
    } catch (e) {
      console.error(e);
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
        <Link to="/catalog" className="hover:text-brand-primary">Catalog</Link>
        <span>&middot;</span>
        <span className="text-slate-900">Sync Center</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
            <FolderSync className="h-7 w-7 text-brand-primary" />
            Catalog Sync Center
          </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage and audit Google Drive synchronization processes.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={() => handleSync(false)}
            disabled={syncing}
            className="bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl gap-2 shadow-md shadow-brand-primary/20 h-10 px-4"
          >
            <Play className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSync(true)}
            disabled={syncing}
            className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl gap-2 h-10 px-4 bg-white"
          >
            <RefreshCw className="h-4 w-4" />
            Full Re-Sync
          </Button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncing && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
          <div className="text-xs md:text-sm">
            <span className="font-bold text-blue-900">Sync in progress:</span>{' '}
            <span className="text-blue-700 font-medium">{syncStatus?.progress || 'Syncing files recursively...'}</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Folders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{syncStatus?.total_folders || 0}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">Directories mapped from Drive</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{syncStatus?.total_images || 0}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">Image assets synced successfully</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-wider">Last Synced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-slate-900 truncate">
              {syncStatus?.last_sync ? new Date(syncStatus.last_sync).toLocaleString() : 'Never'}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-bold">Timestamp of latest catalog scan</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-wider">Sync Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge className={`${syncing ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'} font-black text-[10px] px-2 py-0.5 rounded-lg border-none shadow-none`}>
              {syncing ? 'Syncing' : 'Idle / Up to Date'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-soft flex flex-col min-h-[400px]">
        <div className="border-b border-slate-100 bg-slate-50/50 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4" /> Sync Logs
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'reports' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="h-4 w-4" /> Error Reports
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          {activeTab === 'logs' ? (
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-[11px] flex-1 overflow-y-auto min-h-[300px] max-h-[450px]">
              {syncStatus?.logs && syncStatus.logs.length > 0 ? (
                syncStatus.logs.map((log: string, idx: number) => (
                  <div key={idx} className="py-0.5 leading-relaxed">{log}</div>
                ))
              ) : (
                <div className="text-slate-500 italic">No sync activity logs found. Click "Sync Now" to start.</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Empty Folders */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Empty Folders ({reports.empty_folders.length})
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-48 overflow-y-auto text-xs space-y-1.5">
                  {reports.empty_folders.length > 0 ? (
                    reports.empty_folders.map((item: string, idx: number) => (
                      <div key={idx} className="text-slate-700 font-medium truncate">{item}</div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic">No empty folders detected.</div>
                  )}
                </div>
              </div>

              {/* Duplicate Folders */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> Duplicate Folder Names ({reports.duplicate_folders.length})
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-48 overflow-y-auto text-xs space-y-1.5">
                  {reports.duplicate_folders.length > 0 ? (
                    reports.duplicate_folders.map((item: string, idx: number) => (
                      <div key={idx} className="text-slate-700 font-medium truncate">{item}</div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic">No duplicate folder names detected.</div>
                  )}
                </div>
              </div>

              {/* Broken / Rate-limited Images */}
              <div className="space-y-2 md:col-span-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-500" /> Broken Links / Failed Folders ({reports.broken_images.length})
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-h-48 overflow-y-auto text-xs space-y-1.5">
                  {reports.broken_images.length > 0 ? (
                    reports.broken_images.map((item: string, idx: number) => (
                      <div key={idx} className="text-slate-700 font-medium truncate">{item}</div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic">No failed directory sync operations detected.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
