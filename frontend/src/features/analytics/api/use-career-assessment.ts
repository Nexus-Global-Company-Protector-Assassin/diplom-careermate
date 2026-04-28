import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/api-client'
import type { DimensionScores } from '../constants/career-questions'

export interface SubmitAssessmentPayload {
  domain: string
  answers: Array<{ questionId: string; optionIndex: number }>
  dimensionScores: DimensionScores
  topPathRoles: string[]
}

export interface RoadmapStep {
  level: string
  timeframe: string
  skills: string[]
  description: string
}

export interface CareerPathResult {
  rank: number
  role: string
  domain: string
  matchScore: number
  matchReason: string
  roadmap: RoadmapStep[]
  currentSkillsMatch: string[]
  skillsToLearn: string[]
  salaryRange: string
  pros: string[]
  cons: string[]
}

export interface AssessmentResult {
  personalitySummary: string
  dominantTraits: string[]
  topPaths: CareerPathResult[]
}

export interface CareerAssessmentRecord {
  id: string
  domain: string
  answers: unknown
  dimensionScores: DimensionScores
  result: AssessmentResult
  createdAt: string
}

const KEYS = {
  all: ['career-assessment'] as const,
  latest: () => [...KEYS.all, 'latest'] as const,
}

export const useSubmitAssessment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubmitAssessmentPayload) =>
      api.post<AssessmentResult>('/career-assessment', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export const useLatestAssessment = () => {
  return useQuery({
    queryKey: KEYS.latest(),
    queryFn: () => api.get<CareerAssessmentRecord | null>('/career-assessment/latest'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
