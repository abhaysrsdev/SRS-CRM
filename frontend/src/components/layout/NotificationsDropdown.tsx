import React from 'react';
import { Bell, Package, Calendar, Activity, Check, RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const NOTIFICATIONS = [
  { id: 1, type: 'inventory', title: 'Low Stock Alert', desc: 'Saree 1205 is under 5 pieces', time: '10m ago', icon: Package, color: 'text-amber-500', bg: 'bg-amber-100' },
  { id: 2, type: 'reminder', title: 'Follow-up Scheduled', desc: 'Call Ramesh regarding lot purchase', time: '1h ago', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 3, type: 'system', title: 'Drive Sync Completed', desc: '24 new images synced from Google Drive', time: '3h ago', icon: RefreshCw, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { id: 4, type: 'security', title: 'New Login', desc: 'Login detected from Chrome on Windows', time: '1d ago', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-100' },
];

export function NotificationsDropdown() {
  const [unread, setUnread] = React.useState(3);
  const [notifications, setNotifications] = React.useState(NOTIFICATIONS);

  const markAllRead = () => {
    setUnread(0);
  };

  const removeNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (unread > 0) setUnread(u => u - 1);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors focus:outline-none">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl border-slate-100">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-t-2xl">
          <div>
            <DropdownMenuLabel className="p-0 text-base font-black text-slate-900">Notifications</DropdownMenuLabel>
            <p className="text-xs text-slate-500 font-medium">{unread} unread alerts</p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-8 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 rounded-lg">
              <Check className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide space-y-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">All caught up!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} className="p-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50 group flex items-start gap-4 transition-colors">
                <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${notif.bg}`}>
                  <notif.icon className={`h-5 w-5 ${notif.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{notif.title}</p>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5 pr-4 line-clamp-2">{notif.desc}</p>
                </div>
                <button onClick={(e) => removeNotification(notif.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded-md transition-all absolute right-3 top-4">
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <div className="p-2 border-t border-slate-100">
          <Button variant="ghost" className="w-full text-xs font-bold text-slate-600 hover:text-brand-primary hover:bg-slate-50 rounded-xl h-9">
            View All Activity History
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
