'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Task = {
  id: string;
  title: string;
  description: string;
  location: string;
  skillsRequired: string[];
  date: string;
  status: string;
  completedById?: string;
  completedByName?: string;
  completionPhoto?: string;
  completionText?: string;
  aiScore?: number;
};

export default function CuratorTaskReportPage({ params }: { params: Promise<{ taskId: string }> }) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.taskId;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/tasks/${taskId}`)
      .then(r => r.json())
      .then(data => {
        if (data.task) setTask(data.task);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div className="container mx-auto px-6 py-10">Загрузка...</div>;
  if (!task) return <div className="container mx-auto px-6 py-10">Задача не найдена.</div>;

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-8">
        <Link href="/curator" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 transition-colors">
          &larr; Назад к дашборду
        </Link>
        <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
        <div className="flex gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {task.status === 'completed' ? 'Выполнена' : 'Открыта'}
          </span>
          <span className="px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-600">
            {task.date ? new Date(task.date).toLocaleDateString() : 'Без даты'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Инфо о задаче */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold border-b border-white/40 pb-2">Детали задачи</h2>
          <div>
            <div className="text-sm font-semibold text-slate-500 uppercase mb-1">Описание</div>
            <p className="text-slate-700 m-0">{task.description}</p>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 uppercase mb-1">Ожидаемые навыки</div>
            <div className="flex gap-2 flex-wrap mt-1">
              {task.skillsRequired?.map((skill: string, i: number) => (
                <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-[0.9rem] border border-slate-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 uppercase mb-1">Локация</div>
            <p className="text-slate-700 m-0">{task.location}</p>
          </div>
        </div>

        {/* Финальный отчет */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold border-b border-white/40 pb-2">Отчет о выполнении</h2>
          
          {task.status === 'completed' ? (
            <div className="flex flex-col gap-5">
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                <div className="text-green-800 font-bold flex items-center gap-2 mb-1">
                  <span className="text-xl">🎉</span> ИИ Одобрил выполнение
                </div>
                <div className="text-sm text-green-700">Оценка уверенности ИИ: <b>{task.aiScore}%</b></div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase mb-1">Исполнитель</div>
                <div className="font-medium text-lg">{task.completedByName || 'Единорожок Волонтёр'}</div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase mb-1">Комментарий волонтера</div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 italic">
                  "{task.completionText || 'Без текста'}"
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase mb-2">Фотодоказательство</div>
                {task.completionPhoto ? (
                  <img src={task.completionPhoto} alt="Отчет" className="w-full rounded-xl border border-slate-200 object-cover max-h-[400px]" />
                ) : (
                  <div className="bg-slate-100 p-8 rounded-xl text-center text-slate-400">Фото отсутствует</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center gap-4 text-slate-400 h-full">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div>Волонтеры еще выполняют задачу. Как только кто-то сдаст отчет в указанный день, ИИ проверит его и выложит результат сюда.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
