"use client"

import { useState } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { ChevronDown, ChevronUp, Lightbulb, MessageSquare, Target } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

interface Question {
  id: string
  question: string
  category: string
  tip: string
  sampleAnswer: string
}

const interviewQuestions: Question[] = [
  {
    id: "1",
    question: "Расскажите о себе",
    category: "Общие",
    tip: "Структурируйте ответ: образование → опыт → навыки → цели",
    sampleAnswer:
      "Я Data Analyst с 5-летним опытом работы. Начинал карьеру в Сбере, где занимался анализом клиентских данных. Сейчас работаю в Озоне, где отвечаю за продуктовую аналитику. Специализируюсь на Python, SQL и визуализации данных. Ищу позицию Senior Analyst, где смогу развивать команду и работать над сложными задачами.",
  },
  {
    id: "2",
    question: "Почему хотите работать у нас?",
    category: "Мотивация",
    tip: "Изучите компанию заранее. Упомяните конкретные проекты или ценности.",
    sampleAnswer:
      "Меня привлекает масштаб задач вашей компании и возможность работать с большими объемами данных. Я слежу за вашими публикациями на Хабре и впечатлен подходом к data-driven решениям. Хочу быть частью команды, которая создает передовые аналитические решения.",
  },
  {
    id: "3",
    question: "Расскажите о сложном проекте",
    category: "Опыт",
    tip: "Используйте метод STAR: Situation, Task, Action, Result",
    sampleAnswer:
      "В прошлом году передо мной стояла задача оптимизировать конверсию в мобильном приложении. Я провел глубокий анализ воронки, выявил узкие места через A/B тесты и предложил изменения в UX. В результате конверсия выросла на 23%, что принесло компании дополнительно 50 млн рублей в квартал.",
  },
  {
    id: "4",
    question: "Ваши сильные и слабые стороны?",
    category: "Самоанализ",
    tip: "Будьте честны. Для слабых сторон покажите, как работаете над ними.",
    sampleAnswer:
      "Мои сильные стороны — аналитический склад ума и умение объяснять сложные вещи простым языком. Слабая сторона — иногда могу углубиться в детали. Работаю над этим, устанавливая четкие дедлайны и приоритеты для каждой задачи.",
  },
  {
    id: "5",
    question: "Где видите себя через 5 лет?",
    category: "Карьера",
    tip: "Покажите амбиции, но оставайтесь реалистичным",
    sampleAnswer:
      "Через 5 лет вижу себя Lead Data Analyst или Head of Analytics. Хочу развиваться не только как специалист, но и как лидер — строить команды, менторить джуниоров и влиять на стратегические решения компании.",
  },
]

const categories = ["Все", "Общие", "Мотивация", "Опыт", "Самоанализ", "Карьера"]

interface InterviewPrepProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InterviewPrep({ open, onOpenChange }: InterviewPrepProps) {
  const [activeCategory, setActiveCategory] = useState("Все")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredQuestions =
    activeCategory === "Все" ? interviewQuestions : interviewQuestions.filter((q) => q.category === activeCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-card-foreground">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Подготовка к собеседованию
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={activeCategory === cat ? "bg-blue-600 hover:bg-blue-700" : "bg-transparent"}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <Card key={q.id} className="bg-background border-border">
                <CardContent className="p-4">
                  <button className="w-full text-left" onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {q.category}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-card-foreground">{q.question}</h4>
                      </div>
                      {expandedId === q.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </button>

                  {expandedId === q.id && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <Lightbulb className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Совет</p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">{q.tip}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Target className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Пример ответа</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">{q.sampleAnswer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
