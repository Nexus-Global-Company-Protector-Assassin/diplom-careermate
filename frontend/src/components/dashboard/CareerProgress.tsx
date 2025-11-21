"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: number
  name: string
  completed: boolean
}

interface CareerProgressProps {
  steps?: Step[]
}

const defaultSteps: Step[] = [
  { id: 1, name: "Анализ завершен", completed: true },
  { id: 2, name: "Резюме готово", completed: false },
  { id: 3, name: "Отклики идут", completed: false },
  { id: 4, name: "Интервью", completed: false },
]

export function CareerProgress({ steps = defaultSteps }: CareerProgressProps) {
  const completedCount = steps.filter((s) => s.completed).length
  const progress = (completedCount / steps.length) * 100

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">Карьерный прогресс</h2>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                step.completed
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-muted-foreground"
              )}
            >
              {step.completed ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                step.completed ? "font-medium text-primary" : "text-muted-foreground"
              )}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
