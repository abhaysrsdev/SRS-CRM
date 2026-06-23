import React, { useState, useMemo } from 'react';
import { useCustomers, useSalesOrders } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Users, ShoppingBag, MapPin, Activity, HelpCircle, FileText, CheckCircle2,
  AlertTriangle, Search, Filter, Plus, Edit2, Trash2, ShieldAlert,
  GitBranch, RefreshCw, Send, Check, Trash, PlusCircle, UserCheck, Settings,
  Eye, BookOpen, Key, Link2, Copy, FileCheck, HelpCircle as QuestionMark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface CustomerMaster {
  id: string;
  name: string;
  category: 'Wholesale' | 'Retail' | 'Export';
  segment: 'VIP' | 'Premium' | 'Regular';
  gst: string;
  creditLimit: number;
  salesman: string;
  broker: string;
  status: 'Active' | 'Inactive';
}

interface ProductMaster {
  sku: string;
  name: string;
  category: string;
  lifecycle: 'Active' | 'Phase Out' | 'Discontinued';
  rate: number;
}

export function MasterDataCenter() {
  const { data: rawCustomers } = useCustomers();
  const { data: rawOrders } = useSalesOrders();

  const [activeTab, setActiveTab] = useState<'records' | 'territories' | 'templates' | 'workflows' | 'quality' | 'search' | 'portals'>('records');
  const [darkMode] = useState(() => localStorage.getItem('crm-dark-mode') === 'true');

  // --- Sub-module 1: Customers Master State ---
  const [customersList, setCustomersList] = useState<CustomerMaster[]>([
    { id: '1', name: 'Surat Garments', category: 'Wholesale', segment: 'VIP', gst: '24ABCDE1234A1Z5', creditLimit: 500000, salesman: 'Rajesh Kumar', broker: 'DIRECT', status: 'Active' },
    { id: '2', name: 'Radha Textiles', category: 'Wholesale', segment: 'Premium', gst: '24FGHIJ5678B1Z6', creditLimit: 300000, salesman: 'Sanjay Sharma', broker: 'Karan Traders', status: 'Active' },
    { id: '3', name: 'Surat Garments LLC (Dup)', category: 'Wholesale', segment: 'Regular', gst: '24ABCDE1234A1Z5', creditLimit: 200000, salesman: 'Rajesh Kumar', broker: 'DIRECT', status: 'Active' }
  ]);
  const [newCustName, setNewCustName] = useState('');
  const [newCustGst, setNewCustGst] = useState('');
  const [newCustLimit, setNewCustLimit] = useState(300000);

  // --- Sub-module 2: Products Master State ---
  const [productsList, setProductsList] = useState<ProductMaster[]>([
    { sku: 'SR-COT-2026', name: 'Premium Cotton Indigo', category: 'Cotton', lifecycle: 'Active', rate: 240 },
    { sku: 'SR-SLK-9040', name: 'Banarasi Brocade Silk', category: 'Silk', lifecycle: 'Active', rate: 550 },
    { sku: 'SR-COT-2026-ALT', name: 'Premium Cotton Indigo Copy', category: 'Cotton', lifecycle: 'Active', rate: 240 }
  ]);

  // --- Sub-module 3: Brokers Master State ---
  const [brokersList, setBrokersList] = useState([
    { name: 'DIRECT', activeAccounts: 12, rate: 0, performance: 'Steady' },
    { name: 'Karan Traders', activeAccounts: 5, rate: 5, performance: 'High Growth' },
    { name: 'Vijay Fabrics Broker', activeAccounts: 3, rate: 4, performance: 'Moderate' }
  ]);

  // --- Sub-module 4: Salesman Master State ---
  const [salesmenList, setSalesmenList] = useState([
    { name: 'Rajesh Kumar', designation: 'Senior Representative', manager: 'Sanjay Sharma', revenueTarget: 1500000, achieved: 1200000 },
    { name: 'Sanjay Sharma', designation: 'Regional Head', manager: 'CEO Office', revenueTarget: 4000000, achieved: 3800000 }
  ]);

  // --- Sub-module 5 & 6: Territories & Cities State ---
  const [territoryTree, setTerritoryTree] = useState([
    { country: 'India', region: 'West', state: 'Gujarat', zone: 'South Zone', city: 'Surat', representative: 'Rajesh Kumar' },
    { country: 'India', region: 'North', state: 'Delhi', zone: 'NCR Zone', city: 'Delhi-NCR', representative: 'Vijay Verma' }
  ]);

  // --- Sub-module 8 & 9: Communication Templates Center State ---
  const [templates, setTemplates] = useState([
    { id: '1', type: 'WhatsApp', name: 'payment_overdue_alert', variables: '{{Customer Name}}, {{Pending Amount}}, {{Due Date}}', body: 'Dear {{Customer Name}}, this is an alert that a pending balance of ₹{{Pending Amount}} is overdue since {{Due Date}}.' },
    { id: '2', type: 'Email', name: 'dispatch_confirmation', variables: '{{Customer Name}}, {{Order Number}}', body: 'Hello {{Customer Name}}, your order #{{Order Number}} has been dispatched successfully.' }
  ]);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState('1');
  const [previewCustomer, setPreviewCustomer] = useState('Surat Garments');
  const [previewAmt, setPreviewAmt] = useState('1,25,000');

  // --- Sub-module 11: Visual Workflow Builder State ---
  const [workflowNodes, setWorkflowNodes] = useState([
    { id: '1', label: 'IF Pending Amount > ₹1L', type: 'Condition' },
    { id: '2', label: 'THEN Send WhatsApp Reminder', type: 'Action' },
    { id: '3', label: 'IF Overdue > 7 Days', type: 'Condition' },
    { id: '4', label: 'THEN Notify Sales Representative', type: 'Action' }
  ]);

  // --- Sub-module 13: Data Quality Center State ---
  const [dedupLogs, setDedupLogs] = useState<string[]>([
    'Warning: Duplicate GSTIN registration found on Surat Garments & Surat Garments LLC (Dup).'
  ]);

  // --- Sub-module 14: Enterprise Search State ---
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // --- Sub-module 15 & 16: Portals Simulation State ---
  const [activePortalRole, setActivePortalRole] = useState<'customer' | 'broker'>('customer');
  const [selectedPortalAccount, setSelectedPortalAccount] = useState('Surat Garments');

  // --- Actions ---
  const handleMergeCustomers = (primaryId: string, duplicateId: string) => {
    setCustomersList(customersList.filter(c => c.id !== duplicateId));
    setDedupLogs([]);
    alert('Duplicate records merged successfully. Database records unified under primary ID.');
  };

  const handleCreateCustomer = () => {
    if (!newCustName.trim() || !newCustGst.trim()) return;
    const newCust: CustomerMaster = {
      id: String(Date.now()),
      name: newCustName,
      category: 'Wholesale',
      segment: 'Regular',
      gst: newCustGst,
      creditLimit: Number(newCustLimit) || 300000,
      salesman: 'Rajesh Kumar',
      broker: 'DIRECT',
      status: 'Active'
    };
    setCustomersList([...customersList, newCust]);
    setNewCustName('');
    setNewCustGst('');
    alert(`Customer profile "${newCust.name}" registered in Customers Master.`);
  };

  const handleDeactivateCustomer = (id: string) => {
    setCustomersList(customersList.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c));
  };

  const templatePreviewParsed = useMemo(() => {
    const active = templates.find(t => t.id === selectedTemplateForPreview);
    if (!active) return '';
    return active.body
      .replace('{{Customer Name}}', previewCustomer)
      .replace('{{Pending Amount}}', previewAmt)
      .replace('{{Due Date}}', '2026-06-30')
      .replace('{{Order Number}}', '#ORD-1044');
  }, [templates, selectedTemplateForPreview, previewCustomer, previewAmt]);

  // Global Search Engine (Sub-module 14 Search Hub)
  const filteredSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return { customers: [], products: [], salesmen: [] };
    const q = globalSearchQuery.toLowerCase();
    return {
      customers: customersList.filter(c => c.name.toLowerCase().includes(q) || c.gst.toLowerCase().includes(q)),
      products: productsList.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
      salesmen: salesmenList.filter(s => s.name.toLowerCase().includes(q))
    };
  }, [globalSearchQuery, customersList, productsList, salesmenList]);

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-brand-bg text-slate-900'}`}>
      
      {/* Tab Navigation header */}
      <div className={`px-8 py-5 border-b shadow-inner ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-brand-primary to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">Master Data Center</h1>
              <p className="text-xs font-bold uppercase tracking-wider mt-0.5 text-slate-400">Enterprise Governance & Central Records</p>
            </div>
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl shadow-soft overflow-x-auto whitespace-nowrap scrollbar-hide w-full md:w-auto ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            {[
              { id: 'records', label: 'Master Registries' },
              { id: 'territories', label: 'Territories & Cities' },
              { id: 'templates', label: 'Communications Center' },
              { id: 'workflows', label: 'Workflow Designer' },
              { id: 'quality', label: 'Data Quality & Merges' },
              { id: 'search', label: 'Enterprise Search' },
              { id: 'portals', label: 'Client / Broker Portals' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-brand-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-8 py-8 space-y-8">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: MASTER REGISTRIES */}
          {activeTab === 'records' && (
            <motion.div key="records" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 text-xs font-semibold">
              
              {/* Customers Registry */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className={`lg:col-span-2 p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 text-brand-primary" /> Customers Master
                  </CardTitle>
                  <div className="overflow-x-auto">
                    <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">GSTIN</th>
                          <th className="py-2.5 px-3">Segment</th>
                          <th className="py-2.5 px-3 text-right">Credit Limit</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersList.map(c => (
                          <tr key={c.id} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                            <td className="py-3 px-3 font-mono">{c.gst}</td>
                            <td className="py-3 px-3">{c.segment}</td>
                            <td className="py-3 px-3 text-right">₹{c.creditLimit.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button onClick={() => handleDeactivateCustomer(c.id)} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white text-[9px] rounded font-bold">
                                Toggle Status
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
</div>
                  </div>

                  {/* Customer Creator form */}
                  <div className="border-t dark:border-slate-800 pt-4 mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1 text-slate-400">Customer Name</label>
                      <input type="text" value={newCustName} onChange={e=>setNewCustName(e.target.value)} placeholder="Alok Textiles" className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-400">GST Registration</label>
                      <input type="text" value={newCustGst} onChange={e=>setNewCustGst(e.target.value)} placeholder="24AAAAA1111A1Z1" className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-400">Initial Credit Limit</label>
                      <input type="number" value={newCustLimit} onChange={e=>setNewCustLimit(Number(e.target.value))} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    </div>
                    <button onClick={handleCreateCustomer} className="col-span-3 py-2 bg-indigo-600 text-white font-bold rounded-xl">
                      Register Customer in Master Data
                    </button>
                  </div>
                </Card>

                {/* Products Registry */}
                <Card className={`p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                    <ShoppingBag className="h-4 w-4 text-emerald-500" /> Products Master
                  </CardTitle>
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {productsList.map(p => (
                      <div key={p.sku} className="p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 rounded-xl flex justify-between items-center flex-wrap gap-4">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">SKU: {p.sku} | Category: {p.category}</span>
                        </div>
                        <span className="text-emerald-600 font-bold">₹{p.rate}/pc</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Brokers & Salesmen Masters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className={`p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 text-amber-500" /> Brokers Master & Commissions
                  </CardTitle>
                  <div className="space-y-3.5">
                    {brokersList.map((b, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between border dark:border-slate-850 flex-wrap gap-4">
                        <div>
                          <strong>{b.name}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Active Client Accounts: {b.activeAccounts}</span>
                        </div>
                        <span className="font-bold text-amber-600">{b.rate}% Commission Rate</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className={`p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 text-indigo-500" /> Salesmen Hierarchy & Achievements
                  </CardTitle>
                  <div className="space-y-3.5">
                    {salesmenList.map((s, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between border dark:border-slate-850 flex-wrap gap-4">
                        <div>
                          <strong>{s.name}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Title: {s.designation} | Manager: {s.manager}</span>
                        </div>
                        <span className="font-bold text-indigo-600">Target Achieved: {Math.round((s.achieved / s.revenueTarget) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

            </motion.div>
          )}

          {/* TAB 2: TERRITORIES & CITIES */}
          {activeTab === 'territories' && (
            <motion.div key="territories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs font-semibold">
              <Card className={`lg:col-span-2 p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-brand-primary" /> Region, State & City Territory Registry
                </CardTitle>
                <div className="overflow-x-auto">
                  <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
<table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Country</th>
                        <th className="py-2 px-3">Region</th>
                        <th className="py-2 px-3">State</th>
                        <th className="py-2 px-3">City Node</th>
                        <th className="py-2 px-3">Representative assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {territoryTree.map((t, idx) => (
                        <tr key={idx} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3">{t.country}</td>
                          <td className="py-3 px-3">{t.region}</td>
                          <td className="py-3 px-3 font-bold">{t.state}</td>
                          <td className="py-3 px-3 font-mono text-indigo-600">{t.city}</td>
                          <td className="py-3 px-3">{t.representative}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
</div>
                </div>
              </Card>

              {/* Tax settings */}
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-500" /> GST & Tax Settings Master
                </CardTitle>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 text-slate-400">Intra-State CGST %</label>
                    <input type="number" defaultValue={9} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Intra-State SGST %</label>
                    <input type="number" defaultValue={9} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Inter-State IGST %</label>
                    <input type="number" defaultValue={18} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <button onClick={() => alert('GST levels saved to Master Records.')} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl">
                    Save Tax Configuration
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 3: COMMUNICATIONS & TEMPLATES */}
          {activeTab === 'templates' && (
            <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs font-semibold">
              {/* Template drafts */}
              <Card className={`lg:col-span-1 p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-brand-primary" /> Active Templates
                </CardTitle>
                <div className="space-y-3">
                  {templates.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplateForPreview(t.id)}
                      className={`p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border cursor-pointer transition-colors ${
                        selectedTemplateForPreview === t.id ? 'border-brand-primary bg-indigo-50/50 dark:bg-indigo-950/20' : 'dark:border-slate-850'
                      }`}
                    >
                      <span className="font-bold block">{t.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Type: {t.type} | Vars: {t.variables}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Template Variable compiler */}
              <Card className={`lg:col-span-2 p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-500" /> Sandbox Template Variable Compiler
                </CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-slate-400">Customer Variable Value</label>
                    <input type="text" value={previewCustomer} onChange={e=>setPreviewCustomer(e.target.value)} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Pending Amount Value</label>
                    <input type="text" value={previewAmt} onChange={e=>setPreviewAmt(e.target.value)} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-850 font-mono text-[11px] leading-relaxed">
                  <span className="text-slate-400 block mb-2 font-sans font-bold">Generated Output Message Payload:</span>
                  <p className="text-slate-900 dark:text-white font-bold">{templatePreviewParsed}</p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 4: VISUAL WORKFLOW DESIGNER */}
          {activeTab === 'workflows' && (
            <motion.div key="workflows" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs font-semibold">
              {/* Visual node flowchart */}
              <Card className={`lg:col-span-2 p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <GitBranch className="h-4 w-4 text-brand-primary" /> Visual Workflow flowchart Designer
                </CardTitle>
                <div className="h-80 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-around relative bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="flex justify-around items-center">
                    {workflowNodes.slice(0, 2).map(node => (
                      <div key={node.id} className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-md text-center font-bold">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">{node.type}</span>
                        <span className="mt-1 block">{node.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-around items-center">
                    {workflowNodes.slice(2, 4).map(node => (
                      <div key={node.id} className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-md text-center font-bold">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">{node.type}</span>
                        <span className="mt-1 block">{node.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Approval rules */}
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" /> Approval Rule Engine Config
                </CardTitle>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-850">
                    <strong className="block text-slate-800 dark:text-white">Order &gt; ₹5L Trigger</strong>
                    <span className="text-[10px] text-slate-400">Escalate to Regional Sales Manager</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-850">
                    <strong className="block text-slate-800 dark:text-white">Order &gt; ₹10L Trigger</strong>
                    <span className="text-[10px] text-slate-400">Escalate to CEO / Corporate Director</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-850">
                    <strong className="block text-slate-800 dark:text-white">Credit limit increase overrides</strong>
                    <span className="text-[10px] text-slate-400">Finance Auditor Authority approval required</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 5: DATA QUALITY CENTER */}
          {activeTab === 'quality' && (
            <motion.div key="quality" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-semibold">
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Data Integrity Auditor
                </CardTitle>
                <div className="space-y-3">
                  {dedupLogs.map((log, i) => (
                    <div key={i} className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200 border border-rose-100 dark:border-rose-900 rounded-xl flex justify-between items-center font-bold leading-relaxed flex-wrap gap-4">
                      <span>{log}</span>
                      <button
                        onClick={() => handleMergeCustomers('1', '3')}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold text-[9px]"
                      >
                        Merge Profiles
                      </button>
                    </div>
                  ))}
                  {dedupLogs.length === 0 && <p className="text-slate-400 text-center py-6">Data quality tests pass. No duplicate accounts found.</p>}
                </div>
              </Card>

              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Auto Correction Suggestions
                </CardTitle>
                <div className="space-y-3 font-semibold text-slate-700 dark:text-slate-300">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-850">
                    <span className="font-bold text-slate-800 dark:text-white block">Missing GSTIN: Karan Fabrics</span>
                    <p className="text-[10px] text-slate-400 mt-1">Suggested Correction: Input registered state tax identification details.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-850">
                    <span className="font-bold text-slate-800 dark:text-white block">Unassigned Territory: Surat Garments LLC</span>
                    <p className="text-[10px] text-slate-400 mt-1">Suggested Correction: Link state node to West Region Representative.</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 6: GLOBAL SEARCH HUB */}
          {activeTab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl mx-auto text-xs font-semibold">
              <Card className={`p-6 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search across customers, products, salesmen, workflows..."
                      value={globalSearchQuery}
                      onChange={e=>setGlobalSearchQuery(e.target.value)}
                      className={`w-full p-2.5 pl-10 border rounded-xl font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}
                    />
                  </div>
                </div>

                {globalSearchQuery && (
                  <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                    {/* Customers results */}
                    {filteredSearchResults.customers.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-bold text-slate-400 uppercase text-[9px] block">Customer Registry Results</span>
                        {filteredSearchResults.customers.map(c => (
                          <div key={c.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg flex justify-between flex-wrap gap-4">
                            <span>{c.name}</span>
                            <span className="text-slate-400">Limit: ₹{c.creditLimit.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Products results */}
                    {filteredSearchResults.products.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-bold text-slate-400 uppercase text-[9px] block">Products Registry Results</span>
                        {filteredSearchResults.products.map(p => (
                          <div key={p.sku} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg flex justify-between flex-wrap gap-4">
                            <span>{p.name}</span>
                            <span className="text-slate-400">SKU: {p.sku}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* TAB 7: PORTALS SIMULATION */}
          {activeTab === 'portals' && (
            <motion.div key="portals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs font-semibold">
              <Card className={`lg:col-span-1 p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-brand-primary" /> Select Simulation Identity
                </CardTitle>
                <div className="space-y-2">
                  <button
                    onClick={() => setActivePortalRole('customer')}
                    className={`w-full py-2 px-3.5 rounded-xl font-bold text-left transition-colors ${
                      activePortalRole === 'customer' ? 'bg-brand-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    Customer Self-Service Portal
                  </button>
                  <button
                    onClick={() => setActivePortalRole('broker')}
                    className={`w-full py-2 px-3.5 rounded-xl font-bold text-left transition-colors ${
                      activePortalRole === 'broker' ? 'bg-brand-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    Broker Partner Portal
                  </button>
                </div>
              </Card>

              <Card className={`lg:col-span-2 p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                {activePortalRole === 'customer' ? (
                  <div className="space-y-4">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-indigo-500">
                      <ShoppingBag className="h-4 w-4" /> Customer Dashboard Simulator
                    </CardTitle>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-850 space-y-2">
                      <div className="flex justify-between flex-wrap gap-4">
                        <span>Dispatch Progress:</span>
                        <strong className="text-emerald-500">✓ Fully Dispatched (2,400 pcs)</strong>
                      </div>
                      <div className="flex justify-between flex-wrap gap-4">
                        <span>Available Credit Balance:</span>
                        <strong className="text-slate-900 dark:text-white">₹3,75,000 / ₹5,000,00</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-emerald-500">
                      <Activity className="h-4 w-4" /> Broker Commission Ledger
                    </CardTitle>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-850 space-y-2">
                      <div className="flex justify-between flex-wrap gap-4">
                        <span>Assigned Customers:</span>
                        <strong className="text-slate-900 dark:text-white">Radha Textiles, Delhi Garments</strong>
                      </div>
                      <div className="flex justify-between flex-wrap gap-4">
                        <span>Calculated Net Brokerage:</span>
                        <strong className="text-emerald-600">₹32,500 (calculated at 5%)</strong>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
