# Auth Pages Design — CareerMate

**Date:** 2026-04-23  
**Status:** Approved

---

## Overview

Создать страницы авторизации для CareerMate: одна страница `/` с переключением между формами входа и регистрации, Next.js middleware для защиты роутов, сохранение токенов и редирект после входа.

---

## Layout

**Split-layout** — две колонки на весь экран:

- **Левая панель (50%)** — брендинговая, фиолетовый градиент (`#0f0c29 → #1e1b4b → #312e81 → #4c1d95`). Содержит:
  - Лого (иконка + «CareerMate»)
  - Hero-заголовок: «Найди работу с помощью AI-помощника»
  - Подзаголовок: «Анализ резюме, подбор вакансий и подготовка к интервью — всё в одном месте»
  - Превью-макет дашборда (карточки со статами + прогресс-бары) в стеклянном контейнере
  - Декоративные blur-пятна в углах

- **Правая панель (480px)** — форма авторизации, фон `#0f1117`. Содержит:
  - Заголовок формы (меняется при переключении таба)
  - Таб-бар «Вход / Регистрация»
  - Поля формы
  - Кнопка submit
  - Footer-ссылка для переключения режима

---

## Routing & Auth Flow

- Страница авторизации живёт на маршруте `/` (корень).
- **Текущий `app/page.tsx` (дашборд) переносится в `app/dashboard/page.tsx`** — новый маршрут `/dashboard`.
- После успешного входа/регистрации: редирект на `/dashboard`.
- **Next.js middleware** (`middleware.ts` в корне `frontend/src/`):
  - Защищённые маршруты: `/dashboard`, `/profile`, `/resume`, `/vacancies`, `/analytics`, `/settings`, `/pricing`
  - Если `access_token` отсутствует в cookies — редирект на `/`
  - Если пользователь уже залогинен и открывает `/` — редирект на `/dashboard`

---

## Token Storage

- `access_token` и `refresh_token` хранятся в **localStorage** (как сейчас в `api-client.ts`).
- Middleware читает токен из **cookie** `access_token` (устанавливается при логине параллельно с localStorage — нужно для SSR middleware).
- При логауте — очистить и localStorage, и cookie.

---

## Form: Вход (Login tab)

Поля:
1. **Email** — `type="email"`, placeholder `you@example.com`
2. **Пароль** — `type="password"`, placeholder `••••••••`

Дополнительно:
- Ссылка «Забыли пароль?» (справа под полем пароля) — пока ведёт в никуда (`href="#"`), UI-заглушка
- Кнопка «Войти»
- Footer: «Нет аккаунта? Зарегистрироваться» (переключает таб)

API: `POST /api/v1/auth/login` → `{ access_token, refresh_token }` → сохранить в localStorage + cookie → редирект на `/dashboard`

## Form: Регистрация (Register tab)

Поля:
1. **Имя** — `type="text"`, placeholder `Алексей Петров`
2. **Email** — `type="email"`, placeholder `you@example.com`
3. **Пароль** — `type="password"`, placeholder `••••••••`
4. **Подтвердите пароль** — `type="password"`, placeholder `••••••••`

Валидация (Zod + React Hook Form):
- Email: валидный формат
- Пароль: минимум 8 символов
- Подтверждение: должно совпадать с паролем
- Имя: минимум 2 символа

Кнопка «Зарегистрироваться»  
Footer: «Уже есть аккаунт? Войти» (переключает таб)

API: `POST /api/v1/auth/register` → `{ access_token, refresh_token }` → сохранить → редирект на `/dashboard`

---

## Error Handling

- Ошибки API (401, 409 и т.д.) → `toast.error(message)` через `sonner`
- 409 Conflict при регистрации → «Пользователь с таким email уже существует»
- 401 при входе → «Неверный email или пароль»
- Сетевая ошибка → «Не удалось подключиться к серверу»
- Поля с ошибками валидации подсвечиваются красной рамкой + текст ошибки под полем

---

## Components & Files

```
frontend/src/
├── app/
│   └── page.tsx                        # Страница авторизации (/)
├── features/
│   └── auth/
│       ├── auth-page.tsx               # Основной компонент (split layout)
│       ├── login-form.tsx              # Форма входа
│       ├── register-form.tsx           # Форма регистрации
│       ├── left-panel.tsx              # Брендинговая панель
│       └── api/
│           └── use-auth.ts             # хуки useLogin, useRegister, useLogout
├── middleware.ts                       # Next.js route protection
└── shared/
    └── lib/
        └── auth.ts                     # setTokens(), clearTokens(), getToken()
```

---

## Styling

- Tailwind CSS v4, shadcn/ui компоненты (`Input`, `Button`, `Label`)
- Цвета соответствуют существующей теме проекта
- Адаптив: на экранах < 768px левая панель скрывается, показывается только форма

---

## Out of Scope

- OAuth / «Войти через Google» — не реализуется
- «Забыли пароль» flow — UI-заглушка без логики
- Email-верификация — не реализуется
- Refresh token rotation — не реализуется
