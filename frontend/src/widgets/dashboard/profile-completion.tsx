"use client"

import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Progress } from "@/shared/ui/progress"
import { CheckCircle2, Circle, ArrowRight } from "lucide-react"
import Link from "next/link"

const completionItems = [
  { id: "personal", label: "Личные данные", completed: true, href: "/profile" },
  { id: "experience", label: "Опыт работы", completed: true, href: "/profile" },
  { id: "education", label: "Образование", completed: true, href: "/profile" },
  { id: "skills", label: "Навыки", completed: true, href: "/profile" },
  { id: "resume", label: "Загружено резюме", completed: true, href: "/resume" },
  { id: "photo", label: "Фото профиля", completed: false, href: "/profile" },
  { id: "goal", label: "Карьерная цель", completed: true, href: "/profile" },
  { id: "linkedin", label: "Связь с LinkedIn", completed: false, href: "/settings" },
]

export function ProfileCompletion() {
  const completedCount = completionItems.filter((item) => item.completed).length
  const percentage = Math.round((completedCount / completionItems.length) * 100)

  const incompleteItems = completionItems.filter((item) => !item.completed)

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">Заполненность профиля</h2>
          <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
        </div>

        <Progress value={percentage} className="h-2 mb-4" />

        <div className="grid gap-2 mb-4">
          {completionItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
              )}
              <span className={item.completed ? "text-card-foreground" : "text-muted-foreground"}>{item.label}</span>
            </div>
          ))}
        </div>

        {incompleteItems.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Следующий шаг:</p>
            <Link href={incompleteItems[0].href}>
              <Button
                variant="outline"
                className="w-full justify-between bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
              >
                {incompleteItems[0].label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
