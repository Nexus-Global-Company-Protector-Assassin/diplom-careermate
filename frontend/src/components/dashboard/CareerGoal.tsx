import { Target, Briefcase, MapPin, Banknote, Clock } from "lucide-react"
import { Badge } from "@/components/ui"

interface CareerGoalData {
  position: string
  location: string
  format: string
  salaryMin: number
  salaryMax: number
  experience: string
  updatedAt: string
}

interface CareerGoalProps {
  goal?: CareerGoalData
}

const defaultGoal: CareerGoalData = {
  position: "Senior Data Analyst",
  location: "Владивосток",
  format: "Удалённо",
  salaryMin: 250000,
  salaryMax: 300000,
  experience: "5+ лет в аналитике",
  updatedAt: "2 дня назад",
}

export function CareerGoal({ goal = defaultGoal }: CareerGoalProps) {
  const formatSalary = (value: number) =>
    new Intl.NumberFormat("ru-RU").format(value)

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
            <Target className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <span className="font-medium">Карьерная цель</span>
            <p className="text-xs text-muted-foreground">
              Обновленно {goal.updatedAt}
            </p>
          </div>
        </div>
        <Badge variant="success">Активная</Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Должность</p>
            <p className="font-medium">{goal.position}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Локация / Формат</p>
            <p className="font-medium">
              {goal.location} / {goal.format}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Целевая зарплата</p>
            <p className="font-medium">
              {formatSalary(goal.salaryMin)} - {formatSalary(goal.salaryMax)} ₽
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Опыт работы</p>
            <p className="font-medium">{goal.experience}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
