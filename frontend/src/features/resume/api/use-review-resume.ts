import { useMutation } from '@tanstack/react-query';

export interface ResumeReviewStrength {
    title: string;
    description: string;
}

export interface ResumeReviewWeakness {
    title: string;
    description: string;
    recommendation: string;
    severity: 'critical' | 'major' | 'minor';
}

export interface ResumeReviewResult {
    overallScore: number;
    overallVerdict: 'Отличное' | 'Хорошее' | 'Среднее' | 'Требует доработки';
    noChangesNeeded: boolean;
    strengths: ResumeReviewStrength[];
    weaknesses: ResumeReviewWeakness[];
    missingForTarget: string[];
    improvedResume: string;
    changesSummary: string[];
    extractedProfile: {
        fullName: string;
        currentPosition?: string;
        skills: string[];
        experienceYears: number;
    };
}

interface ReviewResumeInput {
    file: File;
    desiredPosition?: string;
    skills?: string[];
    aboutMe?: string;
}

/**
 * Hook to upload a resume file and get a deep AI review with
 * score, strengths, weaknesses, and improved version.
 */
export const useReviewResume = () => {
    return useMutation<ResumeReviewResult, Error, ReviewResumeInput>({
        mutationFn: async (input: ReviewResumeInput) => {
            const formData = new FormData();
            formData.append('file', input.file);

            if (input.desiredPosition) {
                formData.append('desiredPosition', input.desiredPosition);
            }
            if (input.skills?.length) {
                formData.append('skills', JSON.stringify(input.skills));
            }
            if (input.aboutMe) {
                formData.append('aboutMe', input.aboutMe);
            }

            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3002';
            const response = await fetch(`${agentUrl}/ai/review-resume`, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(err.message || 'Ошибка анализа резюме');
            }

            const json = await response.json();
            return json.data as ResumeReviewResult;
        },
    });
};
