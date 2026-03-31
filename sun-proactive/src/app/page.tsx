import Link from 'next/link';

export default function Home() {
  return (
    <div className="pb-20 overflow-x-hidden">
      
      <div className="container mx-auto px-6 relative min-h-[85vh] flex items-center pt-10">
        
        {/* фоновые пятна для макбука */}
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_70%)] blur-[50px] -z-10 animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] right-[25%] w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(56,189,248,0.1)_0%,transparent_70%)] blur-[40px] -z-10 animate-[float_8s_ease-in-out_infinite_reverse]" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full items-center">
          
          <div className="flex flex-col items-start gap-6 animate-[slideIn_0.8s_cubic-bezier(0.16,1,0.3,1)]">
            
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md text-slate-900 px-5 py-2 rounded-xl font-semibold text-sm border border-orange-500/30 animate-[pulseBorder_3s_infinite]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              AI-инфраструктура активна
            </div>
            
            <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[1.1] tracking-tight text-slate-900">
              Превращаем инициативы в <br/>
              <span className="bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 bg-clip-text text-transparent inline-block transform scale-105 origin-left">Реальные Действия</span>
            </h1>
            
            <p className="text-lg text-slate-500 max-w-[500px] leading-relaxed font-normal">
              Автоматическое управление социальными проектами. ИИ сам соберет требования, подберет исполнителей по семантическому профилю и проверит фотоотчет с помощью компьютерного зрения.
            </p>
            
            <div className="flex gap-4 mt-4 flex-wrap">
              <Link href="/register" className="btn-primary px-8 py-4 text-lg rounded-full flex items-center gap-2 animate-[pulseGlow_2s_infinite] no-underline">
                Стать частью платформы
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <Link href="/login" className="btn-secondary px-8 py-4 text-lg rounded-full bg-white/80 backdrop-blur-md no-underline">
                Вход для резидентов
              </Link>
            </div>
          </div>

          {/* стекляшка с фейковыми уведомлениями */}
          <div className="relative h-full min-h-[400px] flex items-center justify-center animate-[popIn_1s_ease_0.2s_backwards]">
            
            <div className="glass-panel hover-lift w-full max-w-[450px] p-8 bg-gradient-to-br from-white/95 to-white/80 border border-white/60 relative z-10 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">AI Matchmaking <span className="text-emerald-500">Live</span></h3>
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
              </div>

              {/* плашка мэтча */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex gap-4 items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-semibold text-lg flex-shrink-0">АС</div>
                <div>
                  <div className="font-semibold text-[0.95rem]">Алексей С. (Волонтёр)</div>
                  <div className="text-[0.85rem] text-emerald-500 flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    98% мэтч по задаче "Постеры"
                  </div>
                </div>
              </div>

              {/* плашка проверки */}
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-4 items-start">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                  <div className="font-semibold text-[0.95rem]">Система AI-Анализа</div>
                  <div className="text-[0.85rem] text-slate-500 mt-1">
                    Фотография проверена: задача выполнена успешно. Статус <span className="text-emerald-600 font-semibold">APPROVED</span>.
                  </div>
                </div>
              </div>
            </div>

            {/* декоративный элемент сзади виджета */}
            <div className="glass-panel absolute top-1/2 right-[-10%] w-[300px] h-[300px] -translate-y-[30%] rotate-15 z-0 opacity-50 border border-orange-500/40 rounded-3xl"></div>
          </div>
          
        </div>
      </div>

      {/* блок со статой */}
      <div className="container mx-auto px-6 my-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-y border-white/40 py-10">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl font-extrabold text-orange-500">4,200+</div>
            <div className="text-[0.95rem] text-slate-500 font-semibold uppercase mt-2">Часов сэкономлено кураторам</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl font-extrabold text-emerald-500">98%</div>
            <div className="text-[0.95rem] text-slate-500 font-semibold uppercase mt-2">Точность AI Матчинга</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl font-extrabold text-sky-400">1.2 сек</div>
            <div className="text-[0.95rem] text-slate-500 font-semibold uppercase mt-2">Анализ отчета нейросетью</div>
          </div>
        </div>
      </div>

      {/* основной функционал - три карточки */}
      <div className="container mx-auto px-6 mb-20">
        <h2 className="text-4xl font-bold text-center mb-16">Мощь нейросетей в реальном деле</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="glass-panel hover-lift p-10 relative overflow-hidden cursor-default group">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(56,189,248,0.1)_0%,transparent_70%)] rounded-full translate-x-[30%] -translate-y-[30%] transition-transform group-hover:scale-150 duration-500" />
            <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 mb-6 relative z-10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 relative z-10">Интервью вместо Форм</h3>
            <p className="text-slate-500 text-[1.05rem] leading-relaxed relative z-10">
              Забудьте о рутино заполняемых полях. Куратор общается с AI-ассистентом в чате: "Нужно убрать берег реки". 
              Нейросеть сама задаст наводящие вопросы и сформирует идеальный структурированный профиль задачи.
            </p>
          </div>

          <div className="glass-panel hover-lift p-10 relative overflow-hidden cursor-default group">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] rounded-full translate-x-[30%] -translate-y-[30%] transition-transform group-hover:scale-150 duration-500" />
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 relative z-10">
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 relative z-10">Семантический Matching</h3>
            <p className="text-slate-500 text-[1.05rem] leading-relaxed relative z-10">
              Платформа превращает задачу и профили волонтёров в математические векторы. 
              Мгновенно находя подходящих кандидатов, платформа показывает им "Explainable AI" причину (почему именно они лучше всего подходят).
            </p>
          </div>

          <div className="glass-panel hover-lift p-10 relative overflow-hidden cursor-default group">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(249,115,22,0.1)_0%,transparent_70%)] rounded-full translate-x-[30%] -translate-y-[30%] transition-transform group-hover:scale-150 duration-500" />
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6 relative z-10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 relative z-10">Зрение: Авто-Верификация</h3>
            <p className="text-slate-500 text-[1.05rem] leading-relaxed relative z-10">
              Волонтёр отправляет фотоотчет, а мультимодальная нейросеть выступает в роли независимого жюри, мгновенно принимая или отклоняя работу. Никакого ручного труда модераторов.
            </p>
          </div>
          
        </div>
      </div>

    </div>
  );
}
