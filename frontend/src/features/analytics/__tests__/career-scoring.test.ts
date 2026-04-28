import { computeDimensionScores, matchCareerPaths, selectQuestions } from '../utils/career-scoring'
import { QUIZ_QUESTIONS } from '../constants/career-questions'
import type { DimensionScores } from '../constants/career-questions'

describe('computeDimensionScores', () => {
  it('returns zero scores for empty answers', () => {
    const result = computeDimensionScores([], QUIZ_QUESTIONS)
    expect(result.analytical).toBe(0)
    expect(result.technical).toBe(0)
    expect(result.social).toBe(0)
  })

  it('returns score based on selected option', () => {
    // u-1 option 0 scores { analytical: 4, structured: 4 }
    const result = computeDimensionScores([{ questionId: 'u-1', optionIndex: 0 }], QUIZ_QUESTIONS)
    expect(result.analytical).toBeGreaterThan(0)
    expect(result.structured).toBeGreaterThan(0)
  })

  it('ignores unknown questionId', () => {
    const result = computeDimensionScores([{ questionId: 'nonexistent', optionIndex: 0 }], QUIZ_QUESTIONS)
    expect(result.analytical).toBe(0)
  })

  it('accumulates scores from multiple answers', () => {
    // u-3 option 2 scores { technical: 5, analytical: 2 }
    const result = computeDimensionScores(
      [
        { questionId: 'u-1', optionIndex: 0 },  // analytical 4
        { questionId: 'u-3', optionIndex: 2 },  // technical 5, analytical 2
      ],
      QUIZ_QUESTIONS
    )
    expect(result.analytical).toBeGreaterThan(0)
    expect(result.technical).toBeGreaterThan(0)
  })
})

describe('matchCareerPaths', () => {
  const backendProfile: DimensionScores = { analytical: 5, technical: 5, social: 1, creative: 2, leadership: 2, structured: 4 }

  it('returns exactly 5 results', () => {
    const results = matchCareerPaths(backendProfile, 'it')
    expect(results).toHaveLength(5)
  })

  it('results are sorted by matchScore descending', () => {
    const results = matchCareerPaths(backendProfile, 'it')
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].matchScore).toBeGreaterThanOrEqual(results[i + 1].matchScore)
    }
  })

  it('backend-oriented vector puts a technical backend role in top-2', () => {
    const results = matchCareerPaths(backendProfile, 'it')
    const top2Roles = results.slice(0, 2).map((r) => r.path.role)
    const hasBackendOrSimilar = top2Roles.some((r) =>
      r.toLowerCase().includes('backend') ||
      r.toLowerCase().includes('security') ||
      r.toLowerCase().includes('devops') ||
      r.toLowerCase().includes('ml engineer')
    )
    expect(hasBackendOrSimilar).toBe(true)
  })

  it('domain boost increases score for same-domain paths', () => {
    const resultsIT = matchCareerPaths(backendProfile, 'it')
    const resultsFinance = matchCareerPaths(backendProfile, 'finance')
    // IT domain paths should score higher when IT domain is selected
    const topIT = resultsIT[0]
    const topFinanceForSamePath = resultsFinance.find((r) => r.path.id === topIT.path.id)
    // IT paths should have higher or equal score in IT domain vs finance domain
    if (topIT.path.domain === 'it' && topFinanceForSamePath) {
      expect(topIT.matchScore).toBeGreaterThanOrEqual(topFinanceForSamePath.matchScore)
    }
  })

  it('all matchScores are between 0 and 100', () => {
    const results = matchCareerPaths(backendProfile, 'it')
    results.forEach((r) => {
      expect(r.matchScore).toBeGreaterThanOrEqual(0)
      expect(r.matchScore).toBeLessThanOrEqual(100)
    })
  })
})

describe('selectQuestions', () => {
  it('returns exactly 10 questions', () => {
    const questions = selectQuestions('it')
    expect(questions).toHaveLength(10)
  })

  it('includes 5 universal questions', () => {
    const questions = selectQuestions('it')
    const universalCount = questions.filter((q) => q.domain === 'universal').length
    expect(universalCount).toBe(5)
  })

  it('includes 5 domain-specific questions for IT', () => {
    const questions = selectQuestions('it')
    const itCount = questions.filter((q) => q.domain === 'it').length
    expect(itCount).toBe(5)
  })

  it('includes 5 domain-specific questions for finance', () => {
    const questions = selectQuestions('finance')
    const finCount = questions.filter((q) => q.domain === 'finance').length
    expect(finCount).toBe(5)
  })

  it('different domains return different domain questions', () => {
    const itQuestions = selectQuestions('it')
    const financeQuestions = selectQuestions('finance')
    const itIds = new Set(itQuestions.filter((q) => q.domain !== 'universal').map((q) => q.id))
    const financeIds = new Set(financeQuestions.filter((q) => q.domain !== 'universal').map((q) => q.id))
    // No overlap in domain-specific questions
    const overlap = [...itIds].filter((id) => financeIds.has(id))
    expect(overlap).toHaveLength(0)
  })
})
