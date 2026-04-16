import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

// Shape of a vacancy returned from the backend (Prisma Vacancy model)
export interface Vacancy {
  id: string;
  hhId: string;        // legacy field name in DB — used as the external source ID
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
}

export const vacancyKeys = {
  all: ["vacancies"] as const,
  recommended: () => [...vacancyKeys.all, "recommended"] as const,
  responses: () => [...vacancyKeys.all, "responses"] as const,
  search: (query: string) => [...vacancyKeys.all, "search", query] as const,
};

export const useRecommendedVacancies = () => {
  return useQuery({
    queryKey: vacancyKeys.recommended(),
    queryFn: () => api.get<any[]>("/vacancies/recommended"),
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

/** Fetches vacancies stored in DB (via Adzuna or mock fallback) */
export const useAdzunaVacancies = (query: string) => {
  return useQuery({
    queryKey: vacancyKeys.search(query),
    queryFn: () => {
      const qs = query ? `?query=${encodeURIComponent(query)}&limit=20` : `?limit=20`;
      return api.get<Vacancy[]>(`/vacancies${qs}`);
    },
    enabled: !!query, // auto-fetch when query changes (reactive)
  });
};

/** Triggers Adzuna API search → saves to DB */
export const useAdzunaParse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { query: string; count?: number }) =>
      api.post<Vacancy[]>("/vacancies/search", data),
    // react-query v5: onSuccess is still supported on mutationOptions
    onSuccess: (_result: Vacancy[], variables: { query: string; count?: number }) => {
      queryClient.invalidateQueries({ queryKey: vacancyKeys.search(variables.query) });
      queryClient.invalidateQueries({ queryKey: vacancyKeys.search("") });
    },
  });
};

// ---------------------------------------------------------------------------
// Legacy aliases — keep so other files importing the old names don't break
// ---------------------------------------------------------------------------
/** @deprecated use useAdzunaVacancies */
export const useHhVacancies = useAdzunaVacancies;
/** @deprecated use useAdzunaParse */
export const useHhParse = useAdzunaParse;
