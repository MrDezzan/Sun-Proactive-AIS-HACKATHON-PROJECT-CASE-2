'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/api';
import { LogoutButton } from '@/components/LogoutButton';
import { NotificationCenter } from '@/components/NotificationCenter';

export function Navbar() {
  const [user, setUser] = useState<{ id: string; role: string; isApproved: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  // Слушаем изменения в хранилище (вход/выход в других вкладках) и auth_changed (в этой же вкладке)
  useEffect(() => {
    const handleStorage = () => setUser(getUser());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth_changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth_changed', handleStorage);
    };
  }, []);

  if (!mounted) return null;

  return (
    <header className="px-8 py-4 bg-white/90 backdrop-blur-md border-b border-black/5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <Link href="/" className="flex items-center gap-3 text-inherit no-underline">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white font-bold text-[0.9rem] shadow-[0_4px_10px_rgba(249,115,22,0.3)]">SP</div>
        <span className="font-bold text-xl tracking-tight text-slate-900">Sun Proactive</span>
      </Link>
      
      <nav className="flex items-center gap-6 text-[0.95rem] font-medium">
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link 
                href="/admin" 
                className="bg-slate-900 text-white no-underline px-5 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all"
              >
                Админ-Панель
              </Link>
            )}
            {user.role === 'curator' && <Link href="/curator" className="text-slate-900 no-underline hover:text-orange-500 transition-colors">Кабинет Куратора</Link>}
            {user.role === 'volunteer' && (
              <>
                <Link href="/volunteer" className="text-slate-900 no-underline hover:text-orange-500 transition-colors font-semibold">Задачи</Link>
                <Link href="/volunteer/community" className="text-slate-900 no-underline hover:text-orange-500 transition-colors font-semibold">Комьюнити</Link>
                <Link 
                  href={`/volunteer/profile/${user.id}`} 
                  className="bg-gradient-to-br from-orange-500 to-orange-600 text-white no-underline px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 hover:scale-105 transition-all"
                >
                  Мой Профиль
                </Link>
              </>
            )}
            <NotificationCenter />
            <div className="w-px h-4 bg-slate-200"></div>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-slate-500 hover:text-slate-900 no-underline transition-colors">Войти</Link>
            <Link href="/register" className="btn-primary no-underline px-4 py-2 rounded-full text-[0.85rem]">Регистрация</Link>
          </>
        )}
      </nav>
    </header>
  );
}
