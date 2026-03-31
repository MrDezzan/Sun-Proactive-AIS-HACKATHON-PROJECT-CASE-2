'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError('Пароль должен быть не менее 4 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка при смене пароля');
      }

      setSuccess(true);
      
      // Через 2 секунды перенаправляем в панель управления в зависимости от роли
      setTimeout(() => {
        const user = getUser();
        if (user?.role === 'admin') router.push('/admin');
        else if (user?.role === 'curator') router.push('/curator');
        else router.push('/volunteer');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-20 pb-20 flex justify-center">
      <div className="glass-panel p-10 w-full max-w-[450px]">
        <h1 className="text-2xl font-bold mb-2 text-center text-orange-600">Безопасность прежде всего</h1>
        <p className="text-slate-500 mb-8 text-center text-[0.9rem]">
          Для продолжения необходимо сменить стандартный пароль на более надежный.
        </p>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-[0.9rem]">{error}</div>}
        {success && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-4 text-center">
            <div className="font-bold mb-1">Пароль успешно изменен!</div>
            <div className="text-sm">Теперь вы будете перенаправлены в панель управления...</div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-[0.85rem] font-semibold mb-2 text-slate-500">Новый пароль</label>
              <input 
                type="password" 
                className="input-field" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                minLength={4}
              />
            </div>
            <div>
              <label className="block text-[0.85rem] font-semibold mb-2 text-slate-500">Подтвердите пароль</label>
              <input 
                type="password" 
                className="input-field" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                minLength={4}
              />
            </div>
            <button type="submit" className="btn-primary py-3 mt-2 shadow-lg shadow-orange-500/20" disabled={loading}>
              {loading ? 'Сохранение...' : 'Обновить пароль и войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
