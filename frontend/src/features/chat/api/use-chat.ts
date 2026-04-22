import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

export const useChatResponse = () => {
  return useMutation({
    mutationFn: (message: string) => api.post<{ response: string }>("/ai/chat", { message }),
  });
};
