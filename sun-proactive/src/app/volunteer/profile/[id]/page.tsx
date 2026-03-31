'use client';

import { useState, useEffect, use } from 'react';
import { api, getUser } from '@/lib/api';
import Link from 'next/link';

type Profile = {
  id: string;
  name: string;
  city: string;
  skills: string[];
  interests: string[];
  goals: string;
  createdAt: string;
};

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const profileId = resolvedParams.id;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [isRequester, setIsRequester] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadProfile = async () => {
    try {
      const res = await api(`/friends/profile/${profileId}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setFriendshipStatus(data.friendshipStatus);
        setIsRequester(data.isRequester);
        setRequestId(data.requestId);
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
  }, [profileId]);

  const addFriend = async () => {
    try {
      const res = await api('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId: profileId })
      });
      if (res.ok) loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const acceptFriend = async () => {
    if (!requestId) return;
    try {
      const res = await api('/friends/accept', {
        method: 'POST',
        body: JSON.stringify({ requestId })
      });
      if (res.ok) loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="container mx-auto px-6 py-12 text-center text-slate-500">Загрузка профиля...</div>;
  if (!profile) return <div className="container mx-auto px-6 py-12 text-center text-red-500 font-bold">Пользователь не найден</div>;

  const isMe = currentUser?.id === profileId;

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <Link href="/volunteer/community" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-500 mb-8 no-underline transition-colors group">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Назад к комьюнити</span>
      </Link>

      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Left Aspect: Profile Card */}
        <div className="w-full md:w-1/3">
          <div className="glass-panel p-8 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-xl flex items-center justify-center text-white text-4xl font-bold mb-6">
              {profile.name[0]}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{profile.name}</h1>
            <div className="text-slate-500 mb-6 flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {profile.city}
            </div>

            {!isMe && (
              <div className="w-full">
                {friendshipStatus === 'accepted' ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-green-50 text-green-700 font-semibold py-2.5 rounded-xl border border-green-200 flex items-center justify-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Вы друзья
                    </div>
                    <Link 
                      href={`/volunteer/chat/${profileId}`}
                      className="btn-primary w-full py-2.5 rounded-xl shadow-lg border-none cursor-pointer no-underline flex items-center justify-center gap-2"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.3 8.32 8.32 0 0 1 3.9 1M16 3l1.4 1.4L13 8.8"/></svg>
                      Написать сообщение
                    </Link>
                  </div>
                ) : friendshipStatus === 'pending' ? (
                  isRequester ? (
                    <div className="bg-slate-100 text-slate-600 font-semibold py-2.5 rounded-xl border border-slate-200">
                      Запрос отправлен
                    </div>
                  ) : (
                    <button onClick={acceptFriend} className="btn-primary w-full py-2.5 rounded-xl shadow-lg border-none cursor-pointer">
                      Принять заявку
                    </button>
                  )
                ) : (
                  <button onClick={addFriend} className="btn-primary w-full py-2.5 rounded-xl shadow-lg border-none cursor-pointer text-base">
                    Добавить в друзья
                  </button>
                )}
              </div>
            )}
            {isMe && (
              <div className="bg-orange-50 text-orange-600 font-bold py-2.5 rounded-xl border border-orange-100 w-full">
                Это ваш профиль
              </div>
            )}
          </div>
        </div>

        {/* Right Aspect: Details */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="glass-panel p-8">
            <h3 className="text-lg font-bold mb-6 border-b border-slate-100 pb-2">Информация волонтера</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Навыки</label>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => (
                    <span key={i} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Интересы</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((s, i) => (
                      <span key={i} className="bg-orange-50 border border-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.goals && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Цели волонтерства</label>
                  <p className="text-slate-700 italic border-l-4 border-orange-200 pl-4 py-1 leading-relaxed">
                    «{profile.goals}»
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 text-center">
              <div className="text-3xl font-bold text-orange-500 mb-1">0</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Задач выполнено</div>
            </div>
            <div className="glass-panel p-6 text-center">
              <div className="text-3xl font-bold text-orange-500 mb-1">{new Date(profile.createdAt).getFullYear()}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Волонтер с...</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
