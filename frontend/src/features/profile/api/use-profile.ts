import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import { ProfileDto } from "@/shared/api/types";

import { toast } from "sonner";

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

export const useProfile = () => {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => api.get<ProfileDto>("/profiles/me"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Do not retry on 404 (first time user)
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileDto) => api.post<ProfileDto>("/profiles/me", data), // Backend uses POST 'me' to upsert
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.me(), updatedProfile);
      toast.success("Профиль успешно сохранен!");
    },
    onError: (error: any) => {
      toast.error("Не удалось сохранить профиль", {
        description: error.message || "Проверьте корректность введенных данных."
      });
    }
  });
};
