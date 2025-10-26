# 🔌 CareerMate API Documentation

## Обзор

CareerMate REST API предоставляет доступ ко всем функциям платформы для поиска работы.

**Base URL (Development):** `http://localhost:3001/api/v1`
**Base URL (Production):** `https://api.careermate.com/v1`

**Swagger UI:** `http://localhost:3001/api/docs`

## Аутентификация

Все API запросы требуют аутентификации через JWT токен:

\`\`\`http
Authorization: Bearer <your-jwt-token>
\`\`\`

### Получение токена

\`\`\`http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
\`\`\`

**Ответ:**
\`\`\`json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
\`\`\`

## Основные эндпоинты

### 🔐 Authentication

- `POST /auth/register` - Регистрация нового пользователя
- `POST /auth/login` - Вход в систему
- `POST /auth/logout` - Выход из системы
- `POST /auth/refresh` - Обновление токена
- `POST /auth/forgot-password` - Восстановление пароля
- `POST /auth/reset-password` - Сброс пароля
- `GET /auth/google` - OAuth Google
- `GET /auth/linkedin` - OAuth LinkedIn

### 👤 Users

- `GET /users/me` - Получить текущего пользователя
- `PUT /users/me` - Обновить профиль пользователя
- `DELETE /users/me` - Удалить аккаунт

### 📊 Profiles

- `GET /profiles/:id` - Получить профиль
- `PUT /profiles/:id` - Обновить профиль
- `POST /profiles/analyze` - AI-анализ профиля
- `GET /profiles/:id/career-paths` - Получить карьерные пути

### 📝 Resumes

- `GET /resumes` - Получить все резюме пользователя
- `GET /resumes/:id` - Получить конкретное резюме
- `POST /resumes/generate` - Сгенерировать новое резюме
- `PUT /resumes/:id` - Обновить резюме
- `DELETE /resumes/:id` - Удалить резюме
- `GET /resumes/:id/download` - Скачать PDF

### 💼 Jobs

- `GET /jobs` - Получить список вакансий
- `GET /jobs/:id` - Получить вакансию по ID
- `GET /jobs/recommendations` - Персонализированные рекомендации
- `POST /jobs/search` - Поиск вакансий

### 📤 Applications

- `GET /applications` - Получить все отклики
- `POST /applications` - Создать отклик
- `PUT /applications/:id` - Обновить статус отклика
- `DELETE /applications/:id` - Удалить отклик
- `POST /applications/auto-apply` - Автоматический отклик

### 🎤 Interviews

- `GET /interviews/company/:companyId` - Информация о компании
- `POST /interviews/prepare` - Подготовка к интервью
- `GET /interviews/questions/:jobId` - Типичные вопросы

### 📈 Analytics

- `GET /analytics/weekly-report` - Еженедельный отчет
- `GET /analytics/stats` - Статистика пользователя

## Примеры запросов

### Генерация резюме

\`\`\`bash
curl -X POST http://localhost:3001/api/v1/resumes/generate \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateId": "modern",
    "jobId": "optional-job-id-to-tailor"
  }'
\`\`\`

### Поиск вакансий

\`\`\`bash
curl -X POST http://localhost:3001/api/v1/jobs/search \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Python Developer",
    "location": "Moscow",
    "remote": true,
    "salaryMin": 150000
  }'
\`\`\`

## Rate Limiting

- **Free tier**: 100 requests/minute
- **Premium**: 1000 requests/minute

При превышении лимита вы получите `429 Too Many Requests`.

## Error Handling

Все ошибки возвращаются в формате:

\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
\`\`\`

См. [Error Handling](errors.md) для подробностей.

## Pagination

Списки возвращаются с пагинацией:

\`\`\`
GET /jobs?page=1&limit=20
\`\`\`

**Ответ:**
\`\`\`json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
\`\`\`

## Webhooks

CareerMate может отправлять webhooks при определенных событиях:

- `application.created` - Новый отклик
- `application.status_changed` - Изменение статуса отклика
- `job.matched` - Новая подходящая вакансия
- `resume.generated` - Резюме сгенерировано

## SDK & Libraries

- [JavaScript/TypeScript SDK](https://github.com/careermate/js-sdk)
- [Python SDK](https://github.com/careermate/python-sdk)

## Support

- Email: api-support@careermate.com
- Issues: [GitHub Issues](https://github.com/yourusername/careermate/issues)
