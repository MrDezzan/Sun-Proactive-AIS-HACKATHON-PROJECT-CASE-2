'use client';

import { useState, useRef, useEffect, use } from 'react';
import { api, getUser } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

type Team = {
  id: string;
  creatorName: string;
  creatorId: string;
  maxMembers: number;
  currentMembers: number;
  members: { id: string; name: string }[]; 
};

type TeamMessage = {
  id: string;
  message: string;
  createdAt: string;
  senderId: string;
  senderName: string;
};

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  canEscalate?: boolean;
};

export default function VolunteerTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.taskId;
  const [task, setTask] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я AI-консультант этой задачи. Спроси меня о деталях, и я отвечу строго по требованиям организатора.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // AI Matching state
  const [aiMatchScore, setAiMatchScore] = useState<number | null>(null);
  const [aiMatchExplanation, setAiMatchExplanation] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // States for report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [verdict, setVerdict] = useState<{ status: string; score: number; comment: string } | null>(null);

  // States for Teams & Chat
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [teamChatInput, setTeamChatInput] = useState('');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [createTeamLimit, setCreateTeamLimit] = useState<number>(2);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [showCuratorAnswerPopup, setShowCuratorAnswerPopup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const teamChatEndRef = useRef<HTMLDivElement>(null);

  const loadConsultantHistory = async () => {
    try {
      const res = await api(`/chat/consultant/${taskId}`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      }
      if (data.hasNewAnswer) {
        setShowCuratorAnswerPopup(true);
      }
    } catch (e) {}
  };

  const loadTeams = async () => {
    try {
      const res = await api(`/tasks/${taskId}/teams`);
      const data = await res.json();
      if (data.teams) setTeams(data.teams);
      if (data.userTeamId !== undefined) setUserTeamId(data.userTeamId);
    } catch(e) {}
  };

  useEffect(() => {
    api(`/tasks/${taskId}`)
      .then(r => r.json())
      .then(data => {
        if(data.task) setTask(data.task);
      });
    loadTeams();
    loadConsultantHistory();
  }, [taskId]);

  const loadChat = async () => {
    if (!userTeamId) return;
    try {
      const res = await api(`/teams/${userTeamId}/chat`);
      const data = await res.json();
      if (data.messages) setTeamMessages(data.messages);
    } catch(e) {}
  };

  useEffect(() => {
    if (userTeamId) {
      loadChat();
      const interval = setInterval(loadChat, 3000);
      return () => clearInterval(interval);
    }
  }, [userTeamId]);

  useEffect(() => {
    teamChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle fake progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && isReportModalOpen && !verdict) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + Math.floor(Math.random() * 15) : prev));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading, isReportModalOpen, verdict]);

  const handleCreateTeam = async () => {
    setIsTeamLoading(true);
    try {
      const res = await api(`/tasks/${taskId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ maxMembers: createTeamLimit })
      });
      if (res.ok) {
        setShowCreateTeamModal(false);
        await loadTeams();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Ошибка создания');
      }
    } catch(e) {}
    setIsTeamLoading(false);
  };

  const handleJoinTeam = async (id: string) => {
    try {
      const res = await api(`/teams/${id}/join`, { method: 'POST' });
      if (res.ok) loadTeams();
      else {
        const d = await res.json();
        alert(d.error || 'Ошибка вступления');
      }
    } catch(e) {}
  };

  const handleLeaveTeam = async () => {
    if (!userTeamId) return;
    if (!confirm('Вы уверены, что хотите выйти из команды?')) return;
    try {
      const res = await api(`/teams/${userTeamId}/leave`, { method: 'POST' });
      if (res.ok) {
        setUserTeamId(null);
        setTeamMessages([]);
        loadTeams();
      } else {
        const d = await res.json();
        alert(d.error || 'Ошибка выхода');
      }
    } catch(e) {}
  };

  const handleKickMember = async (memberId: string) => {
    if (!userTeamId) return;
    if (!confirm('Исключить этого участника из команды?')) return;
    try {
      const res = await api(`/teams/${userTeamId}/members/${memberId}`, { method: 'DELETE' });
      if (res.ok) {
        loadTeams();
      } else {
        const d = await res.json();
        alert(d.error || 'Ошибка исключения');
      }
    } catch(e) {}
  };

  const handleSendTeamMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamChatInput.trim() || !userTeamId) return;
    const msg = teamChatInput;
    setTeamChatInput('');
    try {
      await api(`/teams/${userTeamId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: msg })
      });
      loadChat();
    } catch(e) {}
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const currentMessages = [...messages, userMsg];
      const res = await api('/chat/consultant', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: currentMessages, 
          taskContext: task, 
          taskId: taskId 
        }),
      });

      if (!res.ok) throw new Error('API failed');

      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content, 
        canEscalate: data.canEscalate 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Произошла ошибка при связи с консультантом.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async (question: string, aiContext: string) => {
    if (confirm('Вы хотите отправить этот вопрос куратору напрямую?')) {
      try {
        const res = await api('/tasks/clarify', {
          method: 'POST',
          body: JSON.stringify({ taskId: taskId, question, aiContext })
        });
        if (res.ok) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Принял. Связываюсь с куратором!' }]);
        }
      } catch(e) {}
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      alert('Голосовой ввод не поддерживается вашим браузером.');
      return;
    }

    const Recognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new Recognition();

    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const submitReport = async () => {
    if (!reportFile && !reportText.trim()) return;
    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(reportFile as Blob);
      reader.onload = async () => {
        const base64 = reader.result;
        
        const res = await api('/verify', {
          method: 'POST',
          body: JSON.stringify({
            imageBase64: base64,
            reportText,
            taskContext: task
          })
        });
        
        const data = await res.json();
        setVerdict(data);
        setIsLoading(false);
      };
    } catch (error) {
      alert('Ошибка отправки отчета');
      setIsLoading(false);
    }
  };

  if (!task) return <div className="p-10 text-center font-bold text-slate-500">Загрузка задачи...</div>;

  const currentTeam = teams.find(t => t.id === userTeamId);
  const isCreatorOfTeam = currentTeam?.creatorId === getUser()?.id;

  return (
    <div className="flex flex-wrap gap-8 p-8 max-w-[1400px] mx-auto animate-[fadeIn_0.5s_ease]">
      
      {/* Left Column: Info & Teams */}
      <div className="flex flex-col gap-8 flex-[1_1_350px]">
        
        {/* Task Info Panel */}
        <div className="glass-panel p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-300"></div>
          <div className="text-xs font-bold text-orange-500 tracking-wider uppercase">Волонтёрская задача</div>
          <h1 className="text-3xl font-black m-0 leading-tight">{task.title}</h1>
          <div className="flex flex-col gap-2 text-slate-500 text-sm">
            <div className="flex items-center gap-2">📍 {task.location}</div>
            <div className="flex items-center gap-2">📅 {new Date(task.date).toLocaleDateString()}</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {task.skillsRequired?.map((s: string) => (
              <span key={s} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-4 text-slate-600 leading-relaxed text-[0.95rem]">
            {task.description}
          </div>

          {/* Additional Info / Knowledge Base (New) */}
          {task.additionalInfo && task.additionalInfo.length > 0 && (
            <div className="mt-6 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
               <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                 Дополнительные сведения
               </h4>
               <div className="flex flex-col gap-4">
                  {task.additionalInfo.map((info: any, idx: number) => (
                    <div key={idx} className="bg-white/80 p-4 rounded-xl shadow-sm border border-blue-50">
                       <div className="text-xs font-bold text-slate-400 mb-1">Вопрос:</div>
                       <div className="text-sm text-slate-700 font-medium mb-3">{info.question}</div>
                       <div className="text-xs font-bold text-blue-400 mb-1">Ответ куратора:</div>
                       <div className="text-sm text-slate-600 italic">"{info.answer}"</div>
                    </div>
                  ))}
               </div>
            </div>
          )}
          
          {task.status === 'completed' ? (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-center font-bold">
              🎉 Задача успешно выполнена!
            </div>
          ) : new Date() < new Date(task.date) ? (
            <div className="flex flex-col gap-3 mt-6">
               <button 
                disabled
                className="btn-primary py-4 text-lg opacity-50 cursor-not-allowed grayscale"
              >
                Сдать отчет
              </button>
              <div className="text-xs text-orange-500 font-bold bg-orange-50 p-2 rounded-lg text-center border border-orange-100">
                ⏳ Кнопка станет доступна {new Date(task.date).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="btn-primary mt-6 py-4 text-lg shadow-lg shadow-orange-200"
            >
              Сдать отчет
            </button>
          )}
        </div>

        {/* Teams Panel */}
        <div className="glass-panel p-8 flex flex-col gap-4 min-h-[400px]">
          <h3 className="text-xl font-bold m-0 flex items-center gap-2">
            👥 Команды
          </h3>
          
          {userTeamId ? (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm border border-green-200">Вы в команде</span>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={handleLeaveTeam} className="text-xs text-red-500 hover:underline">Покинуть</button>
                   <span className="text-sm text-slate-500">{currentTeam?.currentMembers}/{currentTeam?.maxMembers} участников</span>
                </div>
              </div>

              {/* Members List (New) */}
              <div className="mb-4 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                <div className="text-[0.7rem] uppercase font-bold text-slate-400 mb-2">Участники:</div>
                <div className="flex flex-wrap gap-2">
                   {currentTeam?.members.map(m => (
                     <div key={m.id} className="bg-white border px-2 py-1 rounded-lg text-xs flex items-center gap-2 shadow-sm">
                        <span>{m.name}</span>
                        {isCreatorOfTeam && m.id !== getUser()?.id && (
                          <button onClick={() => handleKickMember(m.id)} className="text-red-400 hover:text-red-600 font-bold ml-1">×</button>
                        )}
                     </div>
                   ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-white/50 rounded-xl p-4 border border-white/40 flex flex-col gap-3 mb-3 max-h-[250px]">
                {teamMessages.length === 0 && <div className="text-center text-slate-400 text-sm mt-10">Сообщений пока нет. Напишите первым!</div>}
                {teamMessages.map(msg => {
                  const isMine = msg.senderId === getUser()?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="text-[0.7rem] text-slate-500 ml-1 mr-1 mb-0.5">{msg.senderName}</div>
                      <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-[0.95rem] shadow-sm ${
                        isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white border text-slate-800 rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={teamChatEndRef} />
              </div>
              
              <form onSubmit={handleSendTeamMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={teamChatInput} 
                  onChange={e => setTeamChatInput(e.target.value)} 
                  placeholder="Групповой чат..." 
                  className="input-field py-2"
                />
                <button type="submit" className="btn-primary py-2 px-4 shadow-sm" disabled={!teamChatInput.trim()}>
                  ➤
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-sm text-slate-600 mb-2">Объединяйтесь с другими волонтёрами, чтобы выполнить задачу вместе.</div>
              
              {showCreateTeamModal ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <h4 className="font-semibold mb-3">Новая команда</h4>
                   <label className="text-sm mb-1 block">Лимит участников:</label>
                   <input type="number" min="2" max="10" value={createTeamLimit} onChange={e => setCreateTeamLimit(Number(e.target.value))} className="input-field py-2 w-24 mb-3 block" />
                   <div className="flex gap-2">
                     <button onClick={handleCreateTeam} className="btn-primary py-1.5 px-3 text-sm" disabled={isTeamLoading}>Создать</button>
                     <button onClick={() => setShowCreateTeamModal(false)} className="btn-secondary py-1.5 px-3 text-sm" disabled={isTeamLoading}>Отмена</button>
                   </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowCreateTeamModal(true)}
                  className="btn-secondary py-3 text-[0.95rem] font-bold border-dashed"
                >
                  + Создать команду
                </button>
              )}

              <div className="flex flex-col gap-3 mt-2">
                {teams.filter(t => t.id !== userTeamId).map(t => (
                  <div key={t.id} className="bg-slate-50/50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center transition-all hover:bg-slate-50">
                    <div>
                      <div className="text-xs bg-orange-100 text-orange-700 w-fit px-2 py-0.5 rounded font-bold mb-1">Группа {t.id.substring(0,4)}</div>
                      <div className="text-sm font-bold">{t.creatorName}</div>
                      <div className="text-xs text-slate-500">Участников: {t.currentMembers} / {t.maxMembers}</div>
                    </div>
                    {t.currentMembers < t.maxMembers ? (
                      <button 
                        onClick={() => handleJoinTeam(t.id)} 
                        disabled={isTeamLoading}
                        className="btn-primary py-1 px-3 text-xs bg-emerald-500 shadow-none hover:bg-emerald-600"
                      >
                        + Вступить
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded">Мест нет</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RAG Consultant Chat Side */}
      <div className="glass-panel flex-[2_1_400px] h-[600px] flex flex-col">
        <div className="p-4 px-6 border-b border-white/40 bg-white/50 rounded-t-2xl">
          <h3 className="m-0 flex items-center gap-2 font-bold">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            AI-Консультант (Постоянная история)
          </h3>
          <p className="m-0 text-[0.85rem] text-slate-500">Ассистент сохраняет историю и передает ответы куратора.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <div className={`chat-bubble ${msg.role}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.canEscalate && idx === messages.length - 1 && (
                <button 
                  onClick={() => handleEscalate(messages[messages.length - 2]?.content || '', msg.content)}
                  className="self-start ml-4 text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full font-bold border border-orange-200 hover:bg-orange-200 transition-colors shadow-sm animate-bounce"
                >
                  🙋‍♂️ Спросить куратора
                </button>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble assistant opacity-70">•••</div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-white/40">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Например: Нужно брать свои перчатки?..." 
              className="input-field"
              disabled={isLoading}
            />
            <button 
              type="button"
              onClick={handleVoiceInput}
              className={`w-11 h-11 flex items-center justify-center rounded-xl border-none transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              title="Голосовой ввод"
            >
              🎙️
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || !input.trim()}>
              Спросить
            </button>
          </form>
        </div>
      </div>

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[500px] p-8 relative flex flex-col gap-5 animate-[popIn_0.3s_ease]">
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
              onClick={() => !isLoading && setIsReportModalOpen(false)}
              disabled={isLoading}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold m-0">Отчет о выполнении</h2>
            
            {verdict ? (
              <div className="flex flex-col gap-4 text-center">
                <div className="text-6xl my-4">
                  {verdict.status === 'APPROVED' ? '🎉' : '❌'}
                </div>
                <h3 className={`text-xl font-bold ${verdict.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                  {verdict.status === 'APPROVED' ? 'Отчет принят!' : 'Отчет отклонен'}
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[0.95rem] text-left">
                  <ReactMarkdown>{verdict.comment}</ReactMarkdown>
                </div>
                {verdict.score > 0 && (
                  <div className="text-lg font-semibold text-slate-700">
                    Уверенность ИИ: {verdict.score}%
                  </div>
                )}
                <div className="flex justify-center mt-4">
                   <button onClick={() => setIsReportModalOpen(false)} className="btn-primary px-8">Понятно</button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center gap-6 py-10">
                <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                   <div className="text-xl font-bold mb-2">Верифицируем ваш отчет...</div>
                   <div className="text-sm text-slate-500">Vision AI анализирует фото и текст</div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                   <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="text-sm text-slate-500">{progress}%</div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Краткое описание проделанной работы</label>
                  <textarea 
                    className="input-field min-h-[100px] resize-y"
                    placeholder="Я убрал три мешка мусора возле пруда..."
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Фотодоказательство</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="input-field bg-white"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 6 * 1024 * 1024) {
                        alert('Файл слишком большой (> 6МБ)');
                        e.target.value = '';
                        setReportFile(null);
                      } else {
                        setReportFile(file || null);
                      }
                    }}
                  />
                </div>
                <button 
                  onClick={submitReport}
                  className="btn-primary py-4 mt-2"
                  disabled={!reportFile || !reportText.trim()}
                >
                  Отправить ИИ на проверку
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Curator Answer Popup */}
      {showCuratorAnswerPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-8 text-center animate-[popIn_0.4s_ease]">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v5"/><path d="M12 16h.01"/></svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">Ответ от куратора!</h3>
            <p className="text-slate-600 mb-8">Куратор ответил на ваш уточняющий вопрос. Ответ добавлен в чат с ИИ-консультантом.</p>
            <button 
              onClick={() => setShowCuratorAnswerPopup(false)}
              className="btn-primary w-full py-4 text-lg"
            >
              Перейти к ответу
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
