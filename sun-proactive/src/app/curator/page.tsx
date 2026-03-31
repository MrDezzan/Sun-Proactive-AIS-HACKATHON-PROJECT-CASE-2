'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Task = {
  id: string;
  title: string;
  location: string | null;
  date: string | null;
  skillsRequired: string[];
  status: string;
  createdAt: string;
};

type ClarificationRequest = {
  id: string;
  taskId: string;
  question: string;
  aiContext: string;
  status: string;
  createdAt: string;
};

export default function CuratorDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clarifications, setClarifications] = useState<ClarificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const loadData = async () => {
    try {
      const [taskRes, clarRes] = await Promise.all([
        api('/tasks/my'),
        api('/tasks/clarifications')
      ]);
      const [taskData, clarData] = await Promise.all([taskRes.json(), clarRes.json()]);
      setTasks(taskData.tasks || []);
      setClarifications(clarData.clarifications || []);
    } catch(e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAnswer = async (requestId: string) => {
    if (!answerText.trim()) return;
    try {
      const res = await api(`/tasks/clarifications/${requestId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer: answerText })
      });
      if (res.ok) {
        setAnsweringId(null);
        setAnswerText('');
        loadData();
      }
    } catch(e) {
      alert('Ошибка при отправке ответа');
    }
  };

  if (loading) return <div className="container" style={{ padding: '40px' }}>Загрузка...</div>;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Кабинет Куратора</h1>
          <p style={{ color: 'var(--text-muted)' }}>Управление социальными проектами и задачами</p>
        </div>
        <Link href="/curator/create" className="btn-primary" style={{ textDecoration: 'none' }}>
          + Создать задачу через AI
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {tasks.map(task => (
          <div key={task.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex justify-between items-center">
              <span style={{ 
                background: task.status === 'open' ? '#dbeafe' : '#f1f5f9', 
                color: task.status === 'open' ? '#1e40af' : '#475569',
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '0.8rem', 
                fontWeight: 600,
                textTransform: 'uppercase' as const
              }}>
                {task.status === 'open' ? 'Открыта' : task.status}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {task.createdAt ? new Date(task.createdAt).toLocaleDateString('ru-RU') : ''}
              </span>
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{task.title}</h3>
            
            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                📍 {task.location || 'Не указана'}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
              {task.skillsRequired?.map((skill, i) => (
                <span key={i} style={{ fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>
                  {skill}
                </span>
              ))}
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '8px 0' }} />
            
            <Link href={`/curator/task/${task.id}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
              Смотреть отклики &rarr;
            </Link>
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', background: 'white', borderRadius: '16px', color: 'var(--text-muted)' }}>
            У вас пока нет активных задач. Создайте первую задачу (AI-интервьюер поможет).
          </div>
        )}
      </div>

      {/* Clarification Requests Section */}
      <div style={{ marginTop: '64px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Запросы на уточнение от волонтеров</h2>
        {clarifications.filter(c => c.status === 'pending').length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Новых вопросов пока нет.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {clarifications.filter(c => c.status === 'pending').map(req => (
              <div key={req.id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#f97316', fontWeight: 700 }}>
                  ❓ НУЖНО УТОЧНЕНИЕ
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                  {req.question}
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', border: '1px dashed #e2e8f0', marginBottom: '16px' }}>
                  <strong>Инфо от ИИ:</strong> {req.aiContext}
                </div>
                
                {answeringId === req.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <textarea 
                      value={answerText}
                      onChange={e => setAnswerText(e.target.value)}
                      placeholder="Напишите ваш ответ..."
                      className="input-field"
                      style={{ minHeight: '80px' }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => handleAnswer(req.id)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        Отправить ответ
                      </button>
                      <button onClick={() => setAnsweringId(null)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAnsweringId(req.id)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#334155' }}>
                    Ответить волонтеру
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
