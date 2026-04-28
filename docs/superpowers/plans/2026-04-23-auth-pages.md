# Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать страницы авторизации (вход + регистрация) с split-layout, защитой роутов через Next.js middleware и корректным сохранением токенов.

**Architecture:** Страница `/` заменяется на AuthPage с split-layout. Текущий дашборд переезжает на `/dashboard`. Токены сохраняются в localStorage (для api-client) и в cookie (для middleware). Next.js middleware защищает все внутренние роуты.

**Tech Stack:** Next.js App Router, React Hook Form + Zod, shadcn/ui (Input, Button, Label), Tailwind CSS v4, sonner (toasts), `document.cookie` для установки cookie.

---

## File Map

| Действие | Файл | Назначение |
|---|---|---|
| CREATE | `src/shared/lib/auth.ts` | setTokens / clearTokens / getToken — работа с localStorage + cookie |
| CREATE | `src/shared/api/types.ts` (дополнить) | AuthResponseDto |
| CREATE | `src/features/auth/api/use-auth.ts` | хуки useLogin, useRegister, useLogout |
| CREATE | `src/features/auth/left-panel.tsx` | брендинговая левая панель |
| CREATE | `src/features/auth/login-form.tsx` | форма входа |
| CREATE | `src/features/auth/register-form.tsx` | форма регистрации |
| CREATE | `src/features/auth/auth-page.tsx` | split-layout: левая панель + правая форма с табами |
| CREATE | `src/app/dashboard/page.tsx` | дашборд переехал с `/` на `/dashboard` |
| MODIFY | `src/app/page.tsx` | заменить DashboardContent → AuthPage |
| CREATE | `src/middleware.ts` | защита роутов + редирект залогиненных с `/` |
| MODIFY | `src/widgets/layout/sidebar.tsx` | Dashboard href: `/` → `/dashboard` |
| MODIFY | `src/widgets/layout/header.tsx` | подключить useLogout к кнопке «Выйти» |

---

## Task 1: Утилиты работы с токенами

**Files:**
- Create: `frontend/src/shared/lib/auth.ts`

- [ ] **Создать `src/shared/lib/auth.ts`**

```typescript
// frontend/src/shared/lib/auth.ts
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Cookie для Next.js middleware (7 дней)
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
```

- [ ] **Добавить AuthResponseDto в `src/shared/api/types.ts`**

Дописать в конец файла `frontend/src/shared/api/types.ts`:

```typescript
export interface AuthResponseDto {
  access_token: string;
  refresh_token: string;
}
```

- [ ] **Коммит**

```bash
git add frontend/src/shared/lib/auth.ts frontend/src/shared/api/types.ts
git commit -m "feat(auth): add token storage utilities and AuthResponseDto"
```

---

## Task 2: Хуки useLogin, useRegister, useLogout

**Files:**
- Create: `frontend/src/features/auth/api/use-auth.ts`

- [ ] **Создать `src/features/auth/api/use-auth.ts`**

```typescript
// frontend/src/features/auth/api/use-auth.ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/shared/api/api-client';
import { AuthResponseDto } from '@/shared/api/types';
import { setTokens, clearTokens } from '@/shared/lib/auth';

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post<AuthResponseDto>('/auth/login', { email, password }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const msg =
        error?.status === 401
          ? 'Неверный email или пароль'
          : error?.message || 'Не удалось войти';
      toast.error(msg);
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post<AuthResponseDto>('/auth/register', { email, password }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const msg =
        error?.status === 409
          ? 'Пользователь с таким email уже существует'
          : error?.message || 'Не удалось зарегистрироваться';
      toast.error(msg);
    },
  });
}

export function useLogout() {
  const router = useRouter();

  return () => {
    clearTokens();
    router.push('/');
  };
}
```

- [ ] **Коммит**

```bash
git add frontend/src/features/auth/api/use-auth.ts
git commit -m "feat(auth): add useLogin, useRegister, useLogout hooks"
```

---

## Task 3: Левая брендинговая панель

**Files:**
- Create: `frontend/src/features/auth/left-panel.tsx`

- [ ] **Создать `src/features/auth/left-panel.tsx`**

```tsx
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
```

- [ ] **Коммит**

```bash
git add frontend/src/features/auth/left-panel.tsx
git commit -m "feat(auth): add branding left panel component"
```

---

## Task 4: Форма входа

**Files:**
- Create: `frontend/src/features/auth/login-form.tsx`

- [ ] **Создать `src/features/auth/login-form.tsx`**

```tsx
// frontend/src/features/auth/login-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { useLogin } from '@/features/auth/api/use-auth';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => {
    login.mutate({ email: data.email, password: data.password });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">Пароль</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="text-right -mt-2">
        <span className="text-xs text-muted-foreground cursor-default">
          Забыли пароль?
        </span>
      </div>

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? 'Вход...' : 'Войти'}
      </Button>
    </form>
  );
}
```

- [ ] **Коммит**

```bash
git add frontend/src/features/auth/login-form.tsx
git commit -m "feat(auth): add login form with Zod validation"
```

---

## Task 5: Форма регистрации

**Files:**
- Create: `frontend/src/features/auth/register-form.tsx`

- [ ] **Создать `src/features/auth/register-form.tsx`**

```tsx
// frontend/src/features/auth/register-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { useRegister } from '@/features/auth/api/use-auth';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    email: z.string().email('Введите корректный email'),
    password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (data: RegisterForm) => {
    register_.mutate({ email: data.email, password: data.password });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-name">Имя</Label>
        <Input
          id="reg-name"
          type="text"
          placeholder="Алексей Петров"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-password">Пароль</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-confirm">Подтвердите пароль</Label>
        <Input
          id="reg-confirm"
          type="password"
          placeholder="••••••••"
          aria-invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={register_.isPending}>
        {register_.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
      </Button>
    </form>
  );
}
```

- [ ] **Коммит**

```bash
git add frontend/src/features/auth/register-form.tsx
git commit -m "feat(auth): add register form with Zod validation"
```

---

## Task 6: AuthPage — split layout с табами

**Files:**
- Create: `frontend/src/features/auth/auth-page.tsx`

- [ ] **Создать `src/features/auth/auth-page.tsx`**

```tsx
// frontend/src/features/auth/auth-page.tsx
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
```

- [ ] **Коммит**

```bash
git add frontend/src/features/auth/auth-page.tsx
git commit -m "feat(auth): add AuthPage split layout with tab switching"
```

---

## Task 7: Перенос дашборда и подключение AuthPage

**Files:**
- Create: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Создать `src/app/dashboard/page.tsx`**

```tsx
// frontend/src/app/dashboard/page.tsx
import { MainLayout } from "@/widgets/layout/main-layout"
import { DashboardContent } from "@/widgets/dashboard/dashboard-content"

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  )
}
```

- [ ] **Заменить `src/app/page.tsx`**

```tsx
// frontend/src/app/page.tsx
import { AuthPage } from "@/features/auth/auth-page"

export default function RootPage() {
  return <AuthPage />
}
```

- [ ] **Коммит**

```bash
git add frontend/src/app/dashboard/page.tsx frontend/src/app/page.tsx
git commit -m "feat(auth): move dashboard to /dashboard, wire / to AuthPage"
```

---

## Task 8: Next.js Middleware — защита роутов

**Files:**
- Create: `frontend/src/middleware.ts`

- [ ] **Создать `src/middleware.ts`**

```typescript
// frontend/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/dashboard', '/profile', '/resume', '/vacancies', '/analytics', '/settings', '/pricing'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  // Незалогиненный пытается зайти на защищённый роут → на /
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Залогиненный открывает / → на /dashboard
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/profile/:path*', '/resume/:path*', '/vacancies/:path*', '/analytics/:path*', '/settings/:path*', '/pricing/:path*'],
};
```

- [ ] **Коммит**

```bash
git add frontend/src/middleware.ts
git commit -m "feat(auth): add Next.js middleware for route protection"
```

---

## Task 9: Обновить сайдбар и логаут в хедере

**Files:**
- Modify: `frontend/src/widgets/layout/sidebar.tsx`
- Modify: `frontend/src/widgets/layout/header.tsx`

- [ ] **Обновить `src/widgets/layout/sidebar.tsx` — Dashboard href `/` → `/dashboard`**

Найти строку:
```tsx
{ href: "/", label: "Dashboard", icon: LayoutDashboard },
```
Заменить на:
```tsx
{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
```

Также найти в Sidebar Logo ссылку `<Link href="/">` и заменить на `<Link href="/dashboard">`.

- [ ] **Обновить `src/widgets/layout/header.tsx` — подключить logout**

В начало файла добавить импорт:
```tsx
import { useLogout } from '@/features/auth/api/use-auth';
```

Внутри компонента `Header` (в начале функции, до return) добавить:
```tsx
const logout = useLogout();
```

Найти DropdownMenuItem с LogOut:
```tsx
<DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
  <LogOut className="mr-2 h-4 w-4" />
  <span>Выйти</span>
</DropdownMenuItem>
```

Заменить на:
```tsx
<DropdownMenuItem
  className="text-red-600 focus:text-red-600 cursor-pointer"
  onClick={logout}
>
  <LogOut className="mr-2 h-4 w-4" />
  <span>Выйти</span>
</DropdownMenuItem>
```

- [ ] **Коммит**

```bash
git add frontend/src/widgets/layout/sidebar.tsx frontend/src/widgets/layout/header.tsx
git commit -m "feat(auth): wire logout button, update sidebar dashboard link"
```

---

## Task 10: Проверка в браузере

- [ ] Убедиться что бэкенд запущен (`netstat -ano | grep 3001`)
- [ ] Открыть `http://localhost:3000` — должна открыться страница авторизации (split layout)
- [ ] Переключить таб на «Регистрация» — появляются поля Имя + Подтверждение пароля
- [ ] Войти с `test@careermate.ru` / `Test1234!` — редирект на `/dashboard`, дашборд работает
- [ ] Нажать «Выйти» в хедере — редирект на `/`
- [ ] Зайти на `http://localhost:3000/profile` без входа — должен редиректить на `/`
- [ ] Войти и зайти на `http://localhost:3000/` — должен редиректить на `/dashboard`
