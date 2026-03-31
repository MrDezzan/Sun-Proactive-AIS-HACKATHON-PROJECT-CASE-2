'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Notification = {
  id: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  
  const fetchNotifications = async () => {
    try {
      const res = await api('/notifications');
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = items.filter(n => !n.isRead).length;

  const handleRead = async (n: Notification) => {
    if (!n.isRead) {
      await api('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ notificationId: n.id })
      });
      fetchNotifications();
    }
    setIsOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border-none cursor-pointer transition-all hover:bg-slate-200"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-[100] overflow-hidden">
          <div className="p-3 px-4 border-b border-slate-200 font-semibold text-[0.9rem]">
            Уведомления
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-[0.9rem]">
                Нет новых уведомлений
              </div>
            ) : items.map((n) => (
              <div 
                key={n.id} 
                onClick={() => handleRead(n)}
                className={`p-3 px-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${n.isRead ? 'bg-white' : 'bg-green-50'}`}
              >
                <div className="text-[0.85rem] text-slate-700 leading-snug">
                  {n.message}
                </div>
                <div className="text-[0.75rem] text-slate-400 mt-1">
                  {new Date(n.createdAt).toLocaleString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
