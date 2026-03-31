'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function CuratorCreatePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Здравствуйте! Я AI-ассистент куратора Sun Proactive. Расскажите, какой волонтёрский проект вы планируете запустить? (Например: нужен субботник в парке в эти выходные)' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [taskData, setTaskData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isFinalized]);

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Ваш браузер не поддерживает распознавание речи.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    
    recognition.start();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Создаём новый массив сообщений для отправки в API
      const conversation = [...messages, userMsg].filter(m => m.role !== 'system');
      
      const res = await api('/chat/interviewer', {
        method: 'POST',
        body: JSON.stringify({ messages: conversation }),
      });

      const data = await res.json();
      
      if (data.isFinal) {
        setTaskData(data.parsedData);
        setIsFinalized(true);
        // Не добавляем JSON в визуальный чат
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Произошла ошибка сети. Попробуйте еще раз.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const publishTask = async () => {
    // Отправка данных задачи (taskData) в БД
    setIsLoading(true);
    try {
      const res = await api('/tasks/create', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      if(res.ok) {
        router.push('/curator');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex flex-col items-center gap-6 w-full">
        <h1 className="text-3xl font-bold text-center">Создание задачи (AI-Интервьюер)</h1>
        
        {!isFinalized ? (
          <div className="glass-panel w-full max-w-[700px] h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto w-full p-6 flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ))}
              {isLoading && (
                <div className="chat-bubble assistant opacity-70">
                  <div className="flex gap-1 items-center h-6">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-[popIn_0.8s_infinite_alternate]" />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-[popIn_0.8s_infinite_alternate_0.2s]" />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-[popIn_0.8s_infinite_alternate_0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-white/40">
              <form onSubmit={sendMessage} className="flex gap-3">
                <button 
                  type="button" 
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  title="Голосовой ввод"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder={isRecording ? "Слушаю..." : "Ответить ассистенту..."} 
                  className="input-field"
                  disabled={isLoading}
                />
                <button type="submit" className="btn-primary" disabled={isLoading || !input.trim()}>
                  Отправить
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="glass-panel w-full max-w-[700px] p-8 animate-[popIn_0.4s_ease]">
            <div className="trust-badge mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <div>
                <strong className="block text-[0.95rem]">ИИ успешно сформировал карточку задачи.</strong>
                <p className="m-0 mt-1 text-[0.85rem]">Все обязательные параметры были извлечены из диалога. Пожалуйста, проверьте и опубликуйте.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-8">
              <div>
                <label className="text-[0.85rem] text-slate-500 font-semibold uppercase">Название проекта</label>
                <div className="text-xl font-bold">{taskData?.title}</div>
              </div>
              <div className="flex gap-8">
                <div>
                  <label className="text-[0.85rem] text-slate-500 font-semibold uppercase">Дата проведения</label>
                  <div className="font-medium">{taskData?.date}</div>
                </div>
                <div>
                  <label className="text-[0.85rem] text-slate-500 font-semibold uppercase">Город</label>
                  <div className="font-medium">{taskData?.city}</div>
                </div>
                <div>
                  <label className="text-[0.85rem] text-slate-500 font-semibold uppercase">Локация</label>
                  <div className="font-medium">{taskData?.location}</div>
                </div>
              </div>
              <div>
                <label className="text-[0.85rem] text-slate-500 font-semibold uppercase">Требуемые навыки (Hard/Soft skills)</label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {taskData?.skills_required?.map((skill: string, i: number) => (
                    <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-[0.9rem] border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => { setIsFinalized(false); setTaskData(null); }} disabled={isLoading}>
                Вернуться к диалогу
              </button>
              <button className="btn-primary" onClick={publishTask} disabled={isLoading}>
                {isLoading ? 'Публикация...' : 'Сохранить и опубликовать'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
