import { TrendingUp, Calendar, MessageSquare, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatItem {
  id: string
  label: string
  value: number
  icon: React.ElementType
  color: string
}

interface WeeklyReportProps {
  stats?: StatItem[]
}

const defaultStats: StatItem[] = [
  {
    id: "vacancies",
    label: "Новые вакансии",
    value: 5,
    icon: TrendingUp,
    color: "text-blue-600",
  },
  {
    id: "interviews",
    label: "Интервью назначено",
    value: 2,
    icon: Calendar,
    color: "text-green-600",
  },
  {
    id: "applications",
    label: "Откликов отправлено",
    value: 8,
    icon: MessageSquare,
    color: "text-orange-600",
  },
  {
    id: "recommendations",
    label: "Рекомендации ИИ",
    value: 1,
    icon: Lightbulb,
    color: "text-purple-600",
  },
]

export function WeeklyReport({ stats = defaultStats }: WeeklyReportProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold">Отчёт за неделю</h2>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.id} className="flex flex-col items-center gap-2">
            <stat.icon className={cn("h-6 w-6", stat.color)} />
            <span className="text-2xl font-bold">{stat.value}</span>
            <span className="text-center text-sm text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
