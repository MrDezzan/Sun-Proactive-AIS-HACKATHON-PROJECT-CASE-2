'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      // Сохранение JWT токена
      setToken(data.token);

      router.push(data.redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-20 pb-20 flex justify-center">
      <div className="glass-panel p-10 w-full max-w-[400px]">
        <h1 className="text-2xl font-bold mb-2 text-center">Вход в систему</h1>
        <p className="text-slate-500 mb-8 text-center text-[0.9rem]">
          Доступ для кураторов, волонтёров и админа.
        </p>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-[0.9rem]">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-[0.85rem] font-semibold mb-2 text-slate-500">Email (или логин)</label>
            <input 
              type="text" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-[0.85rem] font-semibold mb-2 text-slate-500">Пароль</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center text-[0.9rem]">
          Нет аккаунта? <Link href="/register" className="text-orange-500 font-semibold">Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}
