# CareerMate: Оценка Серверных Мощностей И Бюджета Для Стартапа

Дата подготовки: 20 апреля 2026  
Основа оценки: текущее состояние кодовой базы и актуальные цены из официальных источников, проверенные 20 апреля 2026 года.

## Короткий вывод

Для текущей версии проекта вам не нужна сложная инфраструктура. На старте достаточно:

- `1 application server` для `backend + agent + redis`
- `1 managed PostgreSQL`
- `frontend` либо на том же сервере, либо на `Vercel`
- `Cloudflare R2` только для бэкапов и, при необходимости, хранения файлов

Оптимальный стартовый вариант для стартапа:

- `frontend`: `Vercel Hobby`
- `app server`: `2 vCPU / 4 GB RAM / 50-80 GB SSD` как минимальный бюджетный старт
- `PostgreSQL`: `Neon`
- `Redis`: локально на app server
- `R2`: только для резервных копий

Если нужен запас по CPU/RAM с первого дня, лучше брать:

- `app server`: `4 vCPU / 8 GB RAM / 80+ GB SSD`

## Что реально есть в проекте сейчас

По коду в продакшене нужно учитывать следующие рантаймы и сервисы:

- `frontend` на `Next.js`
- `backend` на `NestJS`
- отдельный `agent` на `NestJS`
- `PostgreSQL`
- `Redis`

Подтверждения в коде:

- backend подключает `Redis`, `Profiles`, `Vacancies`, `Resumes`, `AI` модули: [backend/src/app.module.ts](../../backend/src/app.module.ts)
- основная бизнес-данная модель уже хранится в PostgreSQL: [backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)
- фронтенд для загрузки резюме ходит напрямую в `agent`: [frontend/src/features/profile/api/use-upload-resume.ts](../../frontend/src/features/profile/api/use-upload-resume.ts)
- `agent` живет как отдельный HTTP-сервис: [agent/src/main.ts](../../agent/src/main.ts)
- в dev-compose `agent` есть: [docker-compose.yml](../../docker-compose.yml)
- в production compose сейчас есть `frontend`, `backend`, `postgres`, `redis`, `nginx`, но нет `agent`: [devops/docker/docker-compose.prod.yml](../../devops/docker/docker-compose.prod.yml)

Из этого следует важный практический вывод:

> В production вам нужен отдельный рантайм для `agent`, даже если он пока не добавлен в текущий `docker-compose.prod.yml`.

## Что пока не обязательно покупать

### Pinecone

`Pinecone` в проекте уже предусмотрен, но пока не обязателен:

- в агенте есть `PineconeService`: [agent/src/agent/pinecone/pinecone.service.ts](../../agent/src/agent/pinecone/pinecone.service.ts)
- матчинг вакансий умеет падать обратно на локальную базу вакансий, если Pinecone не настроен: [agent/src/agent/tools/match-vacancies.tool.ts](../../agent/src/agent/tools/match-vacancies.tool.ts)

Для MVP это значит:

- можно не платить за `Pinecone` в первый месяц
- можно включить его позже, когда понадобится полноценный production semantic search

### Object Storage

Объектное хранилище тоже пока не критично:

- PDF сейчас генерируется на клиенте: [frontend/src/features/resume/resume-content.tsx](../../frontend/src/features/resume/resume-content.tsx)
- активного server-side потока записи файлов в `S3/R2/MinIO` в runtime-коде сейчас нет

Для старта достаточно использовать объектное хранилище только под:

- бэкапы базы
- будущие оригиналы загруженных файлов, если вы решите их сохранять

### Отдельные worker-серверы

В зависимостях есть Bull/Schedule, но по текущему runtime-коду нет признаков того, что вам уже сейчас нужен отдельный production worker fleet. Для первой версии проекта отдельный worker-сервер не нужен.

## Предполагаемая стартовая нагрузка

Для оценки я беру реалистичный стартап-сценарий:

- `100-1000` зарегистрированных пользователей в первые месяцы
- `50-150` DAU
- `5-20` одновременно активных пользователей
- `1-10` загрузок резюме в час
- `100-500` поисков вакансий в день
- `50-300` AI-запросов в день на анализ, подбор или генерацию

При такой нагрузке узкие места будут такими:

- `agent` по CPU и RAM
- `PostgreSQL` по росту вакансий и пользовательских данных
- AI API по переменным затратам

## Сколько серверов нужно

### Вариант A: Самый дешевый MVP

Схема:

- `frontend`: `Vercel Hobby`
- `1 app server`: `backend + agent + redis`
- `1 managed PostgreSQL`: `Neon`

Итого:

- `1 собственный сервер`
- `1 managed DB`

Это лучший стартовый вариант по цене/риску.

### Вариант B: Все на одном сервере

Схема:

- `1 server`: `frontend + backend + agent + redis + postgres + nginx`

Итого:

- `1 сервер`

Это самый дешевый вариант по количеству сущностей, но самый рискованный:

- single point of failure
- база и приложение делят один диск
- любые пики по `agent` бьют по API и БД

### Вариант C: Нормальный рост после первых пользователей

Схема:

- `frontend`: `Vercel` или отдельный runtime
- `server 1`: `backend + nginx`
- `server 2`: `agent`
- `managed PostgreSQL`
- `Redis` локально или managed

Итого:

- `2 сервера`
- `1 managed DB`

Это имеет смысл, когда:

- растет количество AI-запросов
- растут загрузки резюме
- agent начинает мешать основному API

## Рекомендуемые ресурсы

### Минимальный бюджетный старт

Если `frontend` вынесен на `Vercel`, а `Postgres` живет отдельно:

- `app server`: `2 vCPU / 4 GB RAM / 50-80 GB SSD`

На нем можно держать:

- `backend`
- `agent`
- `redis`
- `nginx`

Это подойдет для very early stage, если:

- трафик низкий
- AI-запросов немного
- нет тяжелой фоновой обработки

### Рекомендуемый MVP

- `app server`: `4 vCPU / 8 GB RAM / 80+ GB SSD`

Причина:

- `backend`: примерно `0.5-1 GB RAM`
- `agent`: примерно `1-2 GB RAM`, плюс пики CPU
- `redis`: `256-512 MB`
- `nginx + system + запас`: еще `1-2 GB`

`8 GB RAM` дает адекватный операционный запас. Это основной рекомендуемый вариант.

### Рост до первых тысяч пользователей

- `server 1`: `2-4 vCPU / 4-8 GB RAM`
- `server 2`: `4 vCPU / 8 GB RAM`
- `managed PostgreSQL`

`agent` лучше вынести отдельно раньше, чем `backend`.

## Какие данные и сколько места нужно

### PostgreSQL

На старте разумно закладывать:

- `5-10 GB` под рабочую базу

Почему:

- пользователи и профили занимают немного
- резюме и анализы пока в основном текст/JSON
- основная прибавка по объему будет идти от `vacancies`

Практический ориентир:

- `100k` вакансий с индексами и связями дадут примерно `1-2 GB`
- пользовательские данные на ранней стадии останутся значительно меньше

### Redis

На старте достаточно:

- `256 MB - 1 GB`

Если Redis используется как cache/session/job helper, больше сначала не нужно.

### Файлы и хранилище

Если позже начнете хранить оригиналы PDF/DOCX:

- ориентир: `1-2 GB` на каждую `1000` загруженных файлов

### Бэкапы

На старте:

- ежедневные бэкапы БД
- `7-14` дней retention
- `10-30 GB` в объектном хранилище обычно достаточно

## Бюджет по вариантам

Все цифры ниже без учета НДС и без AI API-трафика, который считаем отдельно.

### Вариант A: Рекомендуемый старт для стартапа

Состав:

- `Vercel Hobby` для фронтенда
- `1 app server 2 vCPU / 4 GB`
- `Neon` для PostgreSQL
- локальный `Redis`
- `Cloudflare R2` для бэкапов

Оценка:

- `frontend hosting`: `$0`
- `app server`: `~$24/мес` на провайдере класса DigitalOcean
- `PostgreSQL`: `~$0-15/мес` на Neon при низкой нагрузке
- `R2`: `~$0-5/мес`

Итого:

- `~$25-45/мес`

Это самый рациональный ранний вариант.

### Вариант B: Рекомендуемый MVP с запасом

Состав:

- `Vercel Hobby` или свой фронтенд-рантайм
- `1 app server 4 vCPU / 8 GB`
- `Neon`
- локальный `Redis`
- `R2`

Оценка:

- `frontend hosting`: `$0-20/мес`
- `app server`: `~$48/мес` на провайдере класса DigitalOcean
- `PostgreSQL`: `~$10-20/мес`
- `R2`: `~$0-5/мес`

Итого:

- `~$60-90/мес`

Это уже комфортный MVP без лишней архитектурной роскоши.

### Вариант C: Рост

Состав:

- `frontend`: `Vercel Pro`
- `server 1`: `backend`
- `server 2`: `agent`
- `managed PostgreSQL`
- `Redis` локально или managed
- `R2`

Оценка:

- `frontend`: `~$20/мес`
- `backend server`: `~$24-48/мес`
- `agent server`: `~$48/мес`
- `PostgreSQL`: `~$15-40/мес`
- `Redis`: `~$0-10/мес`
- `R2`: `~$1-10/мес`

Итого:

- `~$110-180/мес`

## Что покупать прямо сейчас

Если цель: запустить стартап без лишних расходов, я бы покупал только это:

1. `Vercel Hobby` для фронтенда
2. `1 app server 2 vCPU / 4 GB RAM / 50-80 GB SSD`
3. `Neon` для Postgres
4. `Cloudflare R2` для бэкапов
5. `Cloudflare` как DNS/CDN/WAF на бесплатном тарифе

Что не покупать сразу:

- `Pinecone`
- отдельный `Redis Cloud`
- отдельный worker-сервер
- `Kubernetes`
- дорогой managed container hosting вроде Railway при постоянной нагрузке на RAM/CPU

## AI-расходы нужно считать отдельно

Для этого проекта инфраструктура, скорее всего, будет дешевле, чем AI API при росте использования.

Важно:

- backend ходит в `chat/completions`: [backend/src/modules/ai/ai.service.ts](../../backend/src/modules/ai/ai.service.ts)
- agent тоже использует `chat/completions` и `embeddings`: [agent/src/agent/llm/llm-gateway.service.ts](../../agent/src/agent/llm/llm-gateway.service.ts)

Это значит:

- фиксированные инфраструктурные расходы у вас понятны заранее
- AI bill будет переменным и может расти быстрее серверного

Практически это означает:

- серверы можно держать дешевыми
- за токенами и prompt-size надо следить с первого дня

## Критические замечания по продакшену

### 1. Agent надо добавить в production deployment

Сейчас production compose не отражает реальный runtime проекта: фронтенд использует agent, но в prod-конфиге его нет. Перед деплоем это надо исправить.

### 2. Не держать Postgres на том же диске, если можно избежать

Для самого дешевого запуска допустимо. Для нормального MVP лучше вынести БД в managed Postgres.

### 3. Redis пока можно держать локально

Пока нет активного отдельного worker-кластера и high-load очередей, локальный Redis на app server — нормальный компромисс.

## Итоговая рекомендация

### Если нужен самый разумный старт

- `frontend`: `Vercel Hobby`
- `1 сервер 2 vCPU / 4 GB`
- `Neon`
- `Redis` локально
- `R2` для бэкапов

Ожидаемый бюджет:

- `~$25-45/мес` без AI

### Если нужен безопасный MVP с запасом

- `frontend`: `Vercel Hobby/Pro`
- `1 сервер 4 vCPU / 8 GB`
- `Neon`
- `Redis` локально
- `R2`

Ожидаемый бюджет:

- `~$60-90/мес` без AI

### Когда масштабироваться дальше

Первое, что стоит выносить на отдельный сервер:

- `agent`

Не `frontend`, не `redis`, не `nginx`, а именно `agent`.

## Источники

Официальные источники, проверенные 20 апреля 2026:

- Vercel Pricing: https://vercel.com/pricing/
- Railway Pricing: https://docs.railway.com/pricing
- Neon Pricing: https://neon.com/pricing
- Upstash Redis Pricing: https://upstash.com/docs/redis/overall/pricing
- Cloudflare R2 Pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare Workers Pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Pinecone Pricing: https://www.pinecone.io/pricing/
- DigitalOcean Droplet Pricing: https://www.digitalocean.com/pricing/droplets
- Hetzner Cloud Overview: https://docs.hetzner.com/cloud/servers/overview
- Hetzner CX Pricing Reference: https://www.hetzner.com/pressroom/new-cx-plans/
- OpenAI API Pricing: https://openai.com/api/pricing/

## Статус документа

Этот документ описывает текущее состояние проекта и экономически разумный стартовый продакшен для стартапа. Если появятся:

- отдельные фоновые worker-процессы
- сохранение оригиналов файлов в object storage
- production semantic search через Pinecone
- рост до `1000+` активных пользователей

документ нужно обновить.
