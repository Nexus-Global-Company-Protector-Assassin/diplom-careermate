# Contributing to CareerMate

Спасибо за интерес к проекту CareerMate! Мы приветствуем вклад от сообщества.

## Содержание

- [Код поведения](#код-поведения)
- [Как начать](#как-начать)
- [Процесс разработки](#процесс-разработки)
- [Стиль кода](#стиль-кода)
- [Коммиты](#коммиты)
- [Pull Requests](#pull-requests)
- [Отчеты об ошибках](#отчеты-об-ошибках)
- [Запросы на новые функции](#запросы-на-новые-функции)

## Код поведения

Участвуя в проекте, вы соглашаетесь соблюдать уважительное отношение к другим участникам. Мы не терпим:
- Оскорбительные комментарии
- Личные нападки
- Троллинг и провокации
- Публикацию личной информации других людей

## Как начать

### 1. Fork репозитория

```bash
# Форкните репозиторий через GitHub UI, затем:
git clone https://github.com/YOUR_USERNAME/careermate.git
cd careermate
git remote add upstream https://github.com/ORIGINAL_OWNER/careermate.git
```

### 2. Настройка окружения

```bash
# Windows
.\scripts\setup.ps1

# macOS/Linux
./scripts/setup.sh

# Или кроссплатформенно
node scripts/setup.js
```

### 3. Создайте feature branch

```bash
git checkout -b feature/your-feature-name
# или
git checkout -b fix/your-bug-fix
```

## Процесс разработки

### Структура веток

- `main` — production-ready код
- `develop` — ветка для разработки (если используется)
- `feature/*` — новые функции
- `fix/*` — исправления багов
- `docs/*` — документация
- `refactor/*` — рефакторинг

### Workflow

1. Синхронизируйте fork с upstream:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. Создайте feature branch от `main`

3. Разрабатывайте и коммитьте изменения

4. Запустите тесты и линтинг:
   ```bash
   npm run lint
   npm run test
   ```

5. Push и создайте Pull Request

## Стиль кода

### TypeScript

- Используйте строгую типизацию (`strict: true`)
- Избегайте `any`, используйте `unknown` где необходимо
- Именование:
  - `camelCase` для переменных и функций
  - `PascalCase` для классов и типов
  - `UPPER_SNAKE_CASE` для констант

### React/Next.js

- Функциональные компоненты с хуками
- Используйте `'use client'` только когда необходимо
- Props интерфейсы с суффиксом `Props`

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant, onClick, children }: ButtonProps) {
  return (
    <button className={cn('btn', variant)} onClick={onClick}>
      {children}
    </button>
  );
}
```

### NestJS

- Один модуль = одна feature
- DTO для валидации входящих данных
- Entities/Prisma models для БД

```typescript
// DTO
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### CSS/Tailwind

- Используйте Tailwind классы
- Избегайте inline styles
- Используйте `cn()` для условных классов

### Линтинг и форматирование

```bash
# Проверка
npm run lint

# Автоисправление
npm run lint:fix

# Форматирование
npm run format
```

## Коммиты

Используйте [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Типы коммитов

| Тип | Описание |
|-----|----------|
| `feat` | Новая функциональность |
| `fix` | Исправление бага |
| `docs` | Документация |
| `style` | Форматирование (не влияет на код) |
| `refactor` | Рефакторинг кода |
| `test` | Тесты |
| `chore` | Обновление зависимостей, конфигов |
| `perf` | Улучшение производительности |
| `ci` | CI/CD изменения |

### Примеры

```bash
feat(auth): add Google OAuth login
fix(resume): correct PDF generation margins
docs(readme): update installation instructions
refactor(api): simplify error handling middleware
test(jobs): add unit tests for search service
chore(deps): update Next.js to 14.1.0
```

### Scope (опционально)

- `auth` — аутентификация
- `resume` — резюме
- `jobs` — вакансии
- `profile` — профиль
- `ai` — AI функции
- `api` — backend API
- `ui` — UI компоненты
- `db` — база данных
- `deps` — зависимости

## Pull Requests

### Перед созданием PR

- [ ] Код соответствует стилю проекта
- [ ] Тесты проходят (`npm test`)
- [ ] Линтинг проходит (`npm run lint`)
- [ ] Добавлены тесты для новой функциональности
- [ ] Обновлена документация (если нужно)
- [ ] PR имеет понятное описание

### Шаблон PR

```markdown
## Описание
Краткое описание изменений.

## Тип изменения
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Как тестировать
1. Шаг 1
2. Шаг 2
3. Ожидаемый результат

## Скриншоты (если применимо)

## Чеклист
- [ ] Код соответствует стилю
- [ ] Тесты добавлены/обновлены
- [ ] Документация обновлена
```

### Ревью процесс

1. PR проходит автоматические проверки (CI)
2. Минимум 1 approve от maintainer
3. Все комментарии resolved
4. Merge в `main`

## Отчеты об ошибках

### Перед созданием Issue

1. Проверьте [существующие issues](../../issues)
2. Проверьте [Troubleshooting](docs/guides/troubleshooting.md)

### Шаблон Bug Report

```markdown
## Описание бага
Четкое описание проблемы.

## Шаги воспроизведения
1. Перейти на '...'
2. Нажать '...'
3. Увидеть ошибку

## Ожидаемое поведение
Что должно было произойти.

## Скриншоты
Если применимо.

## Окружение
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]
- npm: [e.g., 10.2.0]

## Дополнительный контекст
Любая дополнительная информация.
```

## Запросы на новые функции

### Шаблон Feature Request

```markdown
## Описание функции
Четкое описание желаемой функциональности.

## Проблема
Какую проблему это решает?

## Предложенное решение
Ваше видение реализации.

## Альтернативы
Рассматривали ли вы альтернативные решения?

## Дополнительный контекст
Любая дополнительная информация.
```

## Вопросы?

- Создайте [Discussion](../../discussions)
- Напишите на dev@careermate.com

---

Спасибо за ваш вклад!
