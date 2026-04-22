import { useMutation } from '@tanstack/react-query';

// ── Types ──────────────────────────────────────────────────────

export interface ResumeQuestion {
    id: string;
    category: 'experience' | 'skills' | 'education' | 'personal' | 'achievements';
    question: string;
    hint: string;
    required: boolean;
}

export interface ResumeQuestionsResponse {
    profileSummary: string;
    missingDataAreas: string[];
    questions: ResumeQuestion[];
}

export interface CreatedResume {
    title: string;
    resumeMarkdown: string;
    tips: string[];
}

export interface QuestionAnswer {
    questionId: string;
    answer: string;
}

interface ProfileDataForAgent {
    fullName?: string;
    desiredPosition?: string;
    experienceYears?: number;
    skills?: string[];
    workExperience?: Array<{
        company: string;
        position: string;
        duration?: string;
        description?: string;
    }>;
    education?: Array<{
        institution: string;
        degree: string;
    }>;
    aboutMe?: string;
    careerGoals?: string;
}

// ── Hook: Generate Questions ──────────────────────────────────

export const useGenerateQuestions = () => {
    return useMutation<ResumeQuestionsResponse, Error, ProfileDataForAgent>({
        mutationFn: async (profileData) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3002';
            const response = await fetch(`${agentUrl}/ai/create-resume/questions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ profileData }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(err.message || 'Ошибка генерации вопросов');
            }

            const json = await response.json();
            return json.data as ResumeQuestionsResponse;
        },
    });
};

// ── Hook: Generate Resume ─────────────────────────────────────

export const useGenerateResume = () => {
    return useMutation<CreatedResume, Error, { profileData: ProfileDataForAgent; answers: QuestionAnswer[] }>({
        mutationFn: async ({ profileData, answers }) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3002';
            const response = await fetch(`${agentUrl}/ai/create-resume/generate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ profileData, answers }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(err.message || 'Ошибка генерации резюме');
            }

            const json = await response.json();
            return json.data as CreatedResume;
        },
    });
};
