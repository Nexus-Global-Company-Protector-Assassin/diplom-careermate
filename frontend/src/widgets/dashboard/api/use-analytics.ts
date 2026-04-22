import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

export const analyticsKeys = {
  all: ["analytics"] as const,
  weekly: () => [...analyticsKeys.all, "weekly"] as const,
  dashboard: () => [...analyticsKeys.all, "dashboard"] as const,
};

export const useWeeklyAnalytics = () => {
  return useQuery({
    queryKey: analyticsKeys.weekly(),
    queryFn: () => api.get<any[]>("/analytics/weekly"),
  });
};

export interface DashboardSummary {
  fullName: string;
  careerGoal: {
    position: string;
    location: string;
    salary: string;
    experience: string;
  };
  careerProgress: { label: string; done: boolean }[];
  profileCompletion: { id: string; label: string; completed: boolean; href: string }[];
  achievements: {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    progress: number;
    maxProgress: number;
    color: string;
  }[];
  salaryData: {
    position: string;
    yourSalary: number;
    marketAvg: number;
    marketMin: number;
    marketMax: number;
    vacanciesInRange: number;
  };
}

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => api.get<DashboardSummary>("/analytics/dashboard"),
    staleTime: 2 * 60 * 1000,
  });
};
