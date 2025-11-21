import { Bot, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui"

interface Recommendation {
  id: string
  text: string
  action: string
  actionHref: string
}

interface AIRecommendationsProps {
  recommendation?: Recommendation
}

const defaultRecommendation: Recommendation = {
  id: "1",
  text: 'Рекомендую обновить раздел "Навыки" – появились новые тренды в аналитике данных. Добавьте Python, SQL и работу с визуализацией для повышения соответствия на 15%',
  action: "Обновить профиль",
  actionHref: "/profile/skills",
}

export function AIRecommendations({
  recommendation = defaultRecommendation,
}: AIRecommendationsProps) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <Bot className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold">
            Рекомендации от AI-ассистента
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {recommendation.text}
          </p>
          <Button size="sm">
            {recommendation.action}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
