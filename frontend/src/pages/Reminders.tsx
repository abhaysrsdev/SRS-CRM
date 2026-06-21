import { useState } from 'react';
import { useCustomers } from '../hooks/useQueries';
import { useCRMStore } from '../lib/store';
import { Skeleton } from '../components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { Bell, Calendar, Clock, AlertCircle, Search, Check } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Reminders() {
  const navigate = useNavigate();
  const { data: customers, isLoading } = useCustomers();
  const addInteraction = useCRMStore((s) => s.addInteraction);
  const [searchTerm, setSearchTerm] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  if (isLoading || !customers) {
    return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;
  }

  const today = new Date();

  // Smart follow-up messages
  const getSmartNote = (diffDays: number, customer: any): string => {
    if (diffDays < -30) return `🔴 Critical: Not contacted in ${Math.abs(diffDays)} days. High risk of churn.`;
    if (diffDays < -15) return `⚠️ Overdue by ${Math.abs(diffDays)} days. Send WhatsApp update.`;
    if (diffDays < 0) return `Follow-up overdue — call regarding new arrivals.`;
    if (diffDays === 0) return `📞 Call today — check if interested in new season collection.`;
    if (customer.purchaseFrequency > 10) return `High-value customer due for check-in. Send VIP catalog.`;
    return `Upcoming check-in. Review purchase history before calling.`;
  };

  const allReminders = customers.map((c) => {
    const contactDate = new Date(c.lastContactedDate);
    const dueDate = new Date(contactDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const diffDays = differenceInDays(dueDate, today);

    let listType = 'green';
    if (diffDays < 0) listType = 'red';
    else if (diffDays === 0) listType = 'yellow';

    return {
      id: c.id,
      name: c.name,
      mobile: c.mobileNumber,
      dueDate,
      diffDays,
      listType,
      notes: getSmartNote(diffDays, c),
      score: c.partyScore,
      isCompleted: completedIds.has(c.id),
    };
  }).filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !r.isCompleted
  );

  const redList = allReminders.filter((r) => r.listType === 'red').sort((a, b) => a.diffDays - b.diffDays).slice(0, 15);
  const yellowList = allReminders.filter((r) => r.listType === 'yellow').slice(0, 15);
  const greenList = allReminders.filter((r) => r.listType === 'green').sort((a, b) => a.diffDays - b.diffDays).slice(0, 15);
  const completedList = customers
    .filter((c) => completedIds.has(c.id))
    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 10);

  const handleMarkComplete = (customerId: string) => {
    setCompletedIds((prev) => new Set([...prev, customerId]));
    addInteraction({
      customerId,
      contactDate: new Date().toISOString(),
      narration: 'Follow-up completed via Reminders page.',
      discussionNotes: 'Marked as completed',
      followUpDate: '',
      status: 'Completed',
    });
  };

  const lists = [
    {
      title: 'Overdue Reminders',
      subtitle: '> 3 days late',
      color: 'bg-rose-50 border-rose-200 text-rose-900',
      headerColor: 'bg-rose-500',
      iconColor: 'text-rose-500',
      icon: AlertCircle,
      items: redList,
    },
    {
      title: 'Due Today',
      subtitle: 'Action required',
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      headerColor: 'bg-amber-500',
      iconColor: 'text-amber-500',
      icon: Clock,
      items: yellowList,
    },
    {
      title: 'Upcoming (Next 7 Days)',
      subtitle: 'Scheduled follow-ups',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      headerColor: 'bg-emerald-500',
      iconColor: 'text-emerald-500',
      icon: Calendar,
      items: greenList,
    },
    {
      title: 'Completed',
      subtitle: 'Done this session',
      color: 'bg-slate-50 border-slate-200 text-slate-900',
      headerColor: 'bg-slate-400',
      iconColor: 'text-slate-400',
      icon: Check,
      items: completedList.map((c) => ({
        id: c.id, name: c.name, mobile: c.mobileNumber,
        dueDate: new Date(), diffDays: 0, listType: 'completed',
        notes: 'Follow-up completed.', score: c.partyScore, isCompleted: true,
      })),
    },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-brand-bg relative overflow-hidden">

      {/* Header */}
      <div className="p-8 pb-4 shrink-0 bg-white/50 backdrop-blur-md border-b border-slate-200 shadow-sm z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <FadeIn>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Bell className="h-8 w-8 text-brand-primary" />
            Follow-Up Engine
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Smart prioritization of your daily tasks.</p>
        </FadeIn>

        <FadeIn delay={0.1} className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search reminders by party name..."
            className="pl-10 bg-white shadow-sm focus-visible:ring-brand-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FadeIn>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-8 flex gap-6">
        {lists.map((list, listIdx) => (
          <FadeIn
            key={list.title}
            delay={0.2 + listIdx * 0.1}
            className="w-80 sm:w-96 shrink-0 flex flex-col bg-slate-50/50 rounded-3xl border border-slate-200 overflow-hidden shadow-soft"
          >
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100 ${list.iconColor}`}>
                <list.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{list.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{list.subtitle}</p>
              </div>
              <div className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold text-white ${list.headerColor}`}>
                {list.items.length}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              <StaggerContainer>
                {list.items.map((reminder) => (
                  <StaggerItem
                    key={reminder.id}
                    className={`bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${
                      list.iconColor === 'text-rose-500' ? 'border-rose-100 hover:border-rose-300' :
                      list.iconColor === 'text-amber-500' ? 'border-amber-100 hover:border-amber-300' :
                      list.iconColor === 'text-slate-400' ? 'border-slate-100 opacity-60' :
                      'border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${list.headerColor} opacity-50 group-hover:opacity-100 transition-opacity`} />

                    <div
                      className="flex justify-between items-start mb-2 pl-2 cursor-pointer"
                      onClick={() => navigate('/crm-lists', { state: { customerId: reminder.id } })}
                    >
                      <h4 className="font-bold text-slate-900 text-sm leading-tight pr-4 group-hover:text-brand-primary transition-colors">{reminder.name}</h4>
                      <Badge variant="outline" className={`shrink-0 ${list.iconColor === 'text-rose-500' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600'}`}>
                        {format(reminder.dueDate, 'MMM dd')}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 font-medium pl-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                      {reminder.notes}
                    </p>

                    <div className="flex justify-between items-center text-xs pl-2">
                      <span className="text-slate-400 truncate max-w-[120px]">{reminder.mobile}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">Score: {reminder.score}</span>
                        {/* Mark Complete button */}
                        {list.iconColor !== 'text-slate-400' && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMarkComplete(reminder.id)}
                            className="h-7 w-7 bg-emerald-100 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
                            title="Mark as Done"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
                {list.items.length === 0 && (
                  <div className="text-center text-slate-400 text-sm mt-10">No reminders in this list.</div>
                )}
              </StaggerContainer>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
