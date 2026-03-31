'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, getUser } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Task = {
  id: string;
  title: string;
  location: string | null;
  date: string | null;
  skillsRequired: string[];
  status: string;
};

export default function VolunteerDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загрузка задач с бэкенда
    api('/tasks/open')
      .then(r => r.json())
      .then(data => {
        setTasks(data.tasks || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container" style={{ padding: '40px' }}>Загрузка...</div>;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Доступные задачи</h1>
        <p style={{ color: 'var(--text-muted)' }}>Подберите идеальную задачу по вашим навыкам (работает алгоритм семантического сопоставления)</p>
      </div>

      <div className="trust-badge" style={{ marginBottom: '32px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
        <div>
          <strong>Как работает подбор?</strong>
          <p style={{ margin: 0, marginTop: '4px' }}>Система (AI Embeddings) сравнивает ваши навыки с описаниями задач для поиска наилучшего совпадения.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {tasks.map(task => (
          <div key={task.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{task.title}</h3>
            
            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                📍 {task.location || 'Не указана'}
              </div>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                🗓 {task.date ? new Date(task.date).toLocaleDateString('ru-RU') : 'Любая дата'}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {task.skillsRequired?.map((skill, i) => (
                <span key={i} style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                  {skill}
                </span>
              ))}
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <Link href={`/volunteer/${task.id}`} className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Подробнее &rarr;
              </Link>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', background: 'white', borderRadius: '16px', color: 'var(--text-muted)' }}>
            Пока нет активных задач.
          </div>
        )}
      </div>
    </div>
  );
}
