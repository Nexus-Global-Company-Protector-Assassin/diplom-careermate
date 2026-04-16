import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

export const resumeKeys = {
  all: ["resumes"] as const,
  history: () => [...resumeKeys.all, "history"] as const,
};

export const useResumesHistory = () => {
  return useQuery({
    queryKey: resumeKeys.history(),
    queryFn: () => api.get<any>("/resumes/history"),
  });
};

export const useGenerateCoverLetter = () => {
  return useMutation({
    mutationFn: (data: { company: string; position: string; keyPoints?: string; profile?: any }) =>
      api.post<{ text: string }>("/resumes/cover-letter", data),
  });
};

export const useSaveResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; subtitle?: string; content?: string; type?: string }) =>
      api.post<any>("/resumes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all });
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<any>(`/resumes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.all });
    },
  });
};
