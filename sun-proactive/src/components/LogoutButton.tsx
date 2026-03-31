'use client';

import { useRouter } from 'next/navigation';
import { removeToken } from '@/lib/api';

export function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    removeToken();
    router.push('/login');
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 transition-colors font-medium text-sm bg-transparent border-none cursor-pointer p-0">
      Выйти
    </button>
  );
}
