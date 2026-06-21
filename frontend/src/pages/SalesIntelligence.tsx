import React, { useState, useMemo } from 'react';
import { useCustomers, useSalesOrders, useProducts } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import {
  Brain, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle2, Package,
  UserCheck, MapPin, Briefcase, FileSpreadsheet, Search, Filter, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Award, HelpCircle, FileText, Download, Bell, Activity,
  Clock, CheckCircle, Send, Sparkles, AlertCircle, BarChart3, Moon, Sun, Lock, Trash2, Edit2, Calendar, CheckSquare, Plus, File, Clipboard, Eye
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const retentionScoreProxy = (list: any[]) => {
  if (!list || list.length === 0) return 100;
  const sum = list.reduce((acc, curr) => acc + (curr.retentionScore || 0), 0);
  return sum / list.length;
};

export function SalesIntelligence() {
  const { data: customers, isLoading: isCustomersLoading } = useCustomers();
  const { data: salesOrders, isLoading: isOrdersLoading } = useSalesOrders();
  const { data: products, isLoading: isProductsLoading } = useProducts();

  // Navigation tabs (Phase 4 Tabs)
  const [activeTab, setActiveTab] = useState<'boardroom' | 'copilot' | 'timeline360' | 'operations' | 'credit' | 'performance' | 'docs' | 'diagnostics'>('boardroom');
  
  // Theme state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('crm-dark-mode') === 'true');
  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('crm-dark-mode', String(nextMode));
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Role Based Access Control
  const [currentRole, setCurrentRole] = useState<'Super Admin' | 'Admin' | 'Management' | 'Sales Manager' | 'Salesman' | 'Broker' | 'Viewer'>('Super Admin');

  // Smart Dashboard Filters (Module 13 Global Filters)
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterBroker, setFilterBroker] = useState('');
  const [filterSalesman, setFilterSalesman] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');

  // AI Copilot state
  const [copilotQuery, setCopilotQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string; data?: any[]; chartData?: any[]; chartType?: 'bar' | 'line' }[]>([
    { sender: 'ai', text: 'Hello! I am your Enterprise CRM Copilot. Ask me questions about top customers, overdue orders, forecasts, or dispatch efficiency!' }
  ]);

  // Selected customer for Timeline & 360 (Module 3 & 4)
  const [selectedCustName, setSelectedCustName] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<Record<string, string[]>>({});
  const [newNote, setNewNote] = useState('');

  // Notification panel toggle (Module 11)
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);

  // Drill Down modal state (Module 16)
  const [drillDownModal, setDrillDownModal] = useState<{ open: boolean; title: string; data: any[]; headers: string[] }>({
    open: false,
    title: '',
    data: [],
    headers: []
  });

  // Module 1: Task & Follow-up Management State
  const [tasks, setTasks] = useState<{ id: string; title: string; assignee: string; role: string; dueDate: string; priority: string; status: string; customer: string }[]>([
    { id: '1', title: 'Call customer for credit review', assignee: 'Rajesh Kumar', role: 'salesman', dueDate: '2026-06-20', priority: 'High', status: 'Pending', customer: 'Surat Garments' },
    { id: '2', title: 'Recovery follow-up for outstanding pieces', assignee: 'Collection Team', role: 'recovery', dueDate: '2026-06-18', priority: 'Critical', status: 'Pending', customer: 'Radha Textiles' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskRole, setNewTaskRole] = useState('salesman');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskCustomer, setNewTaskCustomer] = useState('');

  // Module 2: Approval Workflows State
  const [approvals, setApprovals] = useState<{ id: string; type: string; customer: string; amount: number; initiator: string; status: string; comments?: string }[]>([
    { id: '1', type: 'Credit Limit Approval', customer: 'Surat Garments', amount: 150000, initiator: 'Rajesh Kumar', status: 'Pending' },
    { id: '2', type: 'Discount Approval (12%)', customer: 'Radha Textiles', amount: 85000, initiator: 'Sanjay Sharma', status: 'Approved', comments: 'Approved as per seasonal catalog volume guidelines' }
  ]);

  // Module 4: Document Center State
  const [documents, setDocuments] = useState<{ id: string; name: string; type: string; customer: string; date: string; size: string }[]>([
    { id: '1', name: 'Invoice_1044.pdf', type: 'Invoice', customer: 'Surat Garments', date: '2026-06-12', size: '245 KB' },
    { id: '2', name: 'PO_90882.pdf', type: 'PO', customer: 'Radha Textiles', date: '2026-06-10', size: '180 KB' }
  ]);

  // Module 7: Target Management State
  const [targets, setTargets] = useState<{ id: string; category: string; target: number; achieved: number; unit: string }[]>([
    { id: '1', category: 'Revenue Target', target: 5000000, achieved: 4100000, unit: '₹' },
    { id: '2', category: 'Dispatch Target', target: 20000, achieved: 16500, unit: 'pcs' },
    { id: '3', category: 'Collection Recovery', target: 1500000, achieved: 1100000, unit: '₹' }
  ]);
  const [newTargetVal, setNewTargetVal] = useState('');

  // Module 13: Dashboard Customizer (widget visibility)
  const [showHealthGauge, setShowHealthGauge] = useState(true);
  const [showDrillCards, setShowDrillCards] = useState(true);
  const [showTrends, setShowTrends] = useState(true);

  // Advanced Audit Logs State (Module 12)
  const [auditLogs, setAuditLogs] = useState<{ id: string; user: string; action: string; target: string; timestamp: string }[]>([
    { id: '1', user: 'Super Admin', action: 'Generate Report', target: 'Revenue Package', timestamp: '2026-06-17 11:24:12' },
    { id: '2', user: 'Sales Manager', action: 'Create Order', target: 'Order #1045', timestamp: '2026-06-17 10:15:40' }
  ]);

  const [commsLog, setCommsLog] = useState<{ id: string; customer: string; type: 'whatsapp' | 'email'; message: string; timestamp: string }[]>([
    { id: '1', customer: 'Surat Garments', type: 'whatsapp', message: 'Outstanding payment reminder sent.', timestamp: '2026-06-17 10:30:00' }
  ]);

  // ─── Filtered Data using Global Filters (Module 13) ───────────────────────
  const activeOrders = useMemo(() => {
    if (!salesOrders) return [];
    return salesOrders.filter(o => {
      if (filterStartDate && new Date(o.date) < new Date(filterStartDate)) return false;
      if (filterEndDate && new Date(o.date) > new Date(filterEndDate)) return false;
      if (filterCustomer && !o.customerName.toLowerCase().includes(filterCustomer.toLowerCase())) return false;
      if (filterBroker && (!o.broker || !o.broker.toLowerCase().includes(filterBroker.toLowerCase()))) return false;
      if (filterSalesman && (!o.salesMan || !o.salesMan.toLowerCase().includes(filterSalesman.toLowerCase()))) return false;
      if (filterCity && (!o.cityName || !o.cityName.toLowerCase().includes(filterCity.toLowerCase()))) return false;
      if (filterProduct && (!o.productCode || !o.productCode.toLowerCase().includes(filterProduct.toLowerCase()))) return false;
      if (filterMinAmount && o.amount < parseFloat(filterMinAmount)) return false;
      return true;
    });
  }, [salesOrders, filterStartDate, filterEndDate, filterCustomer, filterBroker, filterSalesman, filterCity, filterProduct, filterMinAmount]);

  // Core Calculations
  const metrics = useMemo(() => {
    if (activeOrders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalPendingOrders: 0,
        totalPendingValue: 0,
        totalDispatchValue: 0,
        totalOverdueOrders: 0,
        totalOverdueAmount: 0,
        dispatchSuccessRate: 0,
        activeCustomersCount: 0,
        activeCitiesCount: 0,
        activeBrokersCount: 0,
        activeSalesmenCount: 0,
        salesmanStats: [],
        brokerStats: [],
        productStats: [],
        cityStats: [],
        stateStats: [],
        funnelData: [],
        notifications: [],
        opportunities: [],
        customerTimelines: {},
        customerRiskList: [],
        strengths: [],
        weaknesses: [],
        anomalies: [],
        dataAuditIssues: [],
        healthEngineDetails: { healthScore: 0, growthRate: 0, efficiency: 0, retention: 0, risks: 0 }
      };
    }

    const customersSet = new Set<string>();
    const citiesSet = new Set<string>();
    const brokersSet = new Set<string>();
    const salesmenSet = new Set<string>();

    let totalRevenue = 0;
    let totalPendingValue = 0;
    let totalDispatchValue = 0;
    let totalPendingOrders = 0;
    let totalOverdueOrders = 0;
    let totalOverdueAmount = 0;
    let totalOrderPcs = 0;
    let totalDispPcs = 0;

    const salesmanMap: Record<string, { rev: number; closed: number; pending: number; overdue: number; pcsOrdered: number; pcsDisp: number }> = {};
    const brokerMap: Record<string, { rev: number; orders: number; pendingVal: number; overdueVal: number }> = {};
    const productMap: Record<string, { rev: number; orders: number; pendingQty: number; dispQty: number; name: string }> = {};
    const cityMap: Record<string, { rev: number; orders: number; pendingVal: number; overdueVal: number }> = {};
    const stateMap: Record<string, { rev: number; orders: number; pendingVal: number }> = {};

    let countCreated = activeOrders.length;
    let countProcessing = 0;
    let countPendingDisp = 0;
    let countPartiallyDisp = 0;
    let countCompleted = 0;
    let countOverdue = 0;

    const customerTimelines: Record<string, any[]> = {};
    const customerRiskMap: Record<string, { name: string; pendingAmt: number; overdueDays: number; orderCount: number; dispPcs: number; orderPcs: number; gstNumber: string; broker: string; salesMan: string }> = {};

    // Module 11 Data quality audit issue tracking
    const dataAuditIssues: string[] = [];

    activeOrders.forEach(o => {
      customersSet.add(o.customerName);
      if (o.cityName) citiesSet.add(o.cityName);
      if (o.broker) brokersSet.add(o.broker);
      if (o.salesMan) salesmenSet.add(o.salesMan);

      totalRevenue += o.amount;
      const dispatchVal = o.dispPcs * o.rate;
      const pendingVal = o.balPcs * o.rate;
      totalDispatchValue += dispatchVal;
      totalPendingValue += pendingVal;
      
      totalOrderPcs += o.orderPcs;
      totalDispPcs += o.dispPcs;

      // Status check
      if (o.balPcs === 0) {
        countCompleted++;
      } else {
        countPendingDisp++;
        if (o.dispPcs > 0) countPartiallyDisp++;
        else countProcessing++;
        if (o.overDueDays > 0) {
          countOverdue++;
          totalOverdueOrders++;
          totalOverdueAmount += pendingVal;
        }
      }

      // Timeline Engine (Module 4)
      if (!customerTimelines[o.customerName]) {
        customerTimelines[o.customerName] = [];
      }
      const timeline = customerTimelines[o.customerName];
      timeline.push({
        type: 'Order Created',
        date: o.date,
        description: `Order #${o.orderNo} created for ${o.orderPcs} pieces (Value: ₹${o.amount.toLocaleString()})`
      });
      if (o.dispPcs > 0) {
        timeline.push({
          type: 'Dispatch Started',
          date: o.date,
          description: `Dispatched ${o.dispPcs} units to logistics node`
        });
      }
      if (o.balPcs === 0) {
        timeline.push({
          type: 'Dispatch Completed',
          date: o.date,
          description: `Order #${o.orderNo} dispatch cycle completed.`
        });
      } else if (o.overDueDays > 0) {
        timeline.push({
          type: 'Overdue Trigger',
          date: o.date,
          description: `Order #${o.orderNo} entered overdue state (Aging: ${o.overDueDays} days)`
        });
      }

      // Risk profiling (Module 5 Risk Engine)
      if (!customerRiskMap[o.customerName]) {
        customerRiskMap[o.customerName] = { name: o.customerName, pendingAmt: 0, overdueDays: 0, orderCount: 0, dispPcs: 0, orderPcs: 0, gstNumber: o.gstNumber, broker: o.broker, salesMan: o.salesMan };
      }
      const risk = customerRiskMap[o.customerName];
      risk.pendingAmt += pendingVal;
      risk.orderCount++;
      risk.dispPcs += o.dispPcs;
      risk.orderPcs += o.orderPcs;
      if (o.overDueDays > risk.overdueDays) risk.overdueDays = o.overDueDays;

      // Group mappings
      if (o.salesMan) {
        if (!salesmanMap[o.salesMan]) {
          salesmanMap[o.salesMan] = { rev: 0, closed: 0, pending: 0, overdue: 0, pcsOrdered: 0, pcsDisp: 0 };
        }
        salesmanMap[o.salesMan].rev += o.amount;
        salesmanMap[o.salesMan].pcsOrdered += o.orderPcs;
        salesmanMap[o.salesMan].pcsDisp += o.dispPcs;
        if (o.balPcs === 0) salesmanMap[o.salesMan].closed++;
        else {
          salesmanMap[o.salesMan].pending++;
          if (o.overDueDays > 0) salesmanMap[o.salesMan].overdue++;
        }
      } else {
        dataAuditIssues.push(`Order #${o.orderNo} is missing a dedicated salesperson tracking.`);
      }

      const bName = o.broker || 'DIRECT';
      if (!brokerMap[bName]) {
        brokerMap[bName] = { rev: 0, orders: 0, pendingVal: 0, overdueVal: 0 };
      }
      brokerMap[bName].rev += o.amount;
      brokerMap[bName].orders++;
      brokerMap[bName].pendingVal += pendingVal;
      if (o.balPcs > 0 && o.overDueDays > 0) {
        brokerMap[bName].overdueVal += pendingVal;
      }

      if (o.cityName) {
        if (!cityMap[o.cityName]) {
          cityMap[o.cityName] = { rev: 0, orders: 0, pendingVal: 0, overdueVal: 0 };
        }
        cityMap[o.cityName].rev += o.amount;
        cityMap[o.cityName].orders++;
        cityMap[o.cityName].pendingVal += pendingVal;
        if (o.balPcs > 0 && o.overDueDays > 0) {
          cityMap[o.cityName].overdueVal += pendingVal;
        }
      } else {
        dataAuditIssues.push(`Order #${o.orderNo} is missing city geography details.`);
      }

      const stateName = o.cityName === 'Surat' ? 'Gujarat' : o.cityName === 'Delhi' ? 'Delhi' : o.cityName === 'Mumbai' ? 'Maharashtra' : 'Rajasthan';
      if (!stateMap[stateName]) {
        stateMap[stateName] = { rev: 0, orders: 0, pendingVal: 0 };
      }
      stateMap[stateName].rev += o.amount;
      stateMap[stateName].orders++;
      stateMap[stateName].pendingVal += pendingVal;

      const pCode = o.productCode || 'UNKNOWN';
      if (!productMap[pCode]) {
        productMap[pCode] = { rev: 0, orders: 0, pendingQty: 0, dispQty: 0, name: o.catalog || pCode };
      }
      productMap[pCode].rev += o.amount;
      productMap[pCode].orders++;
      productMap[pCode].pendingQty += o.balPcs;
      productMap[pCode].dispQty += o.dispPcs;
    });

    const dispatchSuccessRate = totalOrderPcs > 0 ? (totalDispPcs / totalOrderPcs) * 100 : 0;

    // Build risk rankings & classifications (Module 5 Risk levels)
    const customerRiskList = Object.values(customerRiskMap).map(r => {
      let riskScore = 0;
      if (r.pendingAmt > 100000) riskScore += 35;
      else if (r.pendingAmt > 30000) riskScore += 15;

      if (r.overdueDays > 15) riskScore += 45;
      else if (r.overdueDays > 7) riskScore += 25;
      
      const dispRatio = r.orderPcs > 0 ? r.dispPcs / r.orderPcs : 1;
      if (dispRatio < 0.6) riskScore += 20;

      let riskCategory: 'Safe' | 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical' = 'Safe';
      if (riskScore >= 75) riskCategory = 'Critical';
      else if (riskScore >= 50) riskCategory = 'High Risk';
      else if (riskScore >= 25) riskCategory = 'Medium Risk';
      else if (riskScore >= 10) riskCategory = 'Low Risk';

      // Auto customer segmentation (Module 3)
      let segment = 'Regular Customers';
      if (r.pendingAmt > 150000 && riskScore < 20) segment = 'VIP Customers';
      else if (r.pendingAmt > 50000 && riskScore < 30) segment = 'Premium Customers';
      else if (riskScore > 50) segment = 'High Risk Customers';
      else if (r.overdueDays > 30) segment = 'Inactive Customers';

      const retentionScore = Math.max(10, 100 - riskScore);
      const contributionPct = totalRevenue > 0 ? (r.pendingAmt + r.overdueDays * 1000) / totalRevenue * 100 : 0;

      // Module 11 Quality check
      if (!r.gstNumber) {
        dataAuditIssues.push(`Customer "${r.name}" is missing central GSTIN registration.`);
      }

      return {
        name: r.name,
        riskScore,
        riskCategory,
        segment,
        pendingAmt: r.pendingAmt,
        overdueDays: r.overdueDays,
        retentionScore,
        clv: Math.round(r.pendingAmt * 3.8 + 45000),
        revenueContrib: Number(contributionPct.toFixed(1))
      };
    }).sort((a,b)=>b.riskScore - a.riskScore);

    // Business Health Engine Calculations (Module 22)
    const collectionEfficiency = Math.max(20, Math.min(100, Math.round(100 - (totalOverdueAmount / (totalPendingValue || 1) * 100))));
    const activeRisksCount = customerRiskList.filter(c => c.riskCategory === 'Critical' || c.riskCategory === 'High Risk').length;
    const finalHealthScore = Math.max(25, Math.min(100, Math.round(
      (dispatchSuccessRate * 0.3) + (collectionEfficiency * 0.3) + (retentionScoreProxy(customerRiskList) * 0.2) + (100 - activeRisksCount * 6) * 0.2
    )));

    // AI Anomaly Detection (Module 10)
    const anomalies: string[] = [];
    if (totalOverdueAmount > totalRevenue * 0.15) {
      anomalies.push(`ALERT: Outstanding collection risk exposure has exceeded 15% of revenue baseline (Current: ₹${(totalOverdueAmount/100000).toFixed(2)}L).`);
    }
    customerRiskList.forEach(c => {
      if (c.overdueDays > 25 && c.pendingAmt > 80000) {
        anomalies.push(`ANOMALY: Aged collection trigger on account "${c.name}" (${c.overdueDays} days, ₹${c.pendingAmt.toLocaleString()}).`);
      }
    });

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const healthRecommendations: string[] = [];

    if (dispatchSuccessRate > 80) strengths.push(`Outstanding Logistical Dispatch efficiency of ${dispatchSuccessRate.toFixed(1)}%.`);
    else weaknesses.push(`Logistical Dispatch rate is lagging at ${dispatchSuccessRate.toFixed(1)}%.`);

    if (collectionEfficiency > 85) strengths.push(`Healthy Collection Recovery rate of ${collectionEfficiency}%.`);
    else {
      weaknesses.push(`Receivables collection efficiency has dropped to ${collectionEfficiency}%.`);
      healthRecommendations.push('Deploy recovery actions in Collection Center to clear aged outstanding amounts.');
    }

    // AI Opportunities list (Module 6)
    const opportunities = customerRiskList.map(c => {
      let opportunityType = 'Upsell Ready';
      let reason = 'High retention score and regular order cycles.';
      if (c.retentionScore > 85) {
        opportunityType = 'Upsell Ready';
        reason = `Outstanding loyalty factor (${c.retentionScore}% retention). Ready for premium catalog upgrade.`;
      } else if (c.riskScore < 20 && c.clv > 100000) {
        opportunityType = 'Cross-sell Candidate';
        reason = 'Growing business demand and low risk index. Offer new inventory releases.';
      } else if (c.riskCategory === 'Medium Risk') {
        opportunityType = 'Reactivation Opportunities';
        reason = 'Initiate collection followup. Cleared credit profile holds potential for reactivation.';
      } else {
        opportunityType = 'Dormant Customers';
        reason = 'Drop in frequency detected. Re-engage with catalog discount.';
      }
      return {
        name: c.name,
        type: opportunityType,
        reason,
        value: Math.round(c.clv * 0.15)
      };
    });

    // Notifications listing (Module 11)
    const notifications: { id: string; type: 'critical' | 'pending' | 'risk' | 'delay'; message: string }[] = [];
    activeOrders.forEach(o => {
      if (o.overDueDays > 15 && o.balPcs > 0) {
        notifications.push({
          id: `notif_overdue_${o.id}`,
          type: 'critical',
          message: `Order #${o.orderNo} for ${o.customerName} is strictly overdue (${o.overDueDays} days).`
        });
      }
    });

    const funnelData = [
      { name: 'Created', value: countCreated, fill: '#6366f1' },
      { name: 'Processing', value: countProcessing, fill: '#3b82f6' },
      { name: 'Dispatch Pending', value: countPendingDisp, fill: '#ec4899' },
      { name: 'Partially Dispatched', value: countPartiallyDisp, fill: '#f59e0b' },
      { name: 'Completed', value: countCompleted, fill: '#10b981' },
      { name: 'Overdue', value: countOverdue, fill: '#ef4444' }
    ];

    return {
      totalOrders: activeOrders.length,
      totalRevenue,
      totalPendingOrders,
      totalPendingValue,
      totalDispatchValue,
      totalOverdueOrders,
      totalOverdueAmount,
      dispatchSuccessRate,
      activeCustomersCount: customersSet.size,
      activeCitiesCount: citiesSet.size,
      activeBrokersCount: brokersSet.size,
      activeSalesmenCount: salesmenSet.size,
      salesmanStats: Object.entries(salesmanMap).map(([name, data]) => ({ name, revenue: data.rev, closed: data.closed, pending: data.pending, overdue: data.overdue, dispatchRate: data.pcsOrdered > 0 ? (data.pcsDisp/data.pcsOrdered)*100 : 0 })),
      brokerStats: Object.entries(brokerMap).map(([name, data]) => ({ name, revenue: data.rev, orders: data.orders, pendingVal: data.pendingVal, overdueVal: data.overdueVal })),
      productStats: Object.entries(productMap).map(([code, data]) => ({ code, name: data.name, revenue: data.rev, orders: data.orders, pendingQty: data.pendingQty, dispQty: data.dispQty })),
      cityStats: Object.entries(cityMap).map(([name, data]) => ({ name, revenue: data.rev, orders: data.orders, pendingVal: data.pendingVal, overdueVal: data.overdueVal })),
      stateStats: Object.entries(stateMap).map(([name, data]) => ({ name, revenue: data.rev, orders: data.orders, pendingVal: data.pendingVal })),
      funnelData,
      notifications,
      opportunities,
      customerTimelines,
      customerRiskList,
      strengths,
      weaknesses,
      anomalies,
      dataAuditIssues,
      healthEngineDetails: {
        healthScore: finalHealthScore,
        growthRate: 8,
        efficiency: collectionEfficiency,
        retention: Math.round(retentionScoreProxy(customerRiskList)),
        risks: activeRisksCount
      }
    };
  }, [activeOrders, salesOrders]);

  // Set default customer selection
  React.useEffect(() => {
    if (metrics.customerRiskList.length > 0 && !selectedCustName) {
      setSelectedCustName(metrics.customerRiskList[0].name);
    }
  }, [metrics.customerRiskList, selectedCustName]);

  // AI Copilot Query Parser (Module 1 ChatGPT Style)
  const handleCopilotQuery = () => {
    if (!copilotQuery.trim()) return;

    const q = copilotQuery.toLowerCase();
    const userMsg = { sender: 'user' as const, text: copilotQuery };
    let aiText = `I couldn't quite resolve that query. Try asking: "Show top customers", "Show overdue orders", "Revenue forecast", or "Show dispatch efficiency".`;
    let responseData: any[] | undefined = undefined;
    let responseChart: any[] | undefined = undefined;
    let responseChartType: 'bar' | 'line' | undefined = undefined;

    if (q.includes('customer') || q.includes('party')) {
      const top = metrics.customerRiskList.slice(0, 5);
      aiText = `Here is the Customer Health and Valuation ranking. The top performers are:`;
      responseData = top.map(c => ({ Name: c.name, Health: `${c.retentionScore}/100`, Segment: c.segment, CLV: `₹${(c.clv/100000).toFixed(2)}L` }));
    } else if (q.includes('overdue') || q.includes('delay')) {
      const overdue = activeOrders.filter(o => o.balPcs > 0 && o.overDueDays > 0).slice(0, 5);
      aiText = `Here are the active overdue dispatches details:`;
      responseData = overdue.map(o => ({ 'Order No': `#${o.orderNo}`, Customer: o.customerName, Outstanding: `₹${(o.balPcs*o.rate).toLocaleString()}`, 'Aged Days': `${o.overDueDays} days` }));
    } else if (q.includes('forecast') || q.includes('projection') || q.includes('predict')) {
      aiText = `90-day predictive forecasts indicates positive growth patterns:`;
      responseChart = [
        { period: 'Current Month', revenue: metrics.totalRevenue },
        { period: '30 Days Projection', revenue: metrics.totalRevenue * 1.05 },
        { period: '60 Days Projection', revenue: metrics.totalRevenue * 1.10 },
        { period: '90 Days Projection', revenue: metrics.totalRevenue * 1.18 }
      ];
      responseChartType = 'line';
    }

    setChatHistory(prev => [...prev, userMsg, { sender: 'ai', text: aiText, data: responseData, chartData: responseChart, chartType: responseChartType }]);
    setCopilotQuery('');
  };

  // Add Task Function (Module 1 Operations)
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const taskObj = {
      id: String(Date.now()),
      title: newTaskTitle,
      assignee: newTaskAssignee || 'Unassigned',
      role: newTaskRole,
      dueDate: newTaskDueDate || 'No Due Date',
      priority: newTaskPriority,
      status: 'Pending',
      customer: newTaskCustomer || 'General Portfolio'
    };
    setTasks(prev => [...prev, taskObj]);
    setNewTaskTitle('');
    setNewTaskAssignee('');
    
    // Add to Audit Log
    const newLog = {
      id: String(Date.now()),
      user: currentRole,
      action: 'Assign Task',
      target: newTaskTitle,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    alert('Task logged and representative assigned successfully.');
  };

  // Approval Decision (Module 2 workflow)
  const handleApprovalAction = (id: string, action: 'Approved' | 'Denied') => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
    // Add to Audit Log
    const newLog = {
      id: String(Date.now()),
      user: currentRole,
      action: `${action} Workflow`,
      target: `Approval ID #${id}`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    alert(`Request ${id} has been marked as ${action}.`);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedCustName) return;
    setCustomerNotes(prev => ({
      ...prev,
      [selectedCustName]: [...(prev[selectedCustName] || []), newNote]
    }));
    setNewNote('');
    // Add to Audit Log
    const newLog = {
      id: String(Date.now()),
      user: currentRole,
      action: 'Log Note',
      target: `Customer: ${selectedCustName}`,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    alert('Note added to customer timeline successfully.');
  };

  const handleSendComms = (customer: string, type: 'whatsapp' | 'email') => {
    const message = type === 'whatsapp'
      ? `Dear Customer, your outstanding balance with Shree Radha Studio is pending. Please process at the earliest.`
      : `Dear Partner, We are writing to remind you of the pending dispatch balance. Please check the portal.`;

    const newLog = {
      id: String(Date.now()),
      customer,
      type,
      message,
      timestamp: new Date().toLocaleString()
    };
    setCommsLog(prev => [newLog, ...prev]);
    alert(`${type === 'whatsapp' ? 'WhatsApp message simulated' : 'Email dispatched'} successfully to ${customer}.`);
  };

  const currentTimelineWithNotes = useMemo(() => {
    const dbTimeline = metrics.customerTimelines[selectedCustName] || [];
    const notes = customerNotes[selectedCustName] || [];
    const notesTimeline = notes.map(note => ({
      type: 'Follow Up Done',
      date: new Date().toISOString(),
      description: note
    }));
    return [...dbTimeline, ...notesTimeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [metrics.customerTimelines, customerNotes, selectedCustName]);

  // Boardroom PDF Packager (Module 14 Boardroom Generator)
  const triggerAutoExport = (reportName: string) => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Boardroom Executive Report - ${reportName}`, 14, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Overall Business Health Rating: ${metrics.healthEngineDetails.healthScore}/100`, 14, 32);
    
    doc.text(`Total Closed Revenue: ₹${(metrics.totalRevenue/100000).toFixed(2)}L`, 14, 42);
    doc.text(`Outstanding Receivable Amount: ₹${(metrics.totalPendingValue/100000).toFixed(2)}L`, 14, 48);
    doc.text(`Dispatch Fulfillment Efficiency: ${metrics.dispatchSuccessRate.toFixed(1)}%`, 14, 54);
    
    doc.text(`Top Performers Overview:`, 14, 66);
    metrics.customerRiskList.slice(0, 5).forEach((c, i) => {
      doc.text(`- ${c.name} | Segment: ${c.segment} | Life Value: ₹${(c.clv/100000).toFixed(2)}L`, 14, 74 + (i * 6));
    });

    doc.save(`${reportName.toLowerCase()}_executive_report.pdf`);
  };

  const handleDrillDown = (cardType: string) => {
    let title = '';
    let data: any[] = [];
    let headers: string[] = [];

    if (cardType === 'revenue') {
      title = 'Revenue Breakdown by Customer';
      data = metrics.customerRiskList.map(c => ({ Name: c.name, Segment: c.segment, Value: `₹${(c.clv/100000).toFixed(2)}L` }));
      headers = ['Name', 'Segment', 'Value'];
    } else if (cardType === 'pending') {
      title = 'Outstanding Balances by City';
      data = metrics.cityStats.map(c => ({ City: c.name, Orders: c.orders, Pending: `₹${(c.pendingVal/1000).toFixed(1)}k` }));
      headers = ['City', 'Orders', 'Pending'];
    } else if (cardType === 'overdue') {
      title = 'Aged dispatches by Broker';
      data = metrics.brokerStats.map(b => ({ Broker: b.name, Orders: b.orders, 'Overdue Value': `₹${(b.overdueVal/1000).toFixed(1)}k` }));
      headers = ['Broker', 'Orders', 'Overdue Value'];
    }

    setDrillDownModal({ open: true, title, data, headers });
  };

  const isAuthorized = (tabId: string) => {
    if (currentRole === 'Viewer') return tabId === 'boardroom' || tabId === 'reports';
    if (currentRole === 'Broker') return tabId === 'reports' || tabId === 'copilot';
    if (currentRole === 'Salesman') return tabId !== 'boardroom';
    return true;
  };

  const isLoading = isCustomersLoading || isOrdersLoading || isProductsLoading;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-16 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-brand-bg text-slate-900'}`}>
      
      {/* Module 16: Interactive Drill Down Overlay Modal */}
      {drillDownModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-2xl p-6 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-sm uppercase tracking-wider">{drillDownModal.title}</h3>
              <button onClick={() => setDrillDownModal(prev => ({ ...prev, open: false }))} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Close</button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'} text-slate-400 font-bold uppercase`}>
                    {drillDownModal.headers.map((h, idx) => (
                      <th key={idx} className="py-2.5 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {drillDownModal.data.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {Object.values(row).map((cell: any, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Module 14: Real Time Floating Notification Center Drawer */}
      <AnimatePresence>
        {notifPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
              onClick={() => setNotifPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className={`fixed right-0 top-0 bottom-0 w-96 shadow-2xl z-50 p-6 flex flex-col border-l ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white/95 backdrop-blur-xl border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Bell className="h-5 w-5 text-rose-500" /> Real-time Alert Hub
                </h3>
                <button onClick={() => setNotifPanelOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide text-xs">
                {metrics.notifications.map((n, i) => (
                  <div key={i} className={`p-3 border rounded-xl flex gap-3 font-semibold leading-relaxed ${
                    darkMode ? 'bg-rose-950/40 border-rose-900 text-rose-200' : 'bg-rose-50 border-rose-100 text-rose-950'
                  }`}>
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{n.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Filter Bar (Module 13 & 21 Theme Toggle) */}
      <div className={`border-b px-8 py-4 sticky top-0 z-40 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-[1700px] mx-auto flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-brand-primary" />
            <span className="text-xs font-black uppercase tracking-wider">Enterprise Global Filters</span>
            
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl border transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* RBAC selector dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={currentRole}
                onChange={e => setCurrentRole(e.target.value as any)}
                className={`p-1 border rounded-lg font-bold ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Management">Management</option>
                <option value="Sales Manager">Sales Manager</option>
                <option value="Salesman">Salesman</option>
                <option value="Broker">Broker</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
            <input type="date" value={filterStartDate} onChange={e=>setFilterStartDate(e.target.value)} className={`p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
            <input type="date" value={filterEndDate} onChange={e=>setFilterEndDate(e.target.value)} className={`p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
            <input type="text" placeholder="Customer" value={filterCustomer} onChange={e=>setFilterCustomer(e.target.value)} className={`p-2 border rounded-xl w-28 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
            <input type="text" placeholder="Broker" value={filterBroker} onChange={e=>setFilterBroker(e.target.value)} className={`p-2 border rounded-xl w-24 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
            <input type="text" placeholder="Salesman" value={filterSalesman} onChange={e=>setFilterSalesman(e.target.value)} className={`p-2 border rounded-xl w-24 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
            <button onClick={() => setNotifPanelOpen(true)} className="relative p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
              <Bell className="h-5 w-5 text-slate-500" />
              {metrics.notifications.length > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 border border-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Subnavigation Header */}
      <div className={`px-8 py-5 border-b shadow-inner ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-brand-primary to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">Shree Radha Studio</h1>
              <p className="text-xs font-bold uppercase tracking-wider mt-0.5 text-slate-400">Enterprise Operations Platform</p>
            </div>
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl shadow-soft ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            {[
              { id: 'boardroom', label: 'Boardroom Overview' },
              { id: 'copilot', label: 'AI ChatGPT Assistant' },
              { id: 'timeline360', label: 'Client 360 & Timeline' },
              { id: 'operations', label: 'Operations & Approvals' },
              { id: 'credit', label: 'Credit & Recovery' },
              { id: 'performance', label: 'Targets & Scorecards' },
              { id: 'docs', label: 'Documents & History' },
              { id: 'diagnostics', label: 'AI Diagnostics' }
            ].map(tab => (
              <button
                key={tab.id}
                disabled={!isAuthorized(tab.id)}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
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
        
        {/* ─── TAB: BOARDROOM DASHBOARD (Module 13 Dashboard customizer & 15 Boardroom) ─── */}
        {activeTab === 'boardroom' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Customizer switch panel */}
            <div className={`p-4 rounded-xl border flex gap-4 text-xs font-bold items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-slate-400 uppercase tracking-wider">Dashboard Customizer Widget Toggles:</span>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={showHealthGauge} onChange={e=>setShowHealthGauge(e.target.checked)} /> Health Score</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={showDrillCards} onChange={e=>setShowDrillCards(e.target.checked)} /> Drill-down KPI Cards</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={showTrends} onChange={e=>setShowTrends(e.target.checked)} /> Projections Area Chart</label>
            </div>

            {/* CEO Metrics Row */}
            {showDrillCards && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {showHealthGauge && (
                  <Card className={`shadow-soft border flex flex-col justify-between p-5 col-span-1 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Business Health Rating</span>
                    <div className="flex-1 flex flex-col items-center justify-center my-4">
                      <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-8 border-indigo-100 dark:border-slate-800">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{metrics.healthEngineDetails.healthScore}</span>
                        <span className="text-[10px] text-slate-400 block absolute bottom-2">Excellent</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center font-bold">Derived from collection efficiency and risk exposure.</p>
                  </Card>
                )}

                <Card
                  onClick={() => handleDrillDown('revenue')}
                  className={`shadow-soft border p-5 flex flex-col justify-between col-span-1 cursor-pointer hover:shadow-lg transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Global Closed Revenue (Drill-down)</span>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white my-4">₹{(metrics.totalRevenue/100000).toFixed(2)}L</h3>
                  <span className="text-[10px] text-slate-400 font-bold block">Direct + broker pipeline closed</span>
                </Card>

                <Card
                  onClick={() => handleDrillDown('pending')}
                  className={`shadow-soft border p-5 flex flex-col justify-between col-span-1 cursor-pointer hover:shadow-lg transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pending Outstanding dispatches</span>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white my-4">₹{(metrics.totalPendingValue/100000).toFixed(2)}L</h3>
                  <span className="text-[10px] text-slate-400 font-bold block">Outstanding balance dispatches by city</span>
                </Card>

                <Card
                  onClick={() => handleDrillDown('overdue')}
                  className={`shadow-soft border p-5 flex flex-col justify-between col-span-1 cursor-pointer hover:shadow-lg transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Aged Outstanding amount</span>
                  <h3 className="text-3xl font-black text-rose-600 my-4">₹{(metrics.totalOverdueAmount/100000).toFixed(2)}L</h3>
                  <span className="text-[10px] text-rose-500 font-bold block">Overdue outstanding dispatches by broker</span>
                </Card>
              </div>
            )}

            {showTrends && (
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black">State-Wise Logistical closed Volume Trend</CardTitle>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.stateStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" name="Closed Volume" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              <Card className={`p-5 space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black text-emerald-600">💪 Business Portfolio Strengths</CardTitle>
                <ul className="space-y-2 font-semibold text-slate-700 dark:text-slate-300">
                  {metrics.strengths.map((s, idx) => <li key={idx} className="flex gap-2">✓ {s}</li>)}
                </ul>
              </Card>
              <Card className={`p-5 space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black text-rose-600">🚨 Business Portfolio Risks</CardTitle>
                <ul className="space-y-2 font-semibold text-slate-700 dark:text-slate-300">
                  {metrics.weaknesses.map((w, idx) => <li key={idx} className="flex gap-2">✗ {w}</li>)}
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* ─── TAB: AI COPILOT (Module 1 ChatGPT Style) ────────────────────── */}
        {activeTab === 'copilot' && (
          <Card className={`shadow-soft border p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Natural Language AI Copilot (ChatGPT style)
              </h2>
            </div>

            <div className="h-96 border rounded-2xl p-4 overflow-y-auto space-y-4 dark:border-slate-800 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                    chat.sender === 'user' ? 'bg-brand-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border dark:border-slate-700'
                  }`}>
                    <p className="font-semibold">{chat.text}</p>
                    {chat.data && (
                      <div className="mt-3 overflow-x-auto border-t pt-2 dark:border-slate-700">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="border-b dark:border-slate-700 text-slate-500 font-bold">
                              {Object.keys(chat.data[0]).map((h, i) => <th key={i} className="py-1 px-2">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {chat.data.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {Object.values(row).map((cell: any, cIdx) => <td key={cIdx} className="py-1 px-2">{cell}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask: show top customers..."
                value={copilotQuery}
                onChange={e=>setCopilotQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCopilotQuery()}
                className={`flex-1 p-3 border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'
                }`}
              />
              <button onClick={handleCopilotQuery} className="px-5 py-3 bg-brand-primary text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md">
                <Send className="h-4 w-4" /> Ask
              </button>
            </div>
          </Card>
        )}

        {/* ─── TAB: CLIENT 360 & TIMELINE (Module 3 & 4) ───────────────────── */}
        {activeTab === 'timeline360' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* Risk list */}
            <Card className={`shadow-soft border lg:col-span-1 overflow-hidden h-[600px] flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="p-4 border-b border-slate-50 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Risk Classifications</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 text-xs">
                {metrics.customerRiskList.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedCustName(c.name)}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors flex items-center justify-between font-bold ${
                      selectedCustName === c.name ? 'bg-indigo-50/50 border-l-4 border-brand-primary' : ''
                    }`}
                  >
                    <div>
                      <span className="text-slate-900 dark:text-white block font-bold">{c.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">{c.segment}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${
                      c.riskCategory === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.riskCategory}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Selected Profile 360 & Timeline View */}
            <Card className={`shadow-soft border lg:col-span-2 p-6 overflow-y-auto scrollbar-hide h-[600px] space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              {selectedCustName ? (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedCustName}</h2>
                    <p className="text-xs text-slate-400 mt-1">Lifecycle value calculations and chronological timelines.</p>
                  </div>

                  {/* Relationship Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Customer Lifetime Value</span>
                      <strong className="text-slate-800 dark:text-white block text-base mt-1">
                        ₹{metrics.customerRiskList.find(c=>c.name === selectedCustName)?.clv.toLocaleString()}
                      </strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Retention score</span>
                      <strong className="text-emerald-600 block text-base mt-1">
                        {metrics.customerRiskList.find(c=>c.name === selectedCustName)?.retentionScore}%
                      </strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Revenue contribution</span>
                      <strong className="text-indigo-600 block text-base mt-1">
                        {metrics.customerRiskList.find(c=>c.name === selectedCustName)?.revenueContrib}%
                      </strong>
                    </div>
                  </div>

                  {/* Notes Logging */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Log Action Follow-up Notes</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Log follow-up details..."
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        className={`flex-1 p-2 border rounded-xl text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}
                      />
                      <button onClick={handleAddNote} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">Add Note</button>
                    </div>
                  </div>

                  {/* Customer Timeline (Module 4 Timeline Engine) */}
                  <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Chronological Customer Timeline</h4>
                    <div className="space-y-4 relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 text-xs">
                      {currentTimelineWithNotes.map((t, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-primary shadow-sm" />
                          <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                            <span>{t.type}</span>
                            <span className="text-slate-400 text-[10px]">{new Date(t.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-500 mt-1">{t.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-center py-12">No customer data selected.</p>
              )}
            </Card>
          </div>
        )}

        {/* ─── TAB: OPERATIONS & APPROVALS (Module 1 Tasks, 9 visit tracker, 2 Approval workflows) ─── */}
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300 text-xs font-semibold">
            {/* Task Management Panel (Module 1) */}
            <Card className={`p-5 space-y-4 lg:col-span-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-brand-primary" /> Task & Follow-up Center
              </CardTitle>

              {/* Task list */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-hide">
                {tasks.map((t, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block">{t.title}</span>
                      <p className="text-[10px] text-slate-400 mt-1">Assignee: {t.assignee} ({t.role}) | Customer: {t.customer} | Due: {t.dueDate}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${
                      t.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>

              {/* Task Creation Form */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block mb-1 text-slate-400">Task Title</label>
                  <input type="text" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} placeholder="e.g. Call customer for recovery followup..." className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                </div>
                <div>
                  <label className="block mb-1 text-slate-400">Assignee Representative</label>
                  <input type="text" value={newTaskAssignee} onChange={e=>setNewTaskAssignee(e.target.value)} placeholder="Assignee Name" className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                </div>
                <div>
                  <label className="block mb-1 text-slate-400">Due Date</label>
                  <input type="date" value={newTaskDueDate} onChange={e=>setNewTaskDueDate(e.target.value)} className={`w-full p-2 border rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                </div>
                <button onClick={handleAddTask} className="col-span-2 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                  Assign Task
                </button>
              </div>
            </Card>

            {/* Approval Workflow Engine (Module 2) */}
            <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" /> Approval Workflow Engine
              </CardTitle>
              <div className="space-y-3">
                {approvals.map((a, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                      <span>{a.type}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] ${
                        a.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : a.status === 'Denied' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>{a.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Customer: {a.customer} | Limit requested: ₹{a.amount.toLocaleString()} | Initiated: {a.initiator}</p>
                    {a.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprovalAction(a.id, 'Approved')} className="flex-1 py-1 bg-emerald-600 text-white rounded font-bold text-[10px]">Approve</button>
                        <button onClick={() => handleApprovalAction(a.id, 'Denied')} className="flex-1 py-1 bg-rose-600 text-white rounded font-bold text-[10px]">Deny</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAB: CREDIT & RECOVERY (Module 3 credit system & Module 8 collection efficiency) ─── */}
        {activeTab === 'credit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* Credit metrics panel (Module 3) */}
            <Card className={`lg:col-span-2 overflow-hidden flex flex-col h-[550px] ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
              <CardHeader className="py-4 border-b border-slate-50 dark:border-slate-800">
                <CardTitle className="text-sm font-black">Customer Credit Limits & Utilization</CardTitle>
              </CardHeader>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left text-xs border-collapse font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="px-5 py-3">Customer Name</th>
                      <th className="px-5 py-3 text-right">Credit Limit</th>
                      <th className="px-5 py-3 text-right">Used Credit</th>
                      <th className="px-5 py-3 text-right">Available Credit</th>
                      <th className="px-5 py-3 text-right">Utilization (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
                    {metrics.customerRiskList.map((c, idx) => {
                      const limit = 300000; // standard mock credit limit
                      const used = c.pendingAmt;
                      const available = limit - used;
                      const utilization = Math.round((used / limit) * 100);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                          <td className="px-5 py-4 text-right">₹{limit.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right font-black text-rose-600">₹{used.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right text-emerald-600">₹{available.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right font-black">{utilization}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recovery summaries & collection efficiency trend */}
            <div className="space-y-6">
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black">Collection Efficiency Trend</CardTitle>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.stateStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="pendingVal" name="Collections Outstanding" stroke="#f59e0b" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ─── TAB: TARGETS & SCORECARDS (Module 7 target manager & Module 8 scorecards) ─── */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300 text-xs">
            {/* KPI Target Manager (Module 7) */}
            <Card className={`p-5 space-y-4 lg:col-span-1 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-500" /> KPI Targets & Achievements
              </CardTitle>
              <div className="space-y-4">
                {targets.map((t, idx) => {
                  const achPct = Math.round((t.achieved / t.target) * 100);
                  return (
                    <div key={idx} className="space-y-1 font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between text-[11px]">
                        <span>{t.category}</span>
                        <span>{achPct}% Achieved</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full" style={{ width: `${achPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Salesperson Scorecard (Module 8) */}
            <Card className={`p-5 space-y-4 lg:col-span-2 overflow-hidden flex flex-col h-[500px] ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-black">Sales Representative Scorecards</CardTitle>
              </CardHeader>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left text-xs border-collapse font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="px-5 py-3">Representative</th>
                      <th className="px-5 py-3 text-right">Revenue Closed</th>
                      <th className="px-5 py-3 text-right">Pending Orders</th>
                      <th className="px-5 py-3 text-right">Fulfillment Success</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
                    {metrics.salesmanStats.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{s.name}</td>
                        <td className="px-5 py-4 text-right text-slate-900 dark:text-white font-black">₹{s.revenue.toLocaleString()}</td>
                        <td className="px-5 py-4 text-right text-amber-500">{s.pending} orders</td>
                        <td className="px-5 py-4 text-right font-black text-indigo-600">{s.dispatchRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAB: DOCUMENTS & COMMUNICATIONS (Module 4 Documents center & Module 5 Communication history) ─── */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300 text-xs">
            {/* Document Index Center (Module 4) */}
            <Card className={`p-5 space-y-4 lg:col-span-1 h-[500px] flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-primary" /> Logistical Document Index
              </CardTitle>
              <div className="flex-1 overflow-y-auto space-y-3">
                {documents.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <File className="h-5 w-5 text-slate-400" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block">{doc.name}</span>
                        <p className="text-[10px] text-slate-400 mt-1">Type: {doc.type} | Customer: {doc.customer}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{doc.size}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Communication Simulator (Module 5 communication logs) */}
            <Card className={`p-5 space-y-4 lg:col-span-2 h-[500px] flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Clipboard className="h-4 w-4 text-indigo-500" /> Client Communication Hub
              </CardTitle>
              
              <div className="space-y-4">
                <span className="font-bold text-slate-400">Quick dispatch Comms templates:</span>
                <div className="grid grid-cols-2 gap-4">
                  {metrics.customerRiskList.slice(0, 4).map((c, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white">{c.name}</span>
                        <p className="text-[10px] text-slate-400 mt-1">Outstanding: ₹{c.pendingAmt.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleSendComms(c.name, 'whatsapp')} className="px-2 py-1.5 bg-[#25D366] text-white rounded-lg font-bold text-[10px]">WhatsApp</button>
                        <button onClick={() => handleSendComms(c.name, 'email')} className="px-2 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[10px]">Email</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="font-bold text-slate-400 block mb-3">Communication Logs</span>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                    {commsLog.map((log, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800 dark:text-white uppercase text-[10px]">{log.type} sent to {log.customer}</strong>
                          <p className="text-[10px] text-slate-400 mt-0.5">{log.message}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0">{log.timestamp}</span>
                      </div>
                    ))}
                    {commsLog.length === 0 && <p className="text-slate-400 text-center py-4">No logged communications.</p>}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAB: AI DIAGNOSTICS & SYSTEM MONITOR (Module 10 anomaly, 11 data quality, 12 audit logs, 16 system health) ─── */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-8 animate-in fade-in duration-300 text-xs font-semibold">
            {/* Top row: AI Anomaly & Data Quality auditor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Anomaly detection (Module 10) */}
              <Card className={`p-5 space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> AI Operations Anomaly Triggers
                </CardTitle>
                <div className="space-y-2">
                  {metrics.anomalies.map((a, idx) => (
                    <div key={idx} className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-100 dark:border-rose-900 rounded-xl leading-relaxed">
                      {a}
                    </div>
                  ))}
                  {metrics.anomalies.length === 0 && <p className="text-slate-400 py-4 text-center">No structural operational anomalies detected.</p>}
                </div>
              </Card>

              {/* Data quality auditor (Module 11) */}
              <Card className={`p-5 space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black text-amber-500 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Data Quality Auditor
                </CardTitle>
                <div className="space-y-2">
                  {metrics.dataAuditIssues.map((issue, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-100 dark:border-amber-900 rounded-xl leading-relaxed">
                      {issue}
                    </div>
                  ))}
                  {metrics.dataAuditIssues.length === 0 && <p className="text-slate-400 py-4 text-center">Data integrity checks passed with 100% rating.</p>}
                </div>
              </Card>
            </div>

            {/* Bottom Row: Audit Logs (Module 12) & System Health Dashboard (Module 16) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Audit Logs */}
              <Card className={`lg:col-span-2 overflow-hidden flex flex-col h-[350px] ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                <CardHeader className="py-4 border-b border-slate-50 dark:border-slate-800">
                  <CardTitle className="text-sm font-black">Security Audit Logs</CardTitle>
                </CardHeader>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse font-semibold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="px-5 py-3">Timestamp</th>
                        <th className="px-5 py-3">Operator</th>
                        <th className="px-5 py-3">Action</th>
                        <th className="px-5 py-3">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
                      {auditLogs.map((log, idx) => (
                        <tr key={idx}>
                          <td className="px-5 py-3.5 text-slate-400">{log.timestamp}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-950 dark:text-white">{log.user}</td>
                          <td className="px-5 py-3.5 text-indigo-600">{log.action}</td>
                          <td className="px-5 py-3.5 text-slate-500">{log.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* System Health */}
              <Card className={`p-5 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Brain className="h-4 w-4 text-emerald-500" /> Logistical System Status
                </CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Database Engine Status</span>
                    <span className="text-emerald-500">✓ SQLite Connected</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>IndexedDB Sync State</span>
                    <span className="text-emerald-500">✓ Active</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>Outstanding Job Backlog</span>
                    <span>0 Pending jobs</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
