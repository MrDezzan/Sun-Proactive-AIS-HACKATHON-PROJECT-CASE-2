'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '@/lib/api';

type User = {
  id: string;
  email: string;
  role: string;
  isApproved: boolean;
};

type Task = {
  id: string;
  title: string;
  status: string;
  location: string;
  date: string;
  completedByName: string | null;
  aiScore: number | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [unapprovedUsers, setUnapprovedUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ email: '', role: '' });

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    // Получение пользователей с бэкенда
    Promise.all([
      api('/admin/users').then(r => r.json()),
      api('/admin/tasks').then(r => r.json())
    ])
      .then(([usersData, tasksData]) => {
        setUnapprovedUsers(usersData.unapproved || []);
        setApprovedUsers(usersData.approved || []);
        if (tasksData.tasks) setTasks(tasksData.tasks);
      })
      .catch((e) => {
        console.error(e);
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleAction = async (userId: string, action: string) => {
    await api('/admin/approve', {
      method: 'POST',
      body: JSON.stringify({ userId, action })
    });
    // Обновление спискаа
    const res = await api('/admin/users');
    const data = await res.json();
    setUnapprovedUsers(data.unapproved || []);
    setApprovedUsers(data.approved || []);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    await api(`/admin/users/${userId}`, { method: 'DELETE' });
    const res = await api('/admin/users');
    const data = await res.json();
    setUnapprovedUsers(data.unapproved || []);
    setApprovedUsers(data.approved || []);
  };

  const handleEditSave = async (userId: string) => {
    await api(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(editForm)
    });
    setEditingUser(null);
    const res = await api('/admin/users');
    const data = await res.json();
    setUnapprovedUsers(data.unapproved || []);
    setApprovedUsers(data.approved || []);
  };

  if (loading) return <div className="container" style={{ padding: '40px' }}>Загрузка...</div>;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Панель Администратора</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Управление пользователями и проверка заявок на платформе.</p>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Ожидают проверки ({unapprovedUsers.length})</h2>
        {unapprovedUsers.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>Нет новых заявок.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {unapprovedUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.email}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Роль: {u.role === 'curator' ? 'Куратор' : 'Волонтёр'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleAction(u.id, 'approve')} className="btn-primary" style={{ background: '#10b981', padding: '6px 16px' }}>Одобрить</button>
                  <button onClick={() => handleAction(u.id, 'reject')} className="btn-secondary" style={{ padding: '6px 16px' }}>Отклонить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Активные пользователи ({approvedUsers.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {approvedUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              {editingUser?.id === u.id ? (
                <div style={{ display: 'flex', gap: '12px', flex: 1, alignItems: 'center' }}>
                  <input type="text" className="input-field" style={{ padding: '8px', width: '250px' }} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                  <select className="input-field" style={{ padding: '8px', width: '150px' }} value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                    <option value="volunteer">Волонтёр</option>
                    <option value="curator">Куратор</option>
                    <option value="admin">Админ</option>
                  </select>
                  <button onClick={() => handleEditSave(u.id)} className="btn-primary" style={{ padding: '8px 16px', background: '#10b981' }}>Сохранить</button>
                  <button onClick={() => setEditingUser(null)} className="btn-secondary" style={{ padding: '8px 16px' }}>Отмена</button>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.email}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Роль: {u.role === 'admin' ? 'Админ' : u.role === 'curator' ? 'Куратор' : 'Волонтёр'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditingUser(u); setEditForm({ email: u.email, role: u.role }); }} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Изменить</button>
                    {u.email !== 'admin' && (
                      <button onClick={() => handleDelete(u.id)} className="btn-secondary" style={{ padding: '6px 12px', color: '#ef4444', borderColor: '#fca5a5', fontSize: '0.85rem' }}>Удалить</button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginTop: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Все задачи платформы ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>Задач пока нет.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{t.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.location} • {t.date ? new Date(t.date).toLocaleDateString() : 'Без даты'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                    background: t.status === 'completed' ? '#dcfce7' : '#fef9c3',
                    color: t.status === 'completed' ? '#166534' : '#854d0e'
                  }}>
                    {t.status === 'completed' ? 'Выполнена' : 'Открыта'}
                  </span>
                  {t.status === 'completed' && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Выполнил: <b>{t.completedByName || 'Неизвестно'}</b>
                      {t.aiScore ? <span> (Уверенность ИИ: {t.aiScore}%)</span> : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
