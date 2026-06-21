import React from 'react';
import { useCustomers, useInteractions, useSalesOrders } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// import { Badge } from '../components/ui/badge';
import { Users, Flame, Snowflake, UserX, Clock, CalendarHeart, Award, TrendingUp, ShoppingBag } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { useNavigate } from 'react-router-dom';


export function Dashboard() {
  const navigate = useNavigate();
  const { data: customers, isLoading: isCustomersLoading } = useCustomers();
  const { data: interactions, isLoading: isInteractionsLoading } = useInteractions('CUS0001');
  const { data: salesOrders } = useSalesOrders();

  // Calculations
  const totalCustomers = customers?.length || 0;
  const hotParties = customers?.filter(c => c.partyScore >= 80).length || 0;
  const coldLeads = customers?.filter(c => c.segment === 'Cold Leads').length || 0;
  const lostCustomers = customers?.filter(c => c.segment === 'Lot Parties').length || 0;
  
  const totalRevenue = customers?.reduce((acc, c) => acc + c.revenueGenerated, 0) || 0;
  const pendingOrdersCount = salesOrders?.filter(o => o.balPcs > 0).length || 0;

  const topCustomers = customers ? [...customers].sort((a,b) => b.partyScore - a.partyScore).slice(0, 5) : [];

  const today = new Date();
  const upcomingReminders = customers ? [...customers].filter(c => {
    const contactDate = new Date(c.lastContactedDate);
    const dueDate = new Date(contactDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const diffDays = differenceInDays(today, dueDate);
    return diffDays >= -7 && diffDays <= 3;
  }).slice(0, 5) : [];

  const kpis = [
    { title: 'Total Parties', value: totalCustomers, icon: Users, color: 'text-brand-primary', bgColor: 'bg-brand-primary/10' },
    { title: 'Revenue Pipeline', value: `₹${(totalRevenue / 100000).toFixed(2)}L`, icon: TrendingUp, color: 'text-brand-secondary', bgColor: 'bg-brand-secondary/10' },
    { title: 'Pending Orders', value: pendingOrdersCount, icon: ShoppingBag, color: 'text-indigo-600', bgColor: 'bg-indigo-50', path: '/sales-orders' },
    { title: 'Hot Parties', value: hotParties, icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { title: 'Cold Leads', value: coldLeads, icon: Snowflake, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    { title: 'Lot Parties', value: lostCustomers, icon: UserX, color: 'text-rose-600', bgColor: 'bg-rose-100' },
  ];

  const chartData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 },
    { name: 'May', revenue: 6000 },
    { name: 'Jun', revenue: 7500 },
  ];

  if (isCustomersLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-48"/><Skeleton className="h-64 w-full"/></div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto pb-10">
      <FadeIn>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Executive Dashboard</h2>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Enterprise intelligence and real-time activity tracking.</p>
      </FadeIn>
      
      {/* Top Level KPIs */}
      <StaggerContainer className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, i) => (
          <StaggerItem 
            key={i} 
            onClick={() => {
              if (kpi.path) {
                navigate(kpi.path);
              } else if (kpi.title !== 'Revenue Pipeline') {
                navigate('/crm-lists', { state: { filter: kpi.title } });
              }
            }}
            className={`bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden hover:shadow-lg transition-shadow relative group cursor-pointer hover:ring-2 hover:ring-brand-primary/20`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-5 relative z-10">
              <div className="flex flex-row items-center justify-between pb-2">
                <h3 className="text-sm font-semibold text-slate-500">{kpi.title}</h3>
                <div className={`p-2.5 rounded-xl ${kpi.bgColor}`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{kpi.value}</div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart (Takes 2 cols) */}
        <FadeIn delay={0.2} className="lg:col-span-2">
          <Card className="shadow-soft border-slate-100 h-[450px] flex flex-col">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                Revenue Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#2563EB', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Top Customers Leaderboard */}
        <FadeIn delay={0.3}>
          <Card className="shadow-soft border-slate-100 flex flex-col h-[450px]">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Top Conversion Leaders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-slate-50">
                {topCustomers.map((customer, index) => (
                  <div 
                    key={customer.id} 
                    onClick={() => navigate('/crm-lists', { state: { customerId: customer.id } })}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group cursor-pointer"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                      index === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900' :
                      index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700' :
                      index === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-900' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate group-hover:text-brand-primary transition-colors">{customer.name}</div>
                      <div className="text-xs text-slate-500 mt-1">Lead Score: <span className="font-semibold text-emerald-600">{customer.partyScore}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

      </div>
    </div>
  );
}
