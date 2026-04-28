"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Loader2, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { computeDimensionScores, matchCareerPaths, selectQuestions } from "./utils/career-scoring"
import { useSubmitAssessment } from "./api/use-career-assessment"
import type { Domain, QuizQuestion } from "./constants/career-questions"

interface CareerQuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

const DOMAINS: Array<{ key: Domain; label: string; icon: string; description: string }> = [
  { key: 'it',         label: 'IT и технологии',      icon: '💻', description: 'Разработка, данные, продукт, дизайн' },
  { key: 'finance',    label: 'Финансы и экономика',   icon: '📊', description: 'Аналитика, бухгалтерия, инвестиции' },
  { key: 'marketing',  label: 'Маркетинг и продажи',   icon: '📢', description: 'Продвижение, контент, рост' },
  { key: 'management', label: 'Управление и бизнес',   icon: '🏢', description: 'Менеджмент, HR, консалтинг' },
  { key: 'creative',   label: 'Творчество и медиа',    icon: '🎨', description: 'Дизайн, контент, визуал' },
  { key: 'other',      label: 'Ещё не определился',    icon: '🔍', description: 'Общие вопросы без привязки к сфере' },
]

export function CareerQuizModal({ open, onOpenChange, onComplete }: CareerQuizModalProps) {
  const [step, setStep] = useState<'domain' | 'quiz' | 'loading'>('domain')
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Array<{ questionId: string; optionIndex: number }>>([])
  const [currentQ, setCurrentQ] = useState(0)

  const { mutate: submitAssessment } = useSubmitAssessment()

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep('domain')
      setSelectedDomain(null)
      setQuestions([])
      setAnswers([])
      setCurrentQ(0)
    }, 300)
  }

  const handleDomainSelect = (domain: Domain) => {
    const qs = selectQuestions(domain)
    setSelectedDomain(domain)
    setQuestions(qs)
    setAnswers([])
    setCurrentQ(0)
    setStep('quiz')
  }

  const handleAnswer = (optionIndex: number) => {
    const question = questions[currentQ]
    const newAnswers = [...answers, { questionId: question.id, optionIndex }]
    setAnswers(newAnswers)

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
      return
    }

    // Last question — compute and submit
    setStep('loading')
    const scores = computeDimensionScores(newAnswers, questions)
    const top5 = matchCareerPaths(scores, selectedDomain!)

    submitAssessment(
      {
        domain: selectedDomain!,
        answers: newAnswers,
        dimensionScores: scores,
        topPathRoles: top5.map((m) => m.path.role),
      },
      {
        onSuccess: () => {
          handleClose()
          onComplete()
        },
        onError: (err: Error) => {
          toast.error('Ошибка при анализе', { description: err.message })
          setStep('quiz')
          setCurrentQ(questions.length - 1)
          setAnswers(answers)
        },
      }
    )
  }

  const progress = questions.length > 0 ? Math.round((currentQ / questions.length) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[580px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {step === 'domain' && 'Карьерный тест — выберите сферу'}
            {step === 'quiz' && `Вопрос ${currentQ + 1} из ${questions.length}`}
            {step === 'loading' && 'Анализируем результаты...'}
          </DialogTitle>
        </DialogHeader>

        {/* Step: Domain selection */}
        {step === 'domain' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ответьте на 10 вопросов о себе — AI определит лучшие карьерные пути с роадмапом роста.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => handleDomainSelect(d.key)}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors"
                >
                  <span className="text-2xl shrink-0">{d.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Quiz */}
        {step === 'quiz' && questions.length > 0 && (
          <div className="space-y-5">
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">{progress}% пройдено</p>
            </div>

            {/* Question */}
            <p className="text-base font-medium text-foreground leading-relaxed">
              {questions[currentQ].text}
            </p>

            {/* Options */}
            <div className="space-y-2">
              {questions[currentQ].options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full text-left rounded-lg border border-border px-4 py-3 text-sm text-foreground hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors"
                >
                  <span className="font-medium text-blue-500 mr-2">
                    {String.fromCharCode(65 + i)})
                  </span>
                  {option.text}
                </button>
              ))}
            </div>

            {currentQ > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentQ(currentQ - 1)
                  setAnswers(answers.slice(0, -1))
                }}
                className="text-muted-foreground"
              >
                ← Назад
              </Button>
            )}
          </div>
        )}

        {/* Step: Loading */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground text-center">
              AI анализирует ваш профиль и подбирает карьерные пути...
              <br />
              <span className="text-xs">Обычно занимает 10–20 секунд</span>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
