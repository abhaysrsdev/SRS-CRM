import React, { useState, useCallback, useRef } from 'react';
import { useCustomers } from '../hooks/useQueries';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Database, Server, HardDrive, RefreshCw, AlertTriangle, CheckCircle2,
  Upload, FileSpreadsheet, Users, ShoppingCart, Package, Bell, FileText,
  X, Loader2, ChevronDown, ChevronRight, Eye, Trash2,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { parseExcelFile, validateColumns, detectDuplicates, parseSalesOrdersSheet } from '../lib/excelParser';
import {
  saveUploadStatus, getUploadStatus, dbPutMany, dbClear,
  type SheetType, type UploadStatus,
} from '../lib/db';
import { api, API_BASE_URL } from '../lib/api';

// ─── Sheet Definitions ────────────────────────────────────────────────────────
const SHEETS: {
  type: SheetType;
  label: string;
  icon: React.FC<any>;
  color: string;
  bg: string;
  border: string;
  description: string;
  requiredColumns: string[];
  storeKey: string;
}[] = [
  {
    type: 'customerMaster',
    label: 'Central Data Hub Excel Loader',
    icon: Database,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Master Excel data from Central Data Hub. Data is synced and updated accordingly over time.',
    requiredColumns: ['Party Name'], // Minimized required columns for flexibility
    storeKey: 'customers',
  },
  {
    type: 'salesOrders',
    label: 'Sales Order Details Loader',
    icon: ShoppingCart,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    description: 'Active sales order spreadsheet details. Keeps order balances and salesman tracking updated.',
    requiredColumns: ['Customer', 'Product', 'Amount'],
    storeKey: 'salesOrders',
  }
];

// ─── Upload State ─────────────────────────────────────────────────────────────
type UploadState = 'idle' | 'processing' | 'validating' | 'storing' | 'success' | 'error';

interface SheetUploadState {
  state: UploadState;
  fileName?: string;
  rowCount?: number;
  duplicateCount?: number;
  errors?: string[];
  warnings?: string[];
  mappedColumns?: Record<string, string>;
  uploadedAt?: string;
}

// ─── DropZone Component ───────────────────────────────────────────────────────
function DropZone({
  sheet,
  uploadState,
  onFile,
  onClear,
}: {
  sheet: typeof SHEETS[0];
  uploadState: SheetUploadState;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
        onFile(file);
      }
    },
    [onFile]
  );

  const isSuccess = uploadState.state === 'success';
  const isError = uploadState.state === 'error';
  const isProcessing = ['processing', 'validating', 'storing'].includes(uploadState.state);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative rounded-2xl border-2 transition-all overflow-hidden ${
        isDragging
          ? `border-brand-primary bg-brand-primary/5 shadow-lg shadow-brand-primary/20`
          : isSuccess
          ? `${sheet.border} ${sheet.bg}`
          : isError
          ? 'border-rose-300 bg-rose-50'
          : 'border-dashed border-slate-200 bg-white hover:border-brand-primary/40 hover:bg-slate-50/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${isSuccess ? sheet.bg.replace('bg-', 'bg-') : 'bg-transparent'}`}
        style={{ background: isSuccess ? undefined : undefined }}>
        {isSuccess && <div className={`h-full w-full ${sheet.color.replace('text-', 'bg-').replace('-600', '-400')}`} />}
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
            isSuccess ? `${sheet.bg} ${sheet.border} border` : 'bg-slate-100'
          }`}>
            {isProcessing ? (
              <Loader2 className={`h-6 w-6 animate-spin ${sheet.color}`} />
            ) : isSuccess ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : isError ? (
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            ) : (
              <sheet.icon className={`h-6 w-6 ${isSuccess ? sheet.color : 'text-slate-400'}`} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap gap-4">
              <h4 className="font-bold text-slate-900 text-sm">{sheet.label}</h4>
              {isSuccess && (
                <button
                  onClick={onClear}
                  className="h-6 w-6 rounded-full bg-slate-100 hover:bg-rose-100 flex items-center justify-center transition-colors group"
                >
                  <X className="h-3 w-3 text-slate-400 group-hover:text-rose-600" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{sheet.description}</p>

            {/* Required columns hint */}
            {uploadState.state === 'idle' && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sheet.requiredColumns.map((col) => (
                  <span key={col} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {col}
                  </span>
                ))}
              </div>
            )}

            {/* Processing state */}
            {isProcessing && (
              <div className="mt-2">
                <div className="text-xs text-slate-600 font-medium">
                  {uploadState.state === 'processing' && '📂 Reading file...'}
                  {uploadState.state === 'validating' && '🔍 Validating columns...'}
                  {uploadState.state === 'storing' && '💾 Saving to database...'}
                </div>
                <div className="h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    animate={{ width: ['20%', '80%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-full bg-brand-primary rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Success state */}
            {isSuccess && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-700 font-semibold">✓ {uploadState.rowCount?.toLocaleString()} records imported</span>
                  {(uploadState.duplicateCount ?? 0) > 0 && (
                    <span className="text-amber-600 font-medium">⚠ {uploadState.duplicateCount} duplicates removed</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {uploadState.fileName} · {uploadState.uploadedAt && new Date(uploadState.uploadedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                {uploadState.warnings && uploadState.warnings.length > 0 && (
                  <div className="text-[10px] text-amber-600 font-medium">
                    ⚠ {uploadState.warnings.length} optional columns not found
                  </div>
                )}
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="mt-2 space-y-1">
                {uploadState.errors?.map((err, i) => (
                  <div key={i} className="text-xs text-rose-700 font-medium flex items-start gap-1">
                    <span className="shrink-0">✗</span> {err}
                  </div>
                ))}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-xs text-rose-600 font-semibold underline mt-1"
                >
                  Try again with a different file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload button */}
        {uploadState.state === 'idle' && (
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-4 w-full py-2 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-500 font-medium hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Drop .xlsx / .xls / .csv here, or click to browse
          </button>
        )}

        {/* Mapped columns preview */}
        {isSuccess && uploadState.mappedColumns && Object.keys(uploadState.mappedColumns).length > 0 && (
          <details className="mt-3">
            <summary className="text-[10px] font-bold text-slate-400 cursor-pointer hover:text-slate-600 flex items-center gap-1">
              <Eye className="h-3 w-3" /> View column mapping
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {Object.entries(uploadState.mappedColumns).map(([field, actual]) => (
                <div key={field} className="text-[10px] bg-white/60 rounded-lg px-2 py-1 border border-slate-100">
                  <span className="text-slate-400">{field}:</span>{' '}
                  <span className="text-slate-700 font-semibold">"{actual}"</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </motion.div>
  );
}

// ─── Main DataHub Component ───────────────────────────────────────────────────
export function DataHub() {
  const { data: customers, isLoading } = useCustomers();
  const [activeTab, setActiveTab] = useState<'overview' | 'upload'>('overview');
  const [uploadStates, setUploadStates] = useState<Record<SheetType, SheetUploadState>>(
    () => Object.fromEntries(SHEETS.map((s) => [s.type, { state: 'idle' }])) as Record<SheetType, SheetUploadState>
  );
  const [savedStatuses, setSavedStatuses] = useState<UploadStatus[]>([]);

  // Load saved upload statuses on mount
  React.useEffect(() => {
    getUploadStatus().then((statuses) => {
      setSavedStatuses(statuses);
      // Restore UI state for successful uploads
      const restored: Partial<Record<SheetType, SheetUploadState>> = {};
      for (const status of statuses) {
        if (status.status === 'success') {
          restored[status.sheetType] = {
            state: 'success',
            fileName: status.fileName,
            rowCount: status.rowCount,
            uploadedAt: status.uploadedAt,
          };
        }
      }
      if (Object.keys(restored).length > 0) {
        setUploadStates((prev) => ({ ...prev, ...restored }));
      }
    });
  }, []);

  const setSheetState = (type: SheetType, state: Partial<SheetUploadState>) => {
    setUploadStates((prev) => ({ ...prev, [type]: { ...prev[type], ...state } }));
  };

  const handleFile = async (sheet: typeof SHEETS[0], file: File) => {
    setSheetState(sheet.type, { state: 'processing', fileName: file.name });

    try {
      // 1. Parse Excel
      const { rows, headers } = await parseExcelFile(file);
      setSheetState(sheet.type, { state: 'validating' });

      // 2. Validate columns
      const validation = validateColumns(headers, sheet.type);
      if (!validation.valid) {
        setSheetState(sheet.type, {
          state: 'error',
          errors: validation.errors,
        });
        return;
      }

      // 3. Detect duplicates
      const nameField = Object.keys(validation.mappedColumns)[0];
      const { uniqueRows, duplicateCount } = detectDuplicates(rows, nameField ?? Object.keys(rows[0] ?? {})[0]);

      setSheetState(sheet.type, { state: 'storing' });

      // 4. Store in IndexedDB
      const timestamp = new Date().toISOString();
      const records = uniqueRows.map((row, i) => ({
        ...row,
        _id: `${sheet.type}_${i}_${timestamp}`,
        _sheetType: sheet.type,
        _fileName: file.name,
        _importedAt: timestamp,
      }));

      // Clear existing and store new
      if (sheet.type === 'salesOrders') {
        const parsedOrders = parseSalesOrdersSheet(rows, headers);
        const res = await fetch(`${API_BASE_URL}/sales-orders/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedOrders),
        });
        if (!res.ok) throw new Error('Failed to upload sales orders to server');
      } else {
        await dbClear(sheet.storeKey === 'inventory' ? 'narrations' : sheet.storeKey);
        await dbPutMany(sheet.storeKey === 'inventory' ? 'narrations' : sheet.storeKey, records.map((r) => ({ ...r, id: r._id })));
      }

      // Save status
      const status: UploadStatus = {
        sheetType: sheet.type,
        uploadedAt: timestamp,
        rowCount: uniqueRows.length,
        fileName: file.name,
        status: 'success',
      };
      await saveUploadStatus(status);

      setSheetState(sheet.type, {
        state: 'success',
        rowCount: uniqueRows.length,
        duplicateCount,
        errors: [],
        warnings: validation.warnings,
        mappedColumns: validation.mappedColumns,
        uploadedAt: timestamp,
      });

      setSavedStatuses((prev) => {
        const filtered = prev.filter((s) => s.sheetType !== sheet.type);
        return [...filtered, status];
      });
    } catch (err) {
      setSheetState(sheet.type, {
        state: 'error',
        errors: [err instanceof Error ? err.message : 'Unknown error processing file'],
      });
    }
  };

  const handleClear = async (sheet: typeof SHEETS[0]) => {
    await dbClear(sheet.storeKey === 'inventory' ? 'narrations' : sheet.storeKey);
    const status: UploadStatus = {
      sheetType: sheet.type,
      uploadedAt: '',
      rowCount: 0,
      fileName: '',
      status: 'error',
    };
    await saveUploadStatus(status);
    setSheetState(sheet.type, { state: 'idle', fileName: undefined, rowCount: undefined });
    setSavedStatuses((prev) => prev.filter((s) => s.sheetType !== sheet.type));
  };

  const totalUploaded = Object.values(uploadStates).filter((s) => s.state === 'success').length;
  const totalRecords = Object.values(uploadStates).reduce((sum, s) => sum + (s.rowCount || 0), 0);

  if (isLoading || !customers) {
    return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;
  }

  const totalCustomerRecords = customers.length;
  const missingPhones = customers.filter((c) => !c.mobileNumber || c.mobileNumber === 'N/A').length;

  const mockSyncData = [
    { time: '08:00', records: 2800 },
    { time: '10:00', records: 2850 },
    { time: '12:00', records: 2900 },
    { time: '14:00', records: 2920 },
    { time: '16:00', records: totalCustomerRecords },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-brand-bg relative overflow-y-auto overflow-x-hidden scrollbar-hide">

      {/* ── Header (unchanged) ─────────────────────────────────────────────── */}
      <div className="p-8 pb-4 bg-white/50 backdrop-blur-md border-b border-slate-200 shadow-sm z-10 shrink-0">
        <FadeIn>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Data Hub</h2>
              <p className="text-muted-foreground mt-1 text-sm">Ledger Synchronization & Integrity Analytics.</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {totalUploaded > 0 && (
                <div className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-xl border border-brand-primary/20 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {totalUploaded}/{SHEETS.length} Sheets Uploaded
                </div>
              )}
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 font-semibold text-sm">
                <RefreshCw className="h-4 w-4 animate-spin-slow" />
                Live Sync Active
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 mt-5 bg-slate-100 p-1 rounded-xl w-fit">
          {(['overview', 'upload'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'overview' ? '📊 Overview' : '📤 Upload Center'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {/* ── TAB: OVERVIEW (existing content preserved) ─────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-8 space-y-8 max-w-7xl mx-auto w-full"
          >
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StaggerItem className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl"><Server className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Total Ledgers</p>
                  <h3 className="text-3xl font-black text-slate-900">{totalCustomerRecords}</h3>
                </div>
              </StaggerItem>

              <StaggerItem className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertTriangle className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Missing Contacts</p>
                  <h3 className="text-3xl font-black text-slate-900">{missingPhones}</h3>
                </div>
              </StaggerItem>

              <StaggerItem className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle2 className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Data Health</p>
                  <h3 className="text-3xl font-black text-slate-900">
                    {Math.round(((totalCustomerRecords - missingPhones) / totalCustomerRecords) * 100)}%
                  </h3>
                </div>
              </StaggerItem>
            </StaggerContainer>

            <FadeIn delay={0.3}>
              <Card className="shadow-soft border-slate-100 rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-slate-500" />
                    Ledger Synchronization History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockSyncData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="records" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRecords)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </FadeIn>
          </motion.div>
        )}

        {/* ── TAB: UPLOAD CENTER ─────────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-8 max-w-7xl mx-auto w-full space-y-8"
          >
            {/* Upload Center Header */}
            <FadeIn>
              <div className="flex items-start justify-between gap-6 flex-wrap gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <FileSpreadsheet className="h-7 w-7 text-brand-primary" />
                    Excel Upload Center
                  </h3>
                  <p className="text-slate-500 mt-1 text-sm max-w-2xl">
                    Upload your business Excel sheets to power the AI engine. Data is validated, de-duplicated and stored securely in your browser's local database.
                    Once uploaded, all CRM scores, recommendations and insights will use your real data.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-2xl font-black text-slate-900">{totalUploaded}<span className="text-slate-400 font-normal text-base">/{SHEETS.length}</span></div>
                  <div className="text-xs text-slate-500 font-medium">Sheets Active</div>
                  {totalRecords > 0 && (
                    <div className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                      {totalRecords.toLocaleString()} records total
                    </div>
                  )}
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(totalUploaded / SHEETS.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"
                />
              </div>
            </FadeIn>

            {/* Tips Banner */}
            <FadeIn delay={0.1}>
              <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-4 flex items-start gap-3">
                <div className="h-8 w-8 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-brand-primary text-sm">How it works</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Columns are <strong>auto-detected</strong> — your Excel does not need to match any specific format. Headers are matched intelligently.
                    Duplicates are detected by party name and removed automatically. Data is stored in your browser's IndexedDB (no server required).
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {SHEETS.map((sheet, i) => (
                <motion.div
                  key={sheet.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <DropZone
                    sheet={sheet}
                    uploadState={uploadStates[sheet.type]}
                    onFile={(file) => handleFile(sheet, file)}
                    onClear={() => handleClear(sheet)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Upload Summary Table */}
            {savedStatuses.filter((s) => s.status === 'success').length > 0 && (
              <FadeIn delay={0.3}>
                <Card className="shadow-soft border-slate-100 rounded-2xl">
                  <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Upload Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase">Sheet</th>
                          <th className="text-right px-5 py-3 text-xs font-black text-slate-400 uppercase">Records</th>
                          <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase">File</th>
                          <th className="text-right px-5 py-3 text-xs font-black text-slate-400 uppercase">Uploaded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {savedStatuses
                          .filter((s) => s.status === 'success')
                          .map((s) => {
                            const sheetDef = SHEETS.find((sh) => sh.type === s.sheetType);
                            return (
                              <tr key={s.sheetType} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    {sheetDef && <sheetDef.icon className={`h-4 w-4 ${sheetDef.color}`} />}
                                    <span className="font-semibold text-slate-800">{sheetDef?.label}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-right font-black text-emerald-600">{s.rowCount.toLocaleString()}</td>
                                <td className="px-5 py-3 text-slate-500 text-xs">{s.fileName}</td>
                                <td className="px-5 py-3 text-right text-xs text-slate-400">
                                  {s.uploadedAt ? new Date(s.uploadedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
</div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
