import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import { toast } from "sonner";

export interface NormalizedSkill {
  id: string;
  name: string;
  category: string | null;
}

export interface SkillGapResult {
  matchedSkills: NormalizedSkill[];
  missingSkills: NormalizedSkill[];
  matchScore: number;
}

export const skillsKeys = {
  all: ["skills"] as const,
  list: (category?: string) => [...skillsKeys.all, "list", category] as const,
  gap: (profileId: string, vacancyId: string) =>
    [...skillsKeys.all, "gap", profileId, vacancyId] as const,
};

/** Fetch the full normalized skills dictionary (for autocomplete) */
export const useSkillsDictionary = (category?: string) => {
  return useQuery({
    queryKey: skillsKeys.list(category),
    queryFn: () => api.get<NormalizedSkill[]>(`/skills${category ? `?category=${category}` : ""}`),
    staleTime: 10 * 60 * 1000, // 10 min – dictionary changes rarely
  });
};

/** Fetch skill gap between a profile and a vacancy */
export const useSkillGap = (profileId?: string, vacancyId?: string) => {
  return useQuery({
    queryKey: skillsKeys.gap(profileId ?? "", vacancyId ?? ""),
    queryFn: () => api.get<SkillGapResult>(`/skills/gap/${profileId}/${vacancyId}`),
    enabled: !!profileId && !!vacancyId,
    staleTime: 2 * 60 * 1000,
  });
};

/** Extract and normalize skills from text using LLM */
export const useExtractSkills = () => {
  return useMutation({
    mutationFn: ({ text, useAi = true }: { text: string; useAi?: boolean }) =>
      api.post<{ skills: Array<{ name: string; category?: string }>; count: number }>(
        "/skills/extract",
        { text, useAi }
      ),
    onError: (error: any) => {
      toast.error("Не удалось извлечь навыки", {
        description: error.message,
      });
    },
  });
};

/** Trigger migration of existing JSON skills */
export const useMigrateSkills = () => {
  return useMutation({
    mutationFn: () =>
      api.post<{ profilesMigrated: number; vacanciesMigrated: number }>("/skills/migrate", {}),
    onSuccess: (data) => {
      toast.success(
        `Миграция завершена: ${data.profilesMigrated} профилей, ${data.vacanciesMigrated} вакансий`
      );
    },
  });
};
