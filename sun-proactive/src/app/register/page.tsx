'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'volunteer' | 'curator'>('volunteer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [skills, setSkills] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Минимально допустимый возраст 12 лет
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 12);
  const maxDateString = maxDate.toISOString().split('T')[0];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const skillsArr = skills ? skills.split(',').map(s => s.trim()) : [];
      const bodyParams: any = { email, password, role, name, skills: skillsArr, birthDate };
      if (role === 'volunteer') {
        bodyParams.city = city;
      }
      const res = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(bodyParams)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка регистрации');
      }

      setSuccess(data.message);

      // Автоматический вход после успешной регистрации
      const loginRes = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      
      if (loginRes.ok && loginData.token) {
        setToken(loginData.token);
        setTimeout(() => {
          router.push(loginData.redirect || '/');
          router.refresh();
        }, 1000);
      } else {
        setTimeout(() => router.push('/login'), 2500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-16 flex justify-center">
      <div className="glass-panel p-10 w-full max-w-[500px]">
        <h1 className="text-2xl font-bold mb-2 text-center">Регистрация</h1>

        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          <button 
            type="button"
            className={`flex-1 py-2.5 rounded-lg border-none cursor-pointer transition-all ${role === 'volunteer' ? 'bg-white font-semibold shadow-sm' : 'bg-transparent font-normal'}`}
            onClick={() => setRole('volunteer')}
          >
            Волонтёр
          </button>
          <button 
            type="button"
            className={`flex-1 py-2.5 rounded-lg border-none cursor-pointer transition-all ${role === 'curator' ? 'bg-white font-semibold shadow-sm' : 'bg-transparent font-normal'}`}
            onClick={() => setRole('curator')}
          >
            Куратор (Организатор)
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-[0.9rem]">{error}</div>}
        {success && <div className="bg-green-50 text-green-800 p-3 rounded-lg mb-4 text-[0.9rem] border border-green-200">{success}</div>}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-[0.85rem] font-semibold mb-1 text-slate-500">Email</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-[0.85rem] font-semibold mb-1 text-slate-500">Пароль</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          {role === 'volunteer' && (
            <>
              <div>
                <label className="block text-[0.85rem] font-semibold mb-1 text-slate-500">Имя и Фамилия</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[0.85rem] font-semibold mb-1 text-slate-500">Дата рождения (12+)</label>
                  <input type="date" className="input-field" value={birthDate} max={maxDateString} onChange={e => setBirthDate(e.target.value)} required />
                </div>
                <div className="flex-1">
                  <label className="block text-[0.85rem] font-semibold mb-1 text-slate-500">Город</label>
                  <select className="input-field" value={city} onChange={e => setCity(e.target.value)} required>
                    <option value="" disabled>Выберите город</option>
                    <option value="Астана">Астана</option>
                    <option value="Алматы">Алматы</option>
                    <option value="Шымкент">Шымкент</option>
                    <option value="Туркестан">Туркестан</option>
                    <option value="Караганда">Караганда</option>
                    <option value="Актобе">Актобе</option>
                    <option value="Павлодар">Павлодар</option>
                    <option value="Усть-Каменогорск">Усть-Каменогорск</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[0.85rem] font-semibold mb-1 text-slate-500">Ключевые навыки (через запятую)</label>
                <input type="text" className="input-field" placeholder="Например: Фотография, Медицина, Копирайтинг" value={skills} onChange={e => setSkills(e.target.value)} required />
                <div className="text-xs text-slate-400 mt-1">Эти данные будут использованы AI для подбора задач.</div>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary mt-4" disabled={loading}>
            {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-6 text-center text-[0.9rem]">
          Уже есть аккаунт? <Link href="/login" className="text-orange-500 font-semibold">Войти</Link>
        </div>
      </div>
    </div>
  );
}
