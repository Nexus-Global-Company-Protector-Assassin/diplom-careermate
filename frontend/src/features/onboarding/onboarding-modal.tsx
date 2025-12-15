"use client"

import { useState, useEffect } from "react"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { FileText, Target, Search, BarChart3, Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react"
import { BebsichLogo } from "@/shared/assets/bebsich-logo"

interface OnboardingStep {
  title: string
  description: string
  icon: typeof FileText
  color: string
}

const steps: OnboardingStep[] = [
  {
    title: "Добро пожаловать в CareerMate!",
    description:
      "Я помогу вам найти работу мечты. Давайте познакомимся с основными возможностями платформы и настроим ваш профиль.",
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Создайте профиль",
    description:
      "Заполните информацию о себе, опыте работы и навыках. Чем полнее профиль, тем точнее будут рекомендации AI.",
    icon: FileText,
    color: "from-emerald-500 to-green-500",
  },
  {
    title: "Установите карьерную цель",
    description: "Укажите желаемую должность, зарплату и локацию. Это поможет нам найти идеальные вакансии для вас.",
    icon: Target,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Ищите вакансии с AI",
    description: "Наш AI анализирует тысячи вакансий и показывает только те, которые подходят именно вам.",
    icon: Search,
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Отслеживайте прогресс",
    description: "Аналитика покажет эффективность ваших откликов и поможет улучшить стратегию поиска работы.",
    icon: BarChart3,
    color: "from-blue-600 to-indigo-600",
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("careermate-onboarding-seen")
    if (!hasSeenOnboarding) {
      setOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem("careermate-onboarding-seen", "true")
    setOpen(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const step = steps[currentStep]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby="onboarding-description" className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${step.color} p-8 text-white text-center`}>
          <div className="flex justify-center mb-4">
            {currentStep === 0 ? (
              <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center">
                <BebsichLogo className="h-16 w-16" />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center">
                <step.icon className="h-10 w-10" />
              </div>
            )}
          </div>
          <DialogTitle className="text-xl font-bold">{step.title}</DialogTitle>
        </div>

        {/* Content */}
        <div className="p-6">
          <DialogDescription id="onboarding-description" className="text-center text-muted-foreground mb-6">{step.description}</DialogDescription>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${index === currentStep ? "w-6 bg-blue-600" : "w-2 bg-muted hover:bg-muted-foreground/30"
                  }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Пропустить
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrev} className="bg-transparent border-border">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Назад
                </Button>
              )}
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-1" /> Начать
                  </>
                ) : (
                  <>
                    Далее <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
