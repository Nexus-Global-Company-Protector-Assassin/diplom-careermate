import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";

export const analyticsStatsKeys = {
  all: ["analyticsStats"] as const,
  byPeriod: (period: string) => [...analyticsStatsKeys.all, period] as const,
};

export interface AnalyticsStatsResponse {
  statsCards: {
    value: string;
    label: string;
    change: string;
    positive: boolean;
  }[];
  activityData: {
    name: string;
    отклики: number;
    приглашения: number;
  }[];
  statusData: {
    name: string;
    value: number;
    color: string;
  }[];
}

export const useAnalyticsStats = (period: string) => {
  return useQuery({
    queryKey: analyticsStatsKeys.byPeriod(period),
    queryFn: () => api.get<AnalyticsStatsResponse>(`/analytics/stats?period=${period}`),
    staleTime: 2 * 60 * 1000,
  });
};
