# CareerMate — MVP Gap Analysis

> Дата: 2026-04-28  
> Ветка: backend  
> Цель: понять, что мешает выкатить MVP реальным пользователям

---

## Общая картина

| Зона | Статус |
|---|---|
| Auth (login/register/JWT) | ✅ Работает |
| Профиль + навыки + предпочтения | ✅ Работает |
| Resume: загрузка, генерация, AI-ревью | ✅ Работает |
| Cover letter (vacancy + standalone) | ✅ Работает |
| Вакансии: поиск, рекомендации, AI-анализ | ✅ Работает |
| Interview prep (STAR+R) | ✅ Работает |
| Career Assessment Quiz | ✅ Работает |
| Resume → Profile auto-fill | ✅ Работает |
| Behavioral signals + VacancyInteraction | ✅ Работает |
| CI/CD (GHCR + Vercel + VPS) | ✅ Работает |
| **Избранные вакансии** | ❌ Stub |
| **Отклики (responses)** | ❌ Stub |
| **Карьерная цель (dashboard)** | ❌ Не сохраняется |
| **Настройки** | ❌ Не сохраняются |
| **Password reset** | ❌ Отсутствует |
| **Email-нотификации** | ❌ Отсутствуют |
| **Подписка / оплата** | ❌ UI только |
| **Landing page** | ❌ Отсутствует |

---

## P0 — Блокеры: без этого MVP нельзя выкатить

### 1. Password reset — пользователи заперты навсегда

**Проблема:** В `auth.controller.ts` только 4 эндпоинта: `login`, `register`, `logout`, `refresh`. Нет `/forgot-password` и `/reset-password`.

**Что нужно:**
- Backend: `POST /auth/forgot-password` — генерация токена + отправка письма
- Backend: `POST /auth/reset-password` — валидация токена + смена пароля
- Frontend: страница `/auth/reset-password` + форма forgot password на `/`
- Нужен email-сервис (см. п. 5)

**Оценка:** ~1 день

---

### 2. Избранные вакансии не сохраняются в БД

**Проблема:** `POST /vacancies/favorites` в `vacancies.controller.ts` возвращает статический `{ success: true }` без единого обращения к Prisma.

```ts
// vacancies.controller.ts — сейчас
toggleFavorite(@Body() body: { vacancyId: string; isFavorite: boolean }) {
    return { success: true, vacancyId: body.vacancyId, isFavorite: body.isFavorite };
}
```

**Что нужно:**
- Модель `FavoriteVacancy` в Prisma (или поле в `VacancyResponse`) + миграция
- Реальный upsert/delete в сервисе
- `GET /vacancies/favorites` для загрузки списка
- Frontend: синхронизировать состояние с сервером (сейчас только локальный `isFavorite`)

**Оценка:** ~0.5 дня

---

### 3. Отклики на вакансии не сохраняются

**Проблема:** `POST /vacancies/responses` возвращает `{ success: true, status: 'Отправлено' }` без записи в БД. `GET /vacancies/responses` возвращает `[]`.

Модель `VacancyResponse` в схеме **есть**, сервис её **не использует**.

**Что нужно:**
- Реализовать `applyToVacancy()` с Prisma create в `VacancyResponse`
- `getResponses()` — реальная выборка из БД с join на `Vacancy`
- Frontend `/analytics` → вкладка откликов должна показывать реальные данные

**Оценка:** ~0.5 дня

---

### 4. Карьерная цель не сохраняется

**Проблема:** `saveGoal()` в `dashboard-content.tsx` вызывает только `setCareerGoal(tempGoal)` и закрывает модал. Данные живут только в React state — при перезагрузке сбрасываются.

```ts
// dashboard-content.tsx — сейчас
const saveGoal = () => {
    setCareerGoal(tempGoal)   // только локальный state
    setGoalModalOpen(false)
}
```

**Что нужно:**
- Поля `desiredPosition`, `targetLocation`, `targetSalary` уже есть в `Profile` (Prisma)
- Добавить `useMutation` → `PATCH /profiles` при сохранении
- `useDashboardSummary` уже читает `careerGoal` из backend — нужно только замкнуть запись

**Оценка:** ~2 часа

---

## P1 — Важно для реальных пользователей

### 5. Email-нотификации отсутствуют

**Проблема:** Директория `backend/src/modules/notifications/email/` существует, но в ней только пустая папка `templates/`. Нет ни сервиса, ни SMTP-интеграции.

**Минимум для MVP:**
- Подключить Nodemailer (или Resend/SendGrid) — ~2 часа
- Письмо при регистрации (welcome) — шаблон готов к написанию
- Письмо для password reset (блокер п. 1)
- Email verification при регистрации (опционально для MVP, но желательно)

**Оценка:** ~1 день (включая шаблоны)

---

### 6. Настройки не сохраняются

**Проблема:** `settings-content.tsx` хранит все переключатели в локальном `useState`. Нет ни одного API-вызова при изменении.

**Что нужно:**
- Добавить поля уведомлений в `User` или `Profile` (Prisma)
- `PATCH /users/settings` или в `PATCH /profiles`
- `useQuery` для загрузки + `useMutation` для сохранения

**Оценка:** ~0.5 дня

---

### 7. Landing page отсутствует

**Проблема:** `app/page.tsx` рендерит `<AuthPage />` — то есть незарегистрированный пользователь сразу видит форму входа. Нет никакого marketing/landing контента.

**Минимум:**
- Простой landing с hero-секцией, ключевыми фичами и CTA "Начать бесплатно"
- Редирект авторизованных пользователей на `/dashboard`
- SEO: `<title>`, `<meta description>`

**Оценка:** ~1 день (если без сложного дизайна)

---

### 8. Онбординг не проверен для новых пользователей

**Проблема:** `onboarding-modal.tsx` существует, но нет уверенности, что он показывается при первой авторизации нового пользователя.

**Что нужно проверить:**
- Есть ли флаг `onboardingCompleted` в `User`/`Profile`
- Показывается ли модал на `/dashboard` при первом входе
- Ведёт ли онбординг к заполнению профиля

---

## P2 — Качество MVP

### 9. Skills Knowledge Graph (Neo4j) — в процессе

Новые файлы в гите (`backend/src/modules/neo4j/`, `ml-service/src/features/graph_features.py`) не закоммичены. Функция не завершена.

**Решение:** Либо завершить и смёржить, либо оставить за feature flag до post-MVP.

---

### 10. ML-ранжирование — нужны данные

`ML_SHADOW_MODE=true` — правильно для MVP. После ~500 взаимодействий запустить:

```bash
python -m src.training.trainer --min-samples 500
```

Ничего делать сейчас не нужно — данные накапливаются сами.

---

### 11. Подписка / оплата

`pricing-content.tsx` — полностью готовый UI без единого API-вызова. Кнопка "Выбрать план" ничего не делает.

**Для MVP:** Можно оставить как есть (freemium без ограничений) или подключить Stripe Checkout за ~2 дня.

**Рекомендация:** Оставить на post-MVP, сначала валидируй retention.

---

### 12. Push-нотификации

Директория `backend/src/modules/notifications/push/` пустая. Не нужно для MVP.

---

## Приоритетный план

```
Неделя 1 — закрыть P0
├── [0.5d] Favorites → реальный DB
├── [0.5d] Responses → реальный DB  
├── [2h]   Career goal → сохранение в Profile
└── [1d]   Password reset + Email-сервис (Nodemailer)

Неделя 2 — P1
├── [0.5d] Settings → persistence
├── [1d]   Landing page (минимальная)
└── [2h]   Онбординг — проверить trigger для новых юзеров

Post-MVP
├── Skills Knowledge Graph
├── Stripe / подписка
└── ML training (ждать 500 interactions)
```

---

## Что уже хорошо и не трогать

- AI-пайплайн (агент + backend chains) — стабильный
- Рекомендательная система с behavioral boost — работает
- Resume → Profile auto-fill — готово
- Career Assessment Quiz — готово
- CI/CD — production-ready
- Stanford CAR в промптах — внедрён

---

*Обновить после закрытия P0-блокеров*
