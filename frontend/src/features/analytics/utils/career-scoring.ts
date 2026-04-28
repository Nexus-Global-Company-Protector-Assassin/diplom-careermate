import { QUIZ_QUESTIONS, type Domain, type DimensionScores, type QuizQuestion } from '../constants/career-questions'
import { CAREER_PATHS, type CareerPath } from '../constants/career-paths'

export interface CareerPathMatch {
  path: CareerPath
  matchScore: number  // 0–100
  similarity: number  // cosine similarity 0–1
}

// Aggregates answer scores into normalized DimensionScores (0–5 scale).
export function computeDimensionScores(
  answers: Array<{ questionId: string; optionIndex: number }>,
  questions: QuizQuestion[]
): DimensionScores {
  const dims: (keyof DimensionScores)[] = ['analytical', 'technical', 'social', 'creative', 'leadership', 'structured']
  const raw: DimensionScores = { analytical: 0, technical: 0, social: 0, creative: 0, leadership: 0, structured: 0 }
  const counts: DimensionScores = { analytical: 0, technical: 0, social: 0, creative: 0, leadership: 0, structured: 0 }

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId)
    if (!question) continue
    const option = question.options[answer.optionIndex]
    if (!option) continue
    for (const dim of dims) {
      const val = option.scores[dim]
      if (val != null) {
        raw[dim] += val
        counts[dim]++
      }
    }
  }

  const result = { ...raw }
  for (const dim of dims) {
    if (counts[dim] > 0) {
      // Normalize: average score divided by 5 (max per option), then scale to 0–5
      result[dim] = Math.round((raw[dim] / counts[dim]) * 10) / 10
    }
  }

  return result
}

// Computes cosine similarity between two dimension vectors.
function cosineSimilarity(a: DimensionScores, b: DimensionScores): number {
  const dims: (keyof DimensionScores)[] = ['analytical', 'technical', 'social', 'creative', 'leadership', 'structured']
  let dot = 0
  let magA = 0
  let magB = 0
  for (const dim of dims) {
    dot += a[dim] * b[dim]
    magA += a[dim] * a[dim]
    magB += b[dim] * b[dim]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

// Returns top 5 career path matches sorted by cosine similarity descending.
export function matchCareerPaths(userScores: DimensionScores, domain: Domain): CareerPathMatch[] {
  return CAREER_PATHS.map((path) => {
    const similarity = cosineSimilarity(userScores, path.dimensionProfile)
    // Apply a small boost for paths within the selected domain
    const boost = path.domain === domain ? 0.05 : 0
    const boostedSimilarity = Math.min(1, similarity + boost)
    return {
      path,
      similarity: boostedSimilarity,
      matchScore: Math.round(boostedSimilarity * 100),
    }
  })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
}

// Selects 5 universal + 5 domain-specific questions = 10 total.
export function selectQuestions(domain: Domain): QuizQuestion[] {
  const universal = QUIZ_QUESTIONS.filter((q) => q.domain === 'universal').slice(0, 5)
  const domainQuestions = QUIZ_QUESTIONS.filter((q) => q.domain === domain).slice(0, 5)
  return [...universal, ...domainQuestions]
}
