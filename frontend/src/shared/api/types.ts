export interface ProfileDto {
    fullName?: string;
    phone?: string;
    location?: string;
    desiredPosition?: string;
    desiredSalaryMin?: number;
    desiredSalaryMax?: number;
    experienceYears?: number;
    education?: any;
    workExperience?: any;
    skills?: any;
    languages?: any;
    aboutMe?: string;
    careerGoals?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
}

export interface AnalysisResultDto {
    id: string;
    profileId: string;
    content: Record<string, any>;
    createdAt: string;
}

export interface PocRunResponseDto {
    analysis: AnalysisResultDto;
    vacancies: any[];
    resume: any;
}

// Parsed profile returned by the ML Agent after uploading a PDF/DOCX
export interface ParsedProfileDto {
    fullName: string;
    desiredPosition?: string;
    experienceYears?: number;
    skills?: string[];
    education?: any[];
    workExperience?: any[];
    aboutMe?: string;
}

// AI ReAct Chat types
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export type ChatResponseDto =
    | { type: 'result'; data: any; message: string }
    | { type: 'questions'; data: string[]; message: string };
