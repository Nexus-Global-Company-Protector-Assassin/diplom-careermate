import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

export const interviewKeys = {
  all: ["interviews"] as const,
  list: () => [...interviewKeys.all, "list"] as const,
};

export const useInterviews = () => {
  return useQuery({
    queryKey: interviewKeys.list(),
    queryFn: () => api.get<any[]>("/interviews"),
  });
};

export const useCreateInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>("/interviews", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.list() });
    },
  });
};

export const useUpdateInterviewStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.put<any>(`/interviews/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.list() });
    },
  });
};
