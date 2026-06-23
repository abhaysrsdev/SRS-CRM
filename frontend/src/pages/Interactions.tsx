import React, { useState } from 'react';
import { useCustomers } from '../hooks/useQueries';
import { useCRMStore } from '../lib/store';
import { Skeleton } from '../components/ui/skeleton';
import { Activity, Mic, FileText, ShoppingCart, MessageCircle, Phone, Package, Bell, Filter, Plus, X, Check } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

type InteractionType = 'all' | 'voice' | 'whatsapp' | 'catalog' | 'order' | 'followup' | 'note' | 'sample' | 'call';

const TYPE_CONFIGS: Record<string, { icon: React.FC<any>; color: string; label: string }> = {
  voice:    { icon: Mic,            color: 'bg-purple-100 text-purple-600',       label: 'Voice Note'     },
  whatsapp: { icon: MessageCircle,  color: 'bg-emerald-100 text-emerald-600',     label: 'WhatsApp'       },
  catalog:  { icon: FileText,       color: 'bg-blue-100 text-blue-600',           label: 'Catalog Sent'   },
  order:    { icon: ShoppingCart,   color: 'bg-brand-primary/10 text-brand-primary', label: 'Order'        },
  followup: { icon: Bell,           color: 'bg-amber-100 text-amber-600',         label: 'Follow-Up'      },
  note:     { icon: FileText,       color: 'bg-slate-100 text-slate-600',         label: 'Note'           },
  sample:   { icon: Package,        color: 'bg-rose-100 text-rose-600',           label: 'Sample Sent'    },
  call:     { icon: Phone,          color: 'bg-indigo-100 text-indigo-600',       label: 'Call'           },
};

const FILTER_TYPES: { key: InteractionType; label: string }[] = [
  { key: 'all',      label: 'All'        },
  { key: 'call',     label: 'Calls'      },
  { key: 'whatsapp', label: 'WhatsApp'   },
  { key: 'catalog',  label: 'Catalog'    },
  { key: 'voice',    label: 'Voice Notes'},
  { key: 'order',    label: 'Orders'     },
  { key: 'followup', label: 'Follow-Ups' },
  { key: 'note',     label: 'Notes'      },
  { key: 'sample',   label: 'Samples'    },
];

// Realistic timeline seed items
const getBaseInteractions = (customers: any[]) => [
  { type: 'voice',    user: 'SR Studio',  party: customers[0]?.name, time: '2 mins ago',   text: 'Left a voice note regarding new shipment.' },
  { type: 'whatsapp', user: 'Auto-Bot',   party: customers[1]?.name, time: '15 mins ago',  text: 'Sent catalog PDF via WhatsApp.' },
  { type: 'order',    user: 'SR Studio',  party: customers[2]?.name, time: '1 hour ago',   text: 'Created Purchase Order for 50 pieces.' },
  { type: 'note',     user: 'Admin',      party: customers[3]?.name, time: '3 hours ago',  text: 'Updated ledger details and contact info.' },
  { type: 'voice',    user: 'SR Studio',  party: customers[4]?.name, time: '5 hours ago',  text: 'Recorded feedback about Dead Stock items.' },
  { type: 'call',     user: 'SR Studio',  party: customers[5]?.name, time: '6 hours ago',  text: 'Called regarding new festive collection arrival.' },
  { type: 'catalog',  user: 'SR Studio',  party: customers[6]?.name, time: '8 hours ago',  text: 'Shared VIP catalog with 45 new designs.' },
  { type: 'sample',   user: 'SR Studio',  party: customers[7]?.name, time: '1 day ago',    text: 'Sent 3 product samples via courier.' },
  { type: 'followup', user: 'System',     party: customers[8]?.name, time: '1 day ago',    text: 'Auto-reminder: Customer not contacted in 15 days.' },
  { type: 'whatsapp', user: 'SR Studio',  party: customers[9]?.name, time: '2 days ago',   text: 'Sent festive season offer message.' },
];

export function Interactions() {
  const { data: customers, isLoading } = useCustomers();
  const crmInteractions = useCRMStore((s) => s.interactions);
  const addInteraction = useCRMStore((s) => s.addInteraction);

  const [activeFilter, setActiveFilter] = useState<InteractionType>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({ type: 'call', party: '', notes: '', followUpDate: '' });
  const [logSuccess, setLogSuccess] = useState(false);

  if (isLoading || !customers) {
    return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;
  }

  const baseItems = getBaseInteractions(customers).filter((i) => i.party);

  // Merge with real CRM interactions
  const realItems = crmInteractions.slice(0, 20).map((i) => ({
    type: 'note',
    user: 'CRM',
    party: customers.find((c) => c.id === i.customerId)?.name || 'Unknown',
    time: format(new Date(i.contactDate), 'dd MMM, h:mm a'),
    text: i.narration || i.discussionNotes || 'Interaction logged.',
  }));

  const allItems = [...realItems, ...baseItems];
  const filtered = activeFilter === 'all' ? allItems : allItems.filter((i) => i.type === activeFilter);

  const handleLogInteraction = () => {
    if (!newLog.party || !newLog.notes) return;
    const customer = customers.find((c) => c.name.toLowerCase().includes(newLog.party.toLowerCase()));
    if (customer) {
      addInteraction({
        customerId: customer.id,
        contactDate: new Date().toISOString(),
        narration: newLog.notes,
        discussionNotes: newLog.notes,
        followUpDate: newLog.followUpDate || '',
        status: 'Completed',
      });
    }
    setLogSuccess(true);
    setTimeout(() => { setLogSuccess(false); setShowLogModal(false); setNewLog({ type: 'call', party: '', notes: '', followUpDate: '' }); }, 1500);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-brand-bg relative overflow-y-auto overflow-x-hidden scrollbar-hide">

      {/* Log Interaction Modal */}
      <AnimatePresence>
        {showLogModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={() => setShowLogModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 max-h-full overflow-y-auto scrollbar-hide pointer-events-auto">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                <h3 className="font-black text-slate-900 text-lg">Log Interaction</h3>
                <button onClick={() => setShowLogModal(false)} className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {logSuccess ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="font-bold text-emerald-700">Interaction logged successfully!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Interaction Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(TYPE_CONFIGS).slice(0, 8).map(([key, cfg]) => (
                        <button key={key} onClick={() => setNewLog((p) => ({ ...p, type: key }))}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-xs font-bold ${
                            newLog.type === key ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                          }`}>
                          <cfg.icon className="h-4 w-4" />
                          <span className="text-[9px]">{cfg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Party Name</label>
                    <input type="text" placeholder="Search party..." value={newLog.party}
                      onChange={(e) => setNewLog((p) => ({ ...p, party: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Notes</label>
                    <textarea placeholder="What was discussed?" value={newLog.notes}
                      onChange={(e) => setNewLog((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full min-h-[80px] px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Follow-Up Date (optional)</label>
                    <input type="date" value={newLog.followUpDate}
                      onChange={(e) => setNewLog((p) => ({ ...p, followUpDate: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                  <button onClick={handleLogInteraction}
                    className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl hover:bg-brand-secondary transition-all shadow-md shadow-brand-primary/20">
                    Save Interaction
                  </button>
                </div>
              )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-8 pb-4 bg-white/50 backdrop-blur-md border-b border-slate-200 shadow-sm z-10 shrink-0">
        <FadeIn>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Global Interactions</h2>
              <p className="text-muted-foreground mt-1 text-sm">Real-time timeline of all CRM activities.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogModal(true)}
              className="ml-auto flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-brand-primary/20 hover:bg-brand-secondary transition-all"
            >
              <Plus className="h-4 w-4" />
              Log Interaction
            </motion.button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_TYPES.map((ft) => (
              <button
                key={ft.key}
                onClick={() => setActiveFilter(ft.key)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === ft.key
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-primary/40'
                }`}
              >
                {ft.label}
                {ft.key === 'all' && ` (${allItems.length})`}
              </button>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Timeline */}
      <div className="p-8 max-w-3xl mx-auto w-full">
        <StaggerContainer className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {filtered.map((interaction, i) => {
            const config = TYPE_CONFIGS[interaction.type] || TYPE_CONFIGS.note;
            return (
              <StaggerItem key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active flex-wrap gap-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${config.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10 relative left-0 md:left-1/2`}>
                  <config.icon className="h-4 w-4" />
                </div>

                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl shadow-soft border border-slate-100 hover:shadow-md hover:border-brand-primary/20 transition-all">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
                    <span className="font-bold text-slate-900 text-sm">{interaction.party}</span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{interaction.time}</span>
                  </div>
                  <p className="text-slate-600 text-sm">{interaction.text}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-medium flex-wrap gap-4">
                    <span>By {interaction.user}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 py-16">
            <Filter className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No interactions of this type yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
