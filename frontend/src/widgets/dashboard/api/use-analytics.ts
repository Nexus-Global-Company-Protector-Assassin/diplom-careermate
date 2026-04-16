import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

export const analyticsKeys = {
  all: ["analytics"] as const,
  weekly: () => [...analyticsKeys.all, "weekly"] as const,
};

export const useWeeklyAnalytics = () => {
  return useQuery({
    queryKey: analyticsKeys.weekly(),
    queryFn: () => api.get<any[]>("/analytics/weekly"),
  });
};
