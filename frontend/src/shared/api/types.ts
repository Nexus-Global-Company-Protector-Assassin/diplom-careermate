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
    vacancies: any[]; // define stricter when mapping is ready
    resume: any; // define stricter when mapping is ready
}
