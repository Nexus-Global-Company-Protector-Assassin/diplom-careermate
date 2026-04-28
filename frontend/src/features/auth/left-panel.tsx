// frontend/src/features/auth/left-panel.tsx
export function AuthLeftPanel() {
  return (
    <div className="relative hidden lg:flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#4c1d95] px-10 py-12">
      {/* Декоративные blur-пятна */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />

      {/* Лого */}
      <div className="z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl shadow-lg shadow-indigo-500/40">
          🎯
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">CareerMate</span>
      </div>

      {/* Hero текст */}
      <div className="z-10 text-center">
        <h1 className="mb-3 text-3xl font-bold leading-snug text-white">
          Найди работу<br />
          с помощью{' '}
          <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
            AI-помощника
          </span>
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/50">
          Анализ резюме, подбор вакансий и подготовка к интервью — всё в одном месте
        </p>
      </div>

      {/* Превью дашборда */}
      <div className="z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-2 h-2 w-20 rounded bg-white/20" />
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { num: '24', label: 'Вакансии', color: 'bg-indigo-400/50' },
            { num: '8', label: 'Отклики', color: 'bg-green-400/50' },
            { num: '3', label: 'Интервью', color: 'bg-yellow-400/50' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <div className={`mb-1 h-3 w-8 rounded ${stat.color}`} />
              <div className="h-1.5 w-14 rounded bg-white/15" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {[75, 50, 88].map((pct, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1.5 w-12 rounded bg-white/15 shrink-0" />
              <div className="h-2 flex-1 overflow-hidden rounded bg-white/10">
                <div
                  className="h-full rounded bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
