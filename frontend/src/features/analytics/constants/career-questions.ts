export type Domain = 'it' | 'finance' | 'marketing' | 'management' | 'creative' | 'other'

export interface DimensionScores {
  analytical: number
  technical: number
  social: number
  creative: number
  leadership: number
  structured: number
}

export interface QuizQuestion {
  id: string
  text: string
  domain: 'universal' | Domain
  options: Array<{
    text: string
    scores: Partial<DimensionScores>
  }>
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ─── Universal (u-1 … u-10) ───────────────────────────────────────────────
  {
    id: 'u-1',
    domain: 'universal',
    text: 'Когда вы сталкиваетесь со сложной задачей, что делаете в первую очередь?',
    options: [
      { text: 'Разбиваю её на подзадачи и составляю план', scores: { analytical: 4, structured: 4 } },
      { text: 'Ищу информацию, изучаю тему глубоко', scores: { analytical: 3, technical: 3 } },
      { text: 'Обсуждаю с командой, спрашиваю мнения', scores: { social: 4, leadership: 2 } },
      { text: 'Погружаюсь и пробую разные подходы интуитивно', scores: { creative: 4, technical: 2 } },
    ],
  },
  {
    id: 'u-2',
    domain: 'universal',
    text: 'Что вас больше всего мотивирует в работе?',
    options: [
      { text: 'Решение сложных технических задач с видимым результатом', scores: { technical: 4, analytical: 2 } },
      { text: 'Помощь людям и улучшение их жизни', scores: { social: 5, creative: 1 } },
      { text: 'Создание чего-то нового и уникального', scores: { creative: 5, leadership: 2 } },
      { text: 'Стабильность, чёткие процессы и предсказуемый результат', scores: { structured: 5, analytical: 2 } },
    ],
  },
  {
    id: 'u-3',
    domain: 'universal',
    text: 'В команде вы чаще всего...',
    options: [
      { text: 'Генерирую идеи и вдохновляю других', scores: { creative: 4, leadership: 3 } },
      { text: 'Координирую и организую работу', scores: { leadership: 5, structured: 3 } },
      { text: 'Погружаюсь в технические детали и решаю сложные проблемы', scores: { technical: 5, analytical: 2 } },
      { text: 'Слушаю всех, помогаю и разрешаю конфликты', scores: { social: 5, leadership: 2 } },
    ],
  },
  {
    id: 'u-4',
    domain: 'universal',
    text: 'Как вы предпочитаете работать с информацией?',
    options: [
      { text: 'Цифры и данные — они не лгут', scores: { analytical: 5, structured: 2 } },
      { text: 'Текст и нарратив — люблю объяснять сложное просто', scores: { social: 3, creative: 3 } },
      { text: 'Визуально — схемы, прототипы, интерфейсы', scores: { creative: 5, technical: 2 } },
      { text: 'Процессы и системы — важна структура', scores: { structured: 5, analytical: 2 } },
    ],
  },
  {
    id: 'u-5',
    domain: 'universal',
    text: 'Что для вас означает успех в работе?',
    options: [
      { text: 'Создал продукт или систему, которой пользуются тысячи людей', scores: { technical: 3, leadership: 3 } },
      { text: 'Команда работает слаженно, все довольны и развиваются', scores: { social: 5, leadership: 4 } },
      { text: 'Моя работа принесла измеримый результат — прибыль, рост, эффективность', scores: { analytical: 5, leadership: 2 } },
      { text: 'Получил интересную задачу и нашёл элегантное решение', scores: { technical: 4, creative: 4 } },
    ],
  },
  {
    id: 'u-6',
    domain: 'universal',
    text: 'Как вы относитесь к долгосрочным проектам продолжительностью 6+ месяцев?',
    options: [
      { text: 'Люблю видеть, как маленькие шаги складываются в большой результат', scores: { structured: 4, analytical: 3 } },
      { text: 'Предпочитаю быстрые победы, потом — следующий проект', scores: { creative: 3, technical: 3 } },
      { text: 'Главное — хорошая команда, с ней всё комфортно', scores: { social: 5, leadership: 2 } },
      { text: 'Важна свобода менять подход по мере развития ситуации', scores: { creative: 4, leadership: 3 } },
    ],
  },
  {
    id: 'u-7',
    domain: 'universal',
    text: 'Если нужно изучить новый инструмент или технологию, как вы это делаете?',
    options: [
      { text: 'Читаю документацию от начала до конца', scores: { structured: 5, analytical: 2 } },
      { text: 'Сразу пробую на практике, разбираюсь по ходу', scores: { technical: 4, creative: 3 } },
      { text: 'Смотрю примеры других, адаптирую под свой случай', scores: { analytical: 3, technical: 2 } },
      { text: 'Нахожу коллегу, который знает, и учусь у него', scores: { social: 5, structured: 2 } },
    ],
  },
  {
    id: 'u-8',
    domain: 'universal',
    text: 'Как вы относитесь к принятию решений с неполной информацией?',
    options: [
      { text: 'Комфортно — выдвигаю гипотезу и иду дальше', scores: { creative: 4, leadership: 3 } },
      { text: 'Осторожно — стараюсь собрать максимум данных перед шагом', scores: { analytical: 5, structured: 3 } },
      { text: 'Зависит от контекста и цены ошибки', scores: { analytical: 3, structured: 2 } },
      { text: 'Предпочитаю сначала обсудить с командой', scores: { social: 5, leadership: 2 } },
    ],
  },
  {
    id: 'u-9',
    domain: 'universal',
    text: 'Какое достижение приносит вам наибольшее удовлетворение?',
    options: [
      { text: 'Разработал и запустил что-то, чем пользуются люди', scores: { technical: 4, creative: 2 } },
      { text: 'Помог человеку решить его проблему или вырасти', scores: { social: 5, leadership: 3 } },
      { text: 'Привёл команду к цели, которую казалось нельзя достичь', scores: { leadership: 5, social: 3 } },
      { text: 'Нашёл красивое нестандартное решение сложной задачи', scores: { creative: 5, analytical: 3 } },
    ],
  },
  {
    id: 'u-10',
    domain: 'universal',
    text: 'Что лучше всего описывает ваш стиль мышления?',
    options: [
      { text: 'Системное — всегда вижу связи между частями', scores: { analytical: 5, structured: 2 } },
      { text: 'Эмпатическое — хорошо понимаю людей и их потребности', scores: { social: 5, creative: 2 } },
      { text: 'Критическое — люблю задавать вопросы и проверять гипотезы', scores: { analytical: 4, technical: 2 } },
      { text: 'Творческое — часто нахожу нестандартные, неочевидные решения', scores: { creative: 5, analytical: 2 } },
    ],
  },

  // ─── IT domain (it-1 … it-5) ──────────────────────────────────────────────
  {
    id: 'it-1',
    domain: 'it',
    text: 'В IT-задачах вам больше нравится...',
    options: [
      { text: 'Проектировать архитектуру и продумывать системы', scores: { analytical: 5, technical: 3 } },
      { text: 'Писать код и решать конкретные технические задачи', scores: { technical: 5, structured: 2 } },
      { text: 'Работать с данными, строить модели и анализировать', scores: { analytical: 4, technical: 3 } },
      { text: 'Создавать интерфейсы и улучшать пользовательский опыт', scores: { creative: 5, technical: 2 } },
    ],
  },
  {
    id: 'it-2',
    domain: 'it',
    text: 'Как вы относитесь к работе "в одиночку" над сложным алгоритмом несколько часов?',
    options: [
      { text: 'Это лучшее, что есть в программировании', scores: { technical: 5, analytical: 3 } },
      { text: 'Нормально, но предпочитаю периодически обсуждать', scores: { technical: 3, social: 2 } },
      { text: 'Скучновато — предпочитаю командную работу', scores: { social: 4, leadership: 2 } },
      { text: 'Зависит от задачи — важнее видеть конечный продукт', scores: { creative: 3, technical: 2 } },
    ],
  },
  {
    id: 'it-3',
    domain: 'it',
    text: 'Что вам ближе в IT-продукте?',
    options: [
      { text: 'Серверная часть, базы данных и производительность', scores: { technical: 5, analytical: 3 } },
      { text: 'Визуальная часть и взаимодействие с пользователем', scores: { creative: 4, technical: 2 } },
      { text: 'Инфраструктура, надёжность и автоматизация', scores: { technical: 4, structured: 4 } },
      { text: 'Аналитика, метрики и принятие решений на основе данных', scores: { analytical: 5, structured: 3 } },
    ],
  },
  {
    id: 'it-4',
    domain: 'it',
    text: 'Что для вас важнее в проекте?',
    options: [
      { text: 'Технически идеальное решение с чистым кодом', scores: { technical: 5, structured: 3 } },
      { text: 'Быстрый запуск и реальная ценность для пользователя', scores: { creative: 3, leadership: 3 } },
      { text: 'Надёжность, безопасность и устойчивость к сбоям', scores: { analytical: 3, structured: 5 } },
      { text: 'Команда в порядке и процессы выстроены', scores: { social: 4, leadership: 4 } },
    ],
  },
  {
    id: 'it-5',
    domain: 'it',
    text: 'Когда вы видите сложный баг или уязвимость, вы...',
    options: [
      { text: 'Ищу первопричину — пока не разберусь, не успокоюсь', scores: { analytical: 5, technical: 3 } },
      { text: 'Исправляю быстро и двигаюсь дальше', scores: { technical: 4, structured: 2 } },
      { text: 'Вовлекаю команду — вместе решить быстрее', scores: { social: 4, leadership: 3 } },
      { text: 'Думаю о системном решении, чтобы это не повторилось', scores: { analytical: 4, structured: 5 } },
    ],
  },

  // ─── Finance domain (fin-1 … fin-5) ───────────────────────────────────────
  {
    id: 'fin-1',
    domain: 'finance',
    text: 'Что вас больше привлекает в работе с деньгами и цифрами?',
    options: [
      { text: 'Анализ данных и построение финансовых моделей', scores: { analytical: 5, structured: 3 } },
      { text: 'Контроль, точность и аудит операций', scores: { structured: 5, analytical: 3 } },
      { text: 'Инвестиции и управление капиталом', scores: { analytical: 4, leadership: 3 } },
      { text: 'Работа с клиентами и помощь в финансовых решениях', scores: { social: 4, analytical: 2 } },
    ],
  },
  {
    id: 'fin-2',
    domain: 'finance',
    text: 'Как вы относитесь к риску в профессиональном контексте?',
    options: [
      { text: 'Минимизирую его — точность важнее скорости', scores: { structured: 5, analytical: 3 } },
      { text: 'Оцениваю количественно и принимаю обоснованные риски', scores: { analytical: 5, leadership: 2 } },
      { text: 'Разумный риск — двигатель роста', scores: { leadership: 4, creative: 3 } },
      { text: 'Слежу за рисками других и предупреждаю заранее', scores: { analytical: 4, structured: 4 } },
    ],
  },
  {
    id: 'fin-3',
    domain: 'finance',
    text: 'Какой формат финансовой работы вам ближе?',
    options: [
      { text: 'Регулярная отчётность, расчёты, проводки', scores: { structured: 5, analytical: 3 } },
      { text: 'Стратегический анализ и рекомендации бизнесу', scores: { analytical: 5, leadership: 3 } },
      { text: 'Прогнозирование и моделирование сценариев', scores: { analytical: 4, creative: 3 } },
      { text: 'Консультирование клиентов по финансовым вопросам', scores: { social: 5, analytical: 2 } },
    ],
  },
  {
    id: 'fin-4',
    domain: 'finance',
    text: 'Ошибка в отчёте на 1 копейку вас...',
    options: [
      { text: 'Не успокоит, пока не найду и не исправлю', scores: { structured: 5, analytical: 3 } },
      { text: 'Исправлю и пойму причину, чтобы не повторилось', scores: { analytical: 4, structured: 3 } },
      { text: 'Отмечу и делегирую проверку', scores: { leadership: 4, structured: 2 } },
      { text: 'Важно, но не критично — смотрю на общую картину', scores: { analytical: 3, leadership: 3 } },
    ],
  },
  {
    id: 'fin-5',
    domain: 'finance',
    text: 'Что для вас приоритет в финансовой деятельности?',
    options: [
      { text: 'Соблюдение законодательства и стандартов', scores: { structured: 5, analytical: 2 } },
      { text: 'Увеличение прибыли и оптимизация расходов', scores: { analytical: 4, leadership: 3 } },
      { text: 'Прозрачность и понятность для всех стейкхолдеров', scores: { social: 4, analytical: 3 } },
      { text: 'Долгосрочная устойчивость и управление рисками', scores: { analytical: 5, structured: 3 } },
    ],
  },

  // ─── Marketing domain (mkt-1 … mkt-5) ────────────────────────────────────
  {
    id: 'mkt-1',
    domain: 'marketing',
    text: 'Что для вас важнее в маркетинге?',
    options: [
      { text: 'Данные, метрики и оптимизация воронки', scores: { analytical: 5, structured: 3 } },
      { text: 'Яркий креатив и вирусный контент', scores: { creative: 5, social: 2 } },
      { text: 'Понимание аудитории и её потребностей', scores: { social: 5, analytical: 2 } },
      { text: 'Стратегия и позиционирование бренда', scores: { analytical: 4, leadership: 3 } },
    ],
  },
  {
    id: 'mkt-2',
    domain: 'marketing',
    text: 'Какой инструмент маркетинга вам ближе всего?',
    options: [
      { text: 'A/B тесты и аналитика конверсии', scores: { analytical: 5, technical: 2 } },
      { text: 'Соцсети, контент и сообщество', scores: { creative: 4, social: 4 } },
      { text: 'PR и партнёрства', scores: { social: 5, leadership: 2 } },
      { text: 'SEO и перформанс-реклама', scores: { analytical: 4, technical: 3 } },
    ],
  },
  {
    id: 'mkt-3',
    domain: 'marketing',
    text: 'Кампания провалилась по метрикам. Ваша первая реакция?',
    options: [
      { text: 'Смотрю данные — что именно не сработало и почему', scores: { analytical: 5, structured: 3 } },
      { text: 'Слушаю обратную связь от аудитории', scores: { social: 5, analytical: 2 } },
      { text: 'Генерирую новые идеи для следующей попытки', scores: { creative: 5, leadership: 2 } },
      { text: 'Анализирую конкурентов — что они делают иначе', scores: { analytical: 4, structured: 3 } },
    ],
  },
  {
    id: 'mkt-4',
    domain: 'marketing',
    text: 'Что для вас приоритет при создании контента?',
    options: [
      { text: 'Оригинальность и визуальная привлекательность', scores: { creative: 5, social: 2 } },
      { text: 'SEO и органический трафик', scores: { analytical: 4, technical: 3 } },
      { text: 'Отклик и вовлечённость аудитории', scores: { social: 5, analytical: 2 } },
      { text: 'Конверсия и бизнес-результат', scores: { analytical: 5, leadership: 3 } },
    ],
  },
  {
    id: 'mkt-5',
    domain: 'marketing',
    text: 'Как вы принимаете маркетинговые решения?',
    options: [
      { text: 'На основе данных и тестов', scores: { analytical: 5, structured: 3 } },
      { text: 'На основе интуиции и понимания аудитории', scores: { creative: 4, social: 3 } },
      { text: 'Через обсуждение в команде', scores: { social: 4, leadership: 3 } },
      { text: 'Сравниваю с бенчмарками и лучшими практиками', scores: { analytical: 4, structured: 4 } },
    ],
  },

  // ─── Management domain (mgmt-1 … mgmt-5) ─────────────────────────────────
  {
    id: 'mgmt-1',
    domain: 'management',
    text: 'Что для вас самое важное в роли руководителя?',
    options: [
      { text: 'Развивать людей и помогать им расти', scores: { social: 5, leadership: 3 } },
      { text: 'Достигать результатов и выполнять цели', scores: { leadership: 5, analytical: 3 } },
      { text: 'Выстраивать эффективные процессы', scores: { structured: 5, leadership: 3 } },
      { text: 'Создавать атмосферу доверия и психологическую безопасность', scores: { social: 5, leadership: 2 } },
    ],
  },
  {
    id: 'mgmt-2',
    domain: 'management',
    text: 'Как вы справляетесь с конфликтами в команде?',
    options: [
      { text: 'Слушаю обе стороны и нахожу компромисс', scores: { social: 5, leadership: 3 } },
      { text: 'Устанавливаю чёткие правила и разграничиваю зоны ответственности', scores: { structured: 5, leadership: 3 } },
      { text: 'Перевожу конфликт в конструктивный диалог о задачах', scores: { leadership: 4, analytical: 3 } },
      { text: 'Привлекаю HR или нейтральную сторону', scores: { social: 3, structured: 3 } },
    ],
  },
  {
    id: 'mgmt-3',
    domain: 'management',
    text: 'Как вы планируете работу команды?',
    options: [
      { text: 'Детальные планы с конкретными дедлайнами', scores: { structured: 5, analytical: 3 } },
      { text: 'Гибко, с возможностью корректировки', scores: { creative: 3, leadership: 4 } },
      { text: 'Вместе с командой — они лучше знают детали', scores: { social: 5, leadership: 3 } },
      { text: 'OKR или другие измеримые цели', scores: { analytical: 4, leadership: 4 } },
    ],
  },
  {
    id: 'mgmt-4',
    domain: 'management',
    text: 'Что для вас сложнее всего в управлении?',
    options: [
      { text: 'Давать сложную обратную связь', scores: { social: 3, leadership: 3 } },
      { text: 'Делегировать задачи и доверять другим', scores: { leadership: 3, structured: 2 } },
      { text: 'Удерживать команду в фокусе на главном', scores: { leadership: 4, analytical: 3 } },
      { text: 'Принимать решения при неполной информации', scores: { analytical: 4, leadership: 4 } },
    ],
  },
  {
    id: 'mgmt-5',
    domain: 'management',
    text: 'Как вы относитесь к найму и развитию сотрудников?',
    options: [
      { text: 'Это важнейшее инвестирование в долгосрочный успех', scores: { social: 5, leadership: 4 } },
      { text: 'Нужно чётко описывать ожидания и измерять результаты', scores: { structured: 4, analytical: 4 } },
      { text: 'Важно создавать условия для самостоятельного роста', scores: { social: 4, leadership: 3 } },
      { text: 'Подбираю людей с нужными компетенциями и доверяю им', scores: { leadership: 4, analytical: 3 } },
    ],
  },

  // ─── Creative domain (crt-1 … crt-5) ─────────────────────────────────────
  {
    id: 'crt-1',
    domain: 'creative',
    text: 'Что вас вдохновляет в творческой работе больше всего?',
    options: [
      { text: 'Момент, когда идея обретает визуальную форму', scores: { creative: 5, technical: 2 } },
      { text: 'Реакция аудитории на готовый продукт', scores: { social: 5, creative: 2 } },
      { text: 'Решение сложной задачи через эстетику', scores: { creative: 4, analytical: 3 } },
      { text: 'Работа с командой над единым видением', scores: { social: 4, leadership: 3 } },
    ],
  },
  {
    id: 'crt-2',
    domain: 'creative',
    text: 'Как вы относитесь к критике вашего творческого продукта?',
    options: [
      { text: 'Воспринимаю как данные для улучшения', scores: { analytical: 4, structured: 3 } },
      { text: 'Слушаю, но доверяю своему творческому чутью', scores: { creative: 4, leadership: 2 } },
      { text: 'Ищу компромисс между видением и потребностями заказчика', scores: { social: 4, creative: 3 } },
      { text: 'Задаю уточняющие вопросы — критика должна быть конкретной', scores: { analytical: 4, social: 2 } },
    ],
  },
  {
    id: 'crt-3',
    domain: 'creative',
    text: 'Как вы ищете идеи для проектов?',
    options: [
      { text: 'Изучаю работы других и нахожу вдохновение', scores: { creative: 4, analytical: 2 } },
      { text: 'Исследую целевую аудиторию и их боли', scores: { social: 4, analytical: 3 } },
      { text: 'Экспериментирую и пробую разные подходы', scores: { creative: 5, technical: 2 } },
      { text: 'Строго следую брифу и техническому заданию', scores: { structured: 4, analytical: 3 } },
    ],
  },
  {
    id: 'crt-4',
    domain: 'creative',
    text: 'Что важнее в конечном продукте?',
    options: [
      { text: 'Эстетика и оригинальность', scores: { creative: 5, technical: 1 } },
      { text: 'Функциональность и удобство использования', scores: { technical: 3, analytical: 3 } },
      { text: 'Соответствие потребностям аудитории', scores: { social: 5, analytical: 2 } },
      { text: 'Соответствие бренду и концепции', scores: { structured: 4, creative: 3 } },
    ],
  },
  {
    id: 'crt-5',
    domain: 'creative',
    text: 'Сжатые сроки для творческого проекта — это...',
    options: [
      { text: 'Стресс, который мешает качественной работе', scores: { creative: 3, structured: 2 } },
      { text: 'Вызов, который иногда даёт лучшие результаты', scores: { creative: 4, leadership: 3 } },
      { text: 'Норма — научился работать эффективно', scores: { structured: 4, technical: 3 } },
      { text: 'Повод сфокусироваться на самом важном', scores: { analytical: 3, structured: 3 } },
    ],
  },

  // ─── Other domain (oth-1 … oth-5) ─────────────────────────────────────────
  {
    id: 'oth-1',
    domain: 'other',
    text: 'Какая рабочая среда вам комфортна?',
    options: [
      { text: 'Стабильная, с чёткими процессами и ожиданиями', scores: { structured: 5, analytical: 2 } },
      { text: 'Динамичная, с постоянными изменениями и новыми задачами', scores: { creative: 4, leadership: 3 } },
      { text: 'Людная, с активным взаимодействием и коммуникацией', scores: { social: 5, leadership: 2 } },
      { text: 'Спокойная, где можно сосредоточиться на сложных задачах', scores: { analytical: 4, technical: 3 } },
    ],
  },
  {
    id: 'oth-2',
    domain: 'other',
    text: 'Что приносит вам больше всего удовольствия в профессиональной деятельности?',
    options: [
      { text: 'Помогать людям решать их проблемы', scores: { social: 5, leadership: 2 } },
      { text: 'Создавать продукты или системы с нуля', scores: { creative: 4, technical: 3 } },
      { text: 'Находить оптимальные решения для сложных задач', scores: { analytical: 5, structured: 2 } },
      { text: 'Влиять на стратегию и развитие организации', scores: { leadership: 5, analytical: 3 } },
    ],
  },
  {
    id: 'oth-3',
    domain: 'other',
    text: 'Какой тип задач вам даётся легче всего?',
    options: [
      { text: 'Работа с людьми — переговоры, обучение, поддержка', scores: { social: 5, leadership: 2 } },
      { text: 'Работа с данными и аналитика', scores: { analytical: 5, technical: 2 } },
      { text: 'Работа руками — создание, построение, настройка', scores: { technical: 5, creative: 2 } },
      { text: 'Стратегическое планирование и управление', scores: { leadership: 5, analytical: 3 } },
    ],
  },
  {
    id: 'oth-4',
    domain: 'other',
    text: 'Как вы реагируете на монотонную, повторяющуюся работу?',
    options: [
      { text: 'Нормально — стабильность и предсказуемость ценны', scores: { structured: 5, analytical: 2 } },
      { text: 'Стараюсь автоматизировать или оптимизировать', scores: { technical: 4, analytical: 3 } },
      { text: 'Быстро теряю интерес — нужно разнообразие', scores: { creative: 4, leadership: 2 } },
      { text: 'Использую время для размышлений о стратегии', scores: { analytical: 3, leadership: 3 } },
    ],
  },
  {
    id: 'oth-5',
    domain: 'other',
    text: 'Что важнее при выборе карьерного пути?',
    options: [
      { text: 'Возможность помогать людям и влиять на их жизнь', scores: { social: 5, leadership: 2 } },
      { text: 'Интеллектуальные вызовы и постоянное развитие', scores: { analytical: 4, technical: 3 } },
      { text: 'Финансовая стабильность и перспективы роста', scores: { structured: 3, leadership: 3 } },
      { text: 'Творческая свобода и возможность самовыражения', scores: { creative: 5, leadership: 2 } },
    ],
  },
]
