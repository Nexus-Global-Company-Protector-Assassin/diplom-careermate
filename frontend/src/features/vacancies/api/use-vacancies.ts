import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

export interface Vacancy {
  id: string;
  hhId: string;
  title: string;
  employer: string;
  location: string | null;
  salaryLabel: string;
  salaryFrom: number | null;
  salaryTo: number | null;
  salaryCurrency: string | null;
  skills: string[];
  descriptionPreview: string | null;
  experience: string | null;
  schedule: string | null;
  searchQuery: string;
  createdAt: string;
  updatedAt: string;
  url?: string | null;
  archetype?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  freshnessScore?: number | null;
  freshnessLabel?: string | null;
  daysOld?: number | null;
}

export interface RecommendedJob {
  id: string;
  company: string;
  title: string;
  location: string;
  type: string;
  posted: string;
  skills: string[];
  salary: string;
  salaryFrom: number | null;
  salaryTo: number | null;
  match: string;
  matchScore: number;
  matchColor: string;
  logo: string;
  url: string | null;
  archetype?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  freshnessScore?: number | null;
  freshnessLabel?: string | null;
  daysOld?: number | null;
}

export interface VacancySearchFilters {
  query?: string;
  salaryFrom?: number;
  salaryTo?: number;
  remote?: boolean;
  experience?: string;
  location?: string;
  limit?: number;
}

export const vacancyKeys = {
  all: ["vacancies"] as const,
  recommended: (position?: string, skills?: string) =>
    [...vacancyKeys.all, "recommended", position, skills] as const,
  responses: () => [...vacancyKeys.all, "responses"] as const,
  search: (filters: VacancySearchFilters) =>
    [...vacancyKeys.all, "search", filters] as const,
};

/** Recommended vacancies based on user profile */
export const useRecommendedVacancies = (position?: string, skills?: string[], salary?: number) => {
  const skillsParam = skills && skills.length > 0 ? skills.join(",") : undefined;
  const salaryStr = salary !== undefined ? String(salary) : undefined;
  return useQuery({
    queryKey: vacancyKeys.recommended(position, skillsParam),
    queryFn: () => {
      const params = new URLSearchParams();
      if (position) params.set("position", position);
      if (skillsParam) params.set("skills", skillsParam);
      if (salaryStr) params.set("salary", salaryStr);
      params.set("limit", "10");
      return api.get<RecommendedJob[]>(`/vacancies/recommended?${params.toString()}`);
    },
    // Re-fetch when position changes (e.g. profile loaded)
    staleTime: 5 * 60 * 1000,
    enabled: !!position, // Do not fetch until we have the user's position!
  });
};

export const useResponses = () => {
  return useQuery({
    queryKey: vacancyKeys.responses(),
    queryFn: () => api.get<any[]>("/vacancies/responses"),
  });
};

export const useApplyToVacancy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { vacancyId: string; coverLetter?: string }) =>
      api.post<any>("/vacancies/responses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacancyKeys.responses() });
    },
  });
};

export const useToggleFavorite = () => {
  return useMutation({
    mutationFn: (data: { vacancyId: string; isFavorite: boolean }) =>
      api.post<any>("/vacancies/favorites", data),
  });
};

/** Fetch vacancies from DB with full filter support */
export const useAdzunaVacancies = (filters: VacancySearchFilters) => {
  const { query, salaryFrom, salaryTo, remote, experience, location, limit = 20 } = filters;
  return useQuery({
    queryKey: vacancyKeys.search(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (salaryFrom !== undefined) params.set("salaryFrom", String(salaryFrom));
      if (salaryTo !== undefined) params.set("salaryTo", String(salaryTo));
      if (remote) params.set("remote", "true");
      if (experience && experience !== "any") params.set("experience", experience);
      if (location) params.set("location", location);
      params.set("limit", String(limit));
      return api.get<Vacancy[]>(`/vacancies?${params.toString()}`);
    },
    enabled: !!query || salaryFrom !== undefined || salaryTo !== undefined || remote || !!experience || !!location,
  });
};

/** Triggers Adzuna API search → saves to DB */
export const useAdzunaParse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { query: string; count?: number }) =>
      api.post<Vacancy[]>("/vacancies/search", data),
    onSuccess: (_result: Vacancy[], variables: { query: string; count?: number }) => {
      queryClient.invalidateQueries({ queryKey: vacancyKeys.search({ query: variables.query }) });
    },
  });
};

export const useEvaluateVacancy = () => {
  return useMutation({
    mutationFn: ({ vacancyId, resumeId }: { vacancyId: string; resumeId?: string }) => {
      const params = resumeId && resumeId !== 'all' ? `?resumeId=${resumeId}` : '';
      return api.get<any>(`/vacancies/${vacancyId}/evaluation${params}`);
    },
  });
};

export const useInterviewPrep = () => {
  return useMutation({
    mutationFn: ({ vacancyId, resumeId }: { vacancyId: string; resumeId?: string }) => {
      const params = resumeId && resumeId !== 'all' ? `?resumeId=${resumeId}` : '';
      return api.get<any>(`/vacancies/${vacancyId}/interview-prep${params}`);
    },
  });
};

export const useGenerateCoverLetter = () => {
  return useMutation({
    mutationFn: ({ vacancyId, resumeId, language }: { vacancyId: string; resumeId?: string; language?: 'ru' | 'en' }) => {
      const params = new URLSearchParams();
      if (resumeId && resumeId !== 'all') params.set('resumeId', resumeId);
      if (language) params.set('language', language);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return api.get<{ coverLetter: string } | { noResume: true }>(`/vacancies/${vacancyId}/cover-letter${qs}`);
    },
  });
};

// Legacy aliases
/** @deprecated use useAdzunaVacancies */
export const useHhVacancies = (query: string) => useAdzunaVacancies({ query });
/** @deprecated use useAdzunaParse */
export const useHhParse = useAdzunaParse;
