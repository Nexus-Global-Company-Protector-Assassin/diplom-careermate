'use client';

import { useState } from 'react';
import { AuthLeftPanel } from './left-panel';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { cn } from '@/shared/lib/utils';

type Tab = 'login' | 'register';

export function AuthPage() {
  const [tab, setTab] = useState<Tab>('login');

  return (
    <div className="flex min-h-screen">
      <AuthLeftPanel />

      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12 lg:flex-none lg:w-[480px]">
        <div className="w-full max-w-sm">
          {/* Заголовок */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {tab === 'login' ? 'С возвращением 👋' : 'Создать аккаунт'}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {tab === 'login'
                ? 'Войдите в аккаунт, чтобы продолжить'
                : 'Зарегистрируйтесь и начните поиск работы'}
            </p>
          </div>

          {/* Таб-бар */}
          <div className="mb-7 flex rounded-xl bg-muted p-1">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                  tab === t
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Форма */}
          {tab === 'login' ? <LoginForm /> : <RegisterForm />}

          {/* Переключалка */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {tab === 'login' ? (
              <>
                Нет аккаунта?{' '}
                <button
                  onClick={() => setTab('register')}
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{' '}
                <button
                  onClick={() => setTab('login')}
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Войти
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
