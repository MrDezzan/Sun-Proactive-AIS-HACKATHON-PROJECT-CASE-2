'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Volunteer = {
  id: string;
  name: string;
  city: string;
  skills: string[];
};

type FriendRequest = {
  id: string;
  senderId?: string;
  senderName?: string;
  receiverId?: string;
  receiverName?: string;
  createdAt: string;
  status: string;
};

export default function CommunityPage() {
  const [recommendations, setRecommendations] = useState<Volunteer[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, reqRes, outRes, listRes] = await Promise.all([
        api('/friends/recommendations'),
        api('/friends/requests'),
        api('/friends/requests/outgoing'),
        api('/friends/list')
      ]);

      const [recData, reqData, outData, listData] = await Promise.all([
        recRes.json(),
        reqRes.json(),
        outRes.json(),
        listRes.json()
      ]);

      setRecommendations(recData.recommendations || []);
      setRequests(reqData.requests || []);
      setOutgoingRequests(outData.requests || []);
      setFriends(listData.friends || []);
    } catch (err) {
      console.error('Failed to load community data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sendRequest = async (receiverId: string) => {
    try {
      const res = await api('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId })
      });
      if (res.ok) {
        loadData(); // Refresh
      }
    } catch (err) {
      console.error(err);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const res = await api('/friends/accept', {
        method: 'POST',
        body: JSON.stringify({ requestId })
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="container mx-auto px-6 py-12">Загрузка комьюнити...</div>;

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Комьюнити</h1>
        <p className="text-slate-500">Находите единомышленников в вашем городе и объединяйтесь для добрых дел.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Requests & Friends */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Incoming Requests */}
          {requests.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Заявки в друзья ({requests.length})
              </h2>
              <div className="grid gap-4">
                {requests.map(req => (
                  <div key={req.id} className="glass-panel p-4 flex items-center justify-between border-orange-200 bg-orange-50/30">
                    <div>
                      <div className="font-bold text-slate-900">{req.senderName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Хочет добавить вас в друзья</div>
                    </div>
                    <button 
                      onClick={() => acceptRequest(req.id)}
                      className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors shadow-md"
                    >
                      Принять
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                Исходящие заявки ({outgoingRequests.length})
              </h2>
              <div className="grid gap-3">
                {outgoingRequests.map(req => (
                  <div key={req.id} className="glass-panel p-4 flex items-center justify-between bg-slate-50/50 border-slate-200">
                    <div>
                      <div className="font-bold text-slate-700">{req.receiverName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Ожидает подтверждения</div>
                    </div>
                    <div className="text-[0.7rem] bg-slate-200 px-3 py-1 rounded-full text-slate-600 font-bold uppercase tracking-wider">
                      В ожидании
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Friends List */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-slate-900">Ваши друзья ({friends.length})</h2>
            {friends.length === 0 ? (
              <div className="glass-panel p-8 text-center text-slate-400 italic">
                Список друзей пока пуст. Добавляйте волонтеров из рекомендаций!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map(friend => (
                  <Link href={`/volunteer/profile/${friend.id}`} key={friend.id} className="glass-panel p-5 hover:border-orange-300 transition-all no-underline group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                        {friend.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{friend.name}</div>
                        <div className="text-xs text-slate-500">{friend.city}</div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover:text-orange-400 transition-colors">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Recommendations */}
        <div className="flex flex-col gap-6">
          <section className="sticky top-24">
            <h2 className="text-xl font-bold mb-4 text-slate-900">Рекомендации в вашем городе</h2>
            <div className="bg-white/50 backdrop-blur-sm border border-black/5 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
              {recommendations.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-4">
                  В вашем городе пока нет новых волонтеров
                </div>
              ) : (
                recommendations.map(person => (
                  <div key={person.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                        {person.name[0]}
                      </div>
                      <div>
                        <Link href={`/volunteer/profile/${person.id}`} className="font-bold text-slate-900 text-[0.95rem] hover:text-orange-500 transition-colors no-underline">
                          {person.name}
                        </Link>
                        <div className="text-[0.75rem] text-slate-400">{person.city}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendRequest(person.id)}
                      className="w-8 h-8 rounded-full border border-orange-200 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                      title="Добавить в друзья"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                  </div>
                ))
              )}
              <div className="mt-2 p-3 bg-slate-50 rounded-xl text-[0.75rem] text-slate-500 border border-slate-100">
                ⭐ Мы показываем людей из вашего города, чтобы вам было проще объединяться для решения локальных задач.
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
