import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

export const vacancyKeys = {
  all: ["vacancies"] as const,
  recommended: () => [...vacancyKeys.all, "recommended"] as const,
  responses: () => [...vacancyKeys.all, "responses"] as const,
  hh: (query: string) => [...vacancyKeys.all, "hh", query] as const,
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

export const useHhVacancies = (query: string) => {
  return useQuery({
    queryKey: vacancyKeys.hh(query),
    queryFn: () => {
      const qs = query ? `?query=${encodeURIComponent(query)}&limit=20` : `?limit=20`;
      return api.get<any[]>(`/vacancies${qs}`);
    },
  });
};

export const useHhParse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { query: string; count?: number }) => 
      api.post<any>("/vacancies/search", data),
    onSuccess: (_, variables) => {
      // Invalidate the HH vacancies query so it refetches after parsing.
      queryClient.invalidateQueries({ queryKey: vacancyKeys.hh(variables.query) });
      queryClient.invalidateQueries({ queryKey: ["vacancies", "hh", ""] });
    },
  });
};
