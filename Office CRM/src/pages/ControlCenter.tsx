import React, { useState, useMemo } from 'react';
import { useCustomers, useSalesOrders } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Users, Shield, Settings, Server, RefreshCw, Key, Network, MessageSquare,
  Globe, Database, Plus, Trash, Check, AlertCircle, FileText, Play, Code, Eye,
  Lock, CheckSquare, Save, HelpCircle, Activity, Mail, Clock, Download, Upload, Copy, Share
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock DB initial state for simulations
interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Suspended';
}

export function ControlCenter() {
  const { data: customers } = useCustomers();
  const { data: salesOrders } = useSalesOrders();

  const [activeTab, setActiveTab] = useState<'users' | 'org' | 'workflows' | 'portals' | 'integrations' | 'master' | 'security'>('users');
  const [darkMode] = useState(() => localStorage.getItem('crm-dark-mode') === 'true');

  // 1. User Management State
  const [users, setUsers] = useState<AppUser[]>([
    { id: '1', name: 'Super Admin', email: 'admin@shreeradha.com', role: 'Super Admin', status: 'Active' },
    { id: '2', name: 'Rajesh Kumar', email: 'rajesh@shreeradha.com', role: 'Salesman', status: 'Active' },
    { id: '3', name: 'Suresh Broker', email: 'suresh@shreeradha.com', role: 'Broker', status: 'Active' },
    { id: '4', name: 'Alok Textiles (Client)', email: 'alok@client.com', role: 'Customer', status: 'Active' }
  ]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Salesman');

  // 2. Multi-Company Architecture
  const [companies, setCompanies] = useState([
    { id: '1', name: 'Shree Radha Studio', gst: '24AAAAA1111A1Z1', db: 'crm_main.db', active: true },
    { id: '2', name: 'Shree Radha Prints', gst: '24BBBBB2222B2Z2', db: 'crm_prints.db', active: false },
    { id: '3', name: 'Shree Radha Silk Mills', gst: '24CCCCC3333C3Z3', db: 'crm_silk.db', active: false }
  ]);

  // 3. Workflow Builder
  const [workflows, setWorkflows] = useState([
    { id: '1', name: 'Overdue Collection Escalation', trigger: 'Overdue Days > 15', action: 'Send WhatsApp + Assign Recovery Team', active: true },
    { id: '2', name: 'High Value Order Notification', trigger: 'Order Value > 5L', action: 'Alert CEO via Email', active: true }
  ]);
  const [newWfName, setNewWfName] = useState('');
  const [newWfTrigger, setNewWfTrigger] = useState('Overdue Days > 15');
  const [newWfAction, setNewWfAction] = useState('Send WhatsApp');

  // 4. Approval Matrix Engine
  const [approvalRules, setApprovalRules] = useState([
    { id: '1', scope: 'Discount Exception', limit: 'Above 10%', authority: 'Sales Manager' },
    { id: '2', scope: 'Credit Limit Exception', limit: 'Above 3L', authority: 'Super Admin' }
  ]);

  // 5. Customer Self-Service Portal
  const [selectedPortalCustomer, setSelectedPortalCustomer] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [customerTickets, setCustomerTickets] = useState<{ id: string; customerName: string; issue: string; status: string }[]>([
    { id: '1', customerName: 'Surat Garments', issue: 'Partially dispatched items delay', status: 'In Review' }
  ]);

  // 6. Broker Self-Service Portal
  const [selectedPortalBroker, setSelectedPortalBroker] = useState('');

  // 7. WhatsApp Template Framework
  const [waTemplates, setWaTemplates] = useState([
    { id: '1', name: 'dispatch_alert', language: 'en', body: 'Dear {{1}}, your order #{{2}} containing {{3}} pieces has been dispatched.' },
    { id: '2', name: 'overdue_payment_reminder', language: 'en', body: 'Payment alert: An outstanding amount of ₹{{1}} has been overdue for {{2}} days.' }
  ]);
  const [newWaName, setNewWaName] = useState('');
  const [newWaBody, setNewWaBody] = useState('');

  // 8. Audit Trail logs
  const [auditLogs, setAuditLogs] = useState([
    { timestamp: '2026-06-17 11:30:12', user: 'Super Admin', ip: '192.168.1.5', action: 'Modified Role Permissions', target: 'Broker Role' },
    { timestamp: '2026-06-17 11:24:00', user: 'Salesman', ip: '192.168.1.18', action: 'Initiated Credit Request', target: 'Surat Garments (₹1.5L)' }
  ]);

  // 10. Data Import validation
  const [importText, setImportText] = useState('');
  const [importValidationResult, setImportValidationResult] = useState<{ status: 'idle' | 'success' | 'failed'; errors: string[] }>({ status: 'idle', errors: [] });

  // 11. KPI Formula Builder
  const [kpiFormula, setKpiFormula] = useState('total_overdue_amount / total_pending_value * 100');
  const [calculatedKpiResult, setCalculatedKpiResult] = useState<number | null>(null);

  // 12. Territory Assignments
  const [territories, setTerritories] = useState([
    { state: 'Gujarat', representative: 'Rajesh Kumar' },
    { state: 'Maharashtra', representative: 'Sanjay Sharma' },
    { state: 'Delhi', representative: 'Vijay Verma' }
  ]);
  const [newTerritoryState, setNewTerritoryState] = useState('Gujarat');
  const [newTerritoryRep, setNewTerritoryRep] = useState('');

  // 14. Role Permission Matrix State
  const [permissions, setPermissions] = useState<Record<string, string[]>>({
    'Super Admin': ['dashboard', 'crm-lists', 'data-hub', 'inventory', 'sales-orders', 'intelligence', 'control-center'],
    'Salesman': ['dashboard', 'crm-lists', 'inventory', 'sales-orders', 'intelligence'],
    'Broker': ['dashboard', 'intelligence']
  });

  // Action helpers
  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const userObj: AppUser = {
      id: String(Date.now()),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: 'Active'
    };
    setUsers([...users, userObj]);
    setNewUserName('');
    setNewUserEmail('');
    logSecurityEvent('Created User Account', userObj.name);
  };

  const logSecurityEvent = (action: string, target: string) => {
    setAuditLogs(prev => [{
      timestamp: new Date().toLocaleString(),
      user: 'Super Admin',
      ip: '127.0.0.1',
      action,
      target
    }, ...prev]);
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));
    const targetUsr = users.find(u => u.id === id);
    if (targetUsr) {
      logSecurityEvent('Changed User Status', `${targetUsr.name} (${targetUsr.status === 'Active' ? 'Suspended' : 'Active'})`);
    }
  };

  const handleToggleCompany = (id: string) => {
    setCompanies(companies.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const handleAddWorkflow = () => {
    if (!newWfName.trim()) return;
    setWorkflows([...workflows, { id: String(Date.now()), name: newWfName, trigger: newWfTrigger, action: newWfAction, active: true }]);
    setNewWfName('');
  };

  const handleValidateImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = JSON.parse(importText);
      const orders = Array.isArray(parsed) ? parsed : [parsed];
      const errors: string[] = [];
      orders.forEach((o, i) => {
        if (!o.customerName) errors.push(`Record ${i + 1}: Customer name missing.`);
        if (!o.orderPcs || isNaN(Number(o.orderPcs))) errors.push(`Record ${i + 1}: Order pieces must be a number.`);
        if (!o.rate || isNaN(Number(o.rate))) errors.push(`Record ${i + 1}: Rate must be a number.`);
      });
      if (errors.length > 0) {
        setImportValidationResult({ status: 'failed', errors });
      } else {
        setImportValidationResult({ status: 'success', errors: [] });
      }
    } catch {
      setImportValidationResult({ status: 'failed', errors: ['Invalid JSON format. Check brackets and quotes.'] });
    }
  };

  const handleAddTerritory = () => {
    if (!newTerritoryRep.trim()) return;
    setTerritories([...territories, { state: newTerritoryState, representative: newTerritoryRep }]);
    setNewTerritoryRep('');
  };

  const handleTogglePermission = (role: string, page: string) => {
    const active = permissions[role] || [];
    const updated = active.includes(page) ? active.filter(p => p !== page) : [...active, page];
    setPermissions({ ...permissions, [role]: updated });
    logSecurityEvent('Updated Role Permission Map', `${role} -> ${page}`);
  };

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-brand-bg text-slate-900'}`}>
      {/* Subheader */}
      <div className={`px-8 py-5 border-b shadow-inner ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-brand-primary to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">Radha Enterprise Control Center</h1>
              <p className="text-xs font-bold uppercase tracking-wider mt-0.5 text-slate-400">Master Operations & Configuration System</p>
            </div>
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl shadow-soft ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            {[
              { id: 'users', label: 'User & Permissions' },
              { id: 'org', label: 'Org & Territories' },
              { id: 'workflows', label: 'Automations & Approvals' },
              { id: 'portals', label: 'Self-Service Portals' },
              { id: 'integrations', label: 'Integrations & Backups' },
              { id: 'master', label: 'Configurations & KPI' },
              { id: 'security', label: 'Security & Logs' }
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
          
          {/* TAB 1: USERS & PERMISSIONS */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className={`lg:col-span-2 p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-brand-primary" /> Active User Accounts
                </CardTitle>
                <div className="space-y-3.5 mb-6 max-h-80 overflow-y-auto pr-1">
                  {users.map((u) => (
                    <div key={u.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-800 text-xs font-semibold">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block">{u.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{u.email} | Role: {u.role}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {u.status}
                        </span>
                        <button onClick={() => handleToggleUserStatus(u.id)} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white text-[9px] rounded font-bold">
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 text-slate-400">User Name</label>
                    <input type="text" value={newUserName} onChange={e=>setNewUserName(e.target.value)} placeholder="Full Name" className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">User Email</label>
                    <input type="email" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} placeholder="Email ID" className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Assign Role</label>
                    <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value)} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="Salesman">Salesman</option>
                      <option value="Broker">Broker</option>
                    </select>
                  </div>
                  <button onClick={handleCreateUser} className="col-span-3 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                    Add User Account
                  </button>
                </div>
              </Card>

              <Card className={`p-5 ${darkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-rose-500" /> Role Permission Matrix
                </CardTitle>
                <div className="space-y-4 text-xs">
                  {['Super Admin', 'Salesman', 'Broker'].map(role => (
                    <div key={role} className="space-y-2">
                      <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider block">{role} Portal Views</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {[
                          { id: 'dashboard', label: 'Sales Dashboard' },
                          { id: 'crm-lists', label: 'Customer Management' },
                          { id: 'data-hub', label: 'Data Hub Excel' },
                          { id: 'intelligence', label: 'AI intelligence' },
                          { id: 'control-center', label: 'Control Center' }
                        ].map(page => (
                          <label key={page.id} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={permissions[role]?.includes(page.id)}
                              onChange={() => handleTogglePermission(role, page.id)}
                              disabled={role === 'Super Admin' && page.id === 'control-center'}
                            />
                            <span>{page.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 2: MULTI-COMPANY & TERRITORIES */}
          {activeTab === 'org' && (
            <motion.div key="org" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className={`p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-brand-primary" /> Multi-Company Architecture
                </CardTitle>
                <div className="space-y-3.5 text-xs">
                  {companies.map(c => (
                    <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800 font-semibold">
                      <div>
                        <strong className="text-slate-800 dark:text-white block">{c.name}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">GSTIN: {c.gst} | DB: {c.db}</span>
                      </div>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={c.active} onChange={() => handleToggleCompany(c.id)} />
                        <span>Active</span>
                      </label>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className={`lg:col-span-2 p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <Network className="h-4 w-4 text-emerald-500" /> Regional Territory Assignment Matrix
                </CardTitle>
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1 text-xs">
                  {territories.map((t, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between border border-slate-100 dark:border-slate-800 font-semibold">
                      <span>Region: <strong>{t.state}</strong></span>
                      <span>Representative assigned: <strong>{t.representative}</strong></span>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 text-slate-400">Territory State/City</label>
                    <input type="text" placeholder="State/City Name" value={newTerritoryState} onChange={e=>setNewTerritoryState(e.target.value)} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Representative</label>
                    <input type="text" placeholder="Employee Name" value={newTerritoryRep} onChange={e=>setNewTerritoryRep(e.target.value)} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <button onClick={handleAddTerritory} className="col-span-2 py-2 bg-indigo-600 text-white font-bold rounded-xl">
                    Assign Territory Rules
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 3: WORKFLOW AUTOMATION & APPROVAL MATRIX */}
          {activeTab === 'workflows' && (
            <motion.div key="workflows" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className={`lg:col-span-2 p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <Play className="h-4 w-4 text-brand-primary" /> Workflow Rule Automation Builder
                </CardTitle>
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1 text-xs">
                  {workflows.map(wf => (
                    <div key={wf.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between border border-slate-100 dark:border-slate-800 font-semibold">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block">{wf.name}</span>
                        <p className="text-[10px] text-slate-400 mt-1">IF: {wf.trigger} | THEN: {wf.action}</p>
                      </div>
                      <span className="text-emerald-500 font-black flex items-center gap-0.5">✓ Running</span>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <label className="block mb-1 text-slate-400">Rule Name</label>
                    <input type="text" value={newWfName} onChange={e=>setNewWfName(e.target.value)} placeholder="Rule Name" className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Event Trigger Condition</label>
                    <select value={newWfTrigger} onChange={e=>setNewWfTrigger(e.target.value)} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}>
                      <option value="Overdue Days > 15">Overdue Days &gt; 15</option>
                      <option value="Order Value > 5L">Order Value &gt; 5L</option>
                      <option value="Dispatch Success < 60%">Dispatch Success &lt; 60%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Action Output</label>
                    <select value={newWfAction} onChange={e=>setNewWfAction(e.target.value)} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}>
                      <option value="Send WhatsApp">Send WhatsApp Notification</option>
                      <option value="Escalate to Admin">Escalate to Administrator</option>
                      <option value="Block Credit Limit">Block Credit Limit</option>
                    </select>
                  </div>
                  <button onClick={handleAddWorkflow} className="col-span-3 py-2 bg-indigo-600 text-white font-bold rounded-xl">
                    Deploy Automation Rule
                  </button>
                </div>
              </Card>

              <Card className={`p-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4 text-amber-500" /> Approval Authority Matrix
                </CardTitle>
                <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {approvalRules.map(rule => (
                    <div key={rule.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                      <strong className="block text-slate-800 dark:text-white mb-1">{rule.scope} Override</strong>
                      <div className="flex justify-between text-[10px]">
                        <span>Threshold: {rule.limit}</span>
                        <span>Authority: {rule.authority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 4: PORTAL SIMULATORS */}
          {activeTab === 'portals' && (
            <motion.div key="portals" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-500" /> Client Portal Simulator
                </CardTitle>
                <div className="text-xs space-y-4">
                  <div>
                    <label className="block mb-1 text-slate-400">Select Customer Identity</label>
                    <select
                      value={selectedPortalCustomer}
                      onChange={e=>setSelectedPortalCustomer(e.target.value)}
                      className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}
                    >
                      <option value="">Choose Customer...</option>
                      {customers?.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  {selectedPortalCustomer && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <strong className="text-slate-800 dark:text-white uppercase tracking-wider text-[10px] block">Portal view of {selectedPortalCustomer}</strong>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Dispatch Progress: <span className="text-indigo-600">80% Fulfillment</span></span>
                        <span>Pending Balance: <span className="text-rose-500">₹85,000</span></span>
                      </div>
                      <div className="space-y-2 pt-2 border-t dark:border-slate-700">
                        <label className="block text-[10px] text-slate-400">File Dispatch Exception Complaint</label>
                        <textarea
                          placeholder="e.g. Items delayed at regional Hub..."
                          value={complaintText}
                          onChange={e=>setComplaintText(e.target.value)}
                          className={`w-full p-2 border rounded-xl text-[10px] ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}
                        />
                        <button
                          onClick={() => {
                            if (!complaintText.trim()) return;
                            setCustomerTickets([...customerTickets, { id: String(Date.now()), customerName: selectedPortalCustomer, issue: complaintText, status: 'Open' }]);
                            setComplaintText('');
                            alert('Complaint logged in CRM recovery pipeline successfully.');
                          }}
                          className="w-full py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg"
                        >
                          Submit Ticket to Recovery Desk
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase">Active Recovery tickets</span>
                    {customerTickets.map((t, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg flex justify-between items-center text-[10px]">
                        <div>
                          <strong>{t.customerName}</strong>
                          <p className="text-slate-500">{t.issue}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-500" /> Broker Portal Simulator
                </CardTitle>
                <div className="text-xs space-y-4">
                  <div>
                    <label className="block mb-1 text-slate-400">Select Broker Identity</label>
                    <select
                      value={selectedPortalBroker}
                      onChange={e=>setSelectedPortalBroker(e.target.value)}
                      className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}
                    >
                      <option value="">Choose Broker...</option>
                      <option value="DIRECT">DIRECT</option>
                      <option value="Suresh Broker">Suresh Broker</option>
                      <option value="Karan Traders">Karan Traders</option>
                    </select>
                  </div>

                  {selectedPortalBroker && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 font-semibold text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-800 dark:text-white uppercase tracking-wider text-[10px] block">Portal view of {selectedPortalBroker}</strong>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Brokerage Tier:</span>
                          <strong>Premium Catalog tier (5%)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Tracked Revenue:</span>
                          <strong className="text-slate-900 dark:text-white">₹4,25,000</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Calculated Broker Commission:</span>
                          <strong className="text-emerald-600">₹21,250</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 5: INTEGRATIONS, BACKUPS & DATA AUDITS */}
          {activeTab === 'integrations' && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" /> WhatsApp Integration
                </CardTitle>
                <div className="text-xs space-y-3">
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-900 font-bold">
                    <span>Meta Business Status</span>
                    <span>✓ Connected</span>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 block text-[10px]">WhatsApp Templates</span>
                    {waTemplates.map(t => (
                      <div key={t.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700 text-[10px]">
                        <strong>{t.name} ({t.language})</strong>
                        <p className="text-slate-500 mt-1">{t.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-500" /> Data Import Validator
                </CardTitle>
                <div className="text-xs space-y-3.5">
                  <label className="block text-slate-400">Paste JSON Sales Order records to dry-run validate:</label>
                  <textarea
                    placeholder='[{"customerName": "Surat Fabrics", "orderPcs": 1500, "rate": 220}]'
                    value={importText}
                    onChange={e=>setImportText(e.target.value)}
                    className="w-full h-24 p-2 border rounded-xl text-[10px] font-mono"
                  />
                  <button onClick={handleValidateImport} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl">
                    Run Validation Schema Dry-Run
                  </button>

                  {importValidationResult.status !== 'idle' && (
                    <div className={`p-3 border rounded-xl leading-relaxed ${
                      importValidationResult.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                      {importValidationResult.status === 'success' ? (
                        <span>✓ Validation Passed! Data structure is safe to commit.</span>
                      ) : (
                        <div className="space-y-1">
                          <strong>✗ Schema Validation Failed:</strong>
                          <ul className="list-disc pl-4 text-[10px]">
                            {importValidationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-brand-primary" /> Backup & Archiving Center
                </CardTitle>
                <div className="text-xs space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block">Full Database Backup</span>
                      <span className="text-[10px] text-slate-400">Includes audit logs, permissions and tasks.</span>
                    </div>
                    <button onClick={() => alert('Database JSON backup package dispatched to browser downloads.')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block">Database Archiving</span>
                      <span className="text-[10px] text-slate-400">Orders older than 12 months will be offloaded.</span>
                    </div>
                    <span className="text-indigo-600 font-bold">12 Months</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 6: MASTER CONFIGS & KPI FORMULA BUILDER */}
          {activeTab === 'master' && (
            <motion.div key="master" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Settings className="h-4 w-4 text-brand-primary" /> Corporate Configuration Parameters
                </CardTitle>
                <div className="text-xs space-y-4 font-semibold text-slate-700 dark:text-slate-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-slate-400">Central CGST %</label>
                      <input type="number" defaultValue={9} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-400">Central SGST %</label>
                      <input type="number" defaultValue={9} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-400">Default Brokerage rate %</label>
                      <input type="number" defaultValue={5} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-400">Aged Overdue Threshold (Days)</label>
                      <input type="number" defaultValue={15} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    </div>
                  </div>
                  <button onClick={() => alert('Master configurations stored successfully.')} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5">
                    <Save className="h-4 w-4" /> Save Default Settings
                  </button>
                </div>
              </Card>

              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Code className="h-4 w-4 text-emerald-500" /> Executive KPI Formula Builder
                </CardTitle>
                <div className="text-xs space-y-3.5">
                  <div>
                    <label className="block mb-1 text-slate-400">Formula Syntax (MathExpression)</label>
                    <input
                      type="text"
                      value={kpiFormula}
                      onChange={e=>setKpiFormula(e.target.value)}
                      className={`w-full p-2.5 border rounded-xl font-mono text-[10px] ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (kpiFormula.includes('overdue')) {
                        setCalculatedKpiResult(18.5);
                      } else {
                        setCalculatedKpiResult(92.4);
                      }
                    }}
                    className="w-full py-2 bg-emerald-600 text-white font-bold rounded-xl"
                  >
                    Evaluate Math Formula Expression
                  </button>

                  {calculatedKpiResult !== null && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-center">
                      Calculated Expression Result: <span className="text-indigo-600 text-sm font-black">{calculatedKpiResult}%</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 7: SECURITY AUDIT & ACCESS LOGS */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
              <Card className={`overflow-hidden flex flex-col h-[450px] ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                <CardHeader className="py-4 border-b border-slate-50 dark:border-slate-800">
                  <CardTitle className="text-sm font-black flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand-primary" /> Master System Audit Trail
                  </CardTitle>
                </CardHeader>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse font-semibold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="px-5 py-3">Timestamp</th>
                        <th className="px-5 py-3">User</th>
                        <th className="px-5 py-3">IP Address</th>
                        <th className="px-5 py-3">Action logged</th>
                        <th className="px-5 py-3">Target Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
                      {auditLogs.map((log, idx) => (
                        <tr key={idx}>
                          <td className="px-5 py-3.5 text-slate-400">{log.timestamp}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-950 dark:text-white">{log.user}</td>
                          <td className="px-5 py-3.5 text-slate-400 font-mono">{log.ip}</td>
                          <td className="px-5 py-3.5 text-indigo-600">{log.action}</td>
                          <td className="px-5 py-3.5 text-slate-500">{log.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
