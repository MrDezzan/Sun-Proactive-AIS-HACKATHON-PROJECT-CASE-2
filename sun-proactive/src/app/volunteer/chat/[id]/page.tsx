'use client';

import { useState, useEffect, useRef, use } from 'react';
import { api, getUser } from '@/lib/api';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
};

type FriendProfile = {
  id: string;
  name: string;
  city: string;
};

export default function PrivateChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const friendId = resolvedParams.id;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadProfile = async () => {
    try {
      const res = await api(`/friends/profile/${friendId}`);
      const data = await res.json();
      if (res.ok) {
        setFriend(data.profile);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await api(`/friends/chat/${friendId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getUser());
    loadProfile();
    loadMessages();
    
    // Polling history every 3s
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const msg = input.trim();
    setInput('');
    setIsSending(true);

    try {
      const res = await api(`/friends/chat/${friendId}`, {
        method: 'POST',
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) {
        await loadMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return <div className="container mx-auto px-6 py-12 text-center text-slate-500">Загрузка чата...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl h-[calc(100vh-120px)] flex flex-col">
      
      {/* Header */}
      <div className="glass-panel p-4 mb-4 flex items-center justify-between border-slate-200">
        <div className="flex items-center gap-3">
          <Link href={`/volunteer/profile/${friendId}`} className="group no-underline">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
              {friend?.name[0] || '?'}
            </div>
          </Link>
          <div>
            <div className="font-bold text-slate-900">{friend?.name || 'Загрузка...'}</div>
            <div className="text-[0.7rem] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              В сети (периодическое обновление)
            </div>
          </div>
        </div>
        <Link href="/volunteer/community" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </Link>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto glass-panel p-6 mb-4 flex flex-col gap-4 border-slate-100 bg-white/40">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center gap-4">
             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl">💬</div>
             <p className="text-sm italic">Ваша история сообщений пуста.<br/>Напишите что-нибудь доброе!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUser?.id;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] ${isMine ? 'self-end' : 'self-start'}`}
              >
                <div 
                  className={`px-4 py-2.5 rounded-2xl shadow-sm text-[0.95rem] ${
                    isMine 
                      ? 'bg-orange-500 text-white rounded-br-none' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <ReactMarkdown>{msg.message}</ReactMarkdown>
                </div>
                <div className="text-[0.65rem] text-slate-400 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-panel p-3 border-slate-200">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Напишите сообщение..." 
            className="input-field py-2.5 bg-white/70"
            disabled={isSending}
          />
          <button 
            type="submit" 
            className="btn-primary py-2.5 px-6 shadow-md border-none cursor-pointer flex items-center justify-center"
            disabled={isSending || !input.trim()}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rotate-45 -translate-y-0.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
