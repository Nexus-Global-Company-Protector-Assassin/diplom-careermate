// Pure utility functions — no NestJS or heavy service dependencies.
// Kept separate so user-preferences.service.ts and tests can import without
// pulling in EmbeddingsService / @qdrant.

export type RoleArchetype =
    | 'Backend' | 'Frontend' | 'Fullstack' | 'Mobile'
    | 'DevOps' | 'ML/Data' | 'QA' | 'Manager' | 'Unknown';

const ARCHETYPE_SIGNALS: Record<RoleArchetype, string[]> = {
    'ML/Data': [
        'machine learning', 'ml ', ' ml,', 'data science', 'data scientist', 'nlp',
        'computer vision', 'deep learning', 'pytorch', 'tensorflow', 'sklearn', 'scikit',
        'data analyst', 'аналитик данных', 'data engineer', 'etl', 'spark', 'hadoop',
        'airflow', 'bigquery', 'snowflake',
    ],
    'DevOps': [
        'devops', 'sre', 'site reliability', 'kubernetes', 'k8s', 'docker', 'terraform',
        'ansible', 'ci/cd', 'jenkins', 'gitlab ci', 'github actions', 'infrastructure',
        'инфраструктур', 'облачн', 'cloud engineer', 'platform engineer',
    ],
    'Mobile': ['android', 'ios', 'swift', 'kotlin', 'react native', 'flutter', 'mobile developer', 'мобильн'],
    'Frontend': [
        'frontend', 'фронтенд', 'front-end', 'react', 'vue', 'angular', 'svelte',
        'next.js', 'nuxt', 'ui developer', 'web developer', 'верстальщик', 'html/css',
    ],
    'Backend': [
        'backend', 'бэкенд', 'back-end', 'node.js', 'python developer', 'java developer',
        'golang', 'go developer', 'php developer', 'ruby', 'spring', 'django',
        'fastapi', 'nestjs', 'серверн',
    ],
    'Fullstack': ['fullstack', 'full stack', 'full-stack', 'фулстек', 'full stack developer'],
    'QA': [
        'qa ', 'quality assurance', 'tester', 'тестировщик', 'тестировани',
        'automation qa', 'manual qa', 'sdet', 'selenium', 'cypress', 'playwright',
    ],
    'Manager': [
        'product manager', 'project manager', 'engineering manager', 'team lead',
        'tech lead', 'scrum master', 'менеджер продукта', 'руководитель', 'тимлид',
        'cto', 'vp of engineering',
    ],
    'Unknown': [],
};

export function detectArchetype(title: string, description: string): RoleArchetype {
    const text = `${title} ${description}`.toLowerCase();
    const scores: Partial<Record<RoleArchetype, number>> = {};

    for (const [archetype, keywords] of Object.entries(ARCHETYPE_SIGNALS)) {
        if (archetype === 'Unknown') continue;
        let score = 0;
        for (const kw of keywords) {
            if (text.includes(kw)) score++;
        }
        if (score > 0) scores[archetype as RoleArchetype] = score;
    }

    const fScore = scores['Frontend'] || 0;
    const bScore = scores['Backend'] || 0;
    if (fScore >= 2 && bScore >= 2) return 'Fullstack';
    if (scores['Fullstack'] && scores['Fullstack']! >= 1) return 'Fullstack';

    if (Object.keys(scores).length === 0) return 'Unknown';
    const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return best ? (best[0] as RoleArchetype) : 'Unknown';
}

export function calcVacancyFreshness(
    publishedAt: Date | null | undefined,
    createdAt: Date,
    updatedAt?: Date | null,
): { score: number; label: string; daysOld: number } {
    const now = new Date();
    const ref = publishedAt || updatedAt || createdAt;
    const daysOld = Math.floor((now.getTime() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));

    let score: number;
    let label: string;

    if (daysOld <= 3)       { score = 100; label = 'Только что'; }
    else if (daysOld <= 7)  { score = 90;  label = 'Свежая'; }
    else if (daysOld <= 14) { score = 75;  label = 'Активная'; }
    else if (daysOld <= 30) { score = 55;  label = 'Может быть устаревшей'; }
    else if (daysOld <= 60) { score = 30;  label = 'Подозрительная'; }
    else                    { score = 10;  label = 'Вероятно закрытая'; }

    return { score, label, daysOld };
}
