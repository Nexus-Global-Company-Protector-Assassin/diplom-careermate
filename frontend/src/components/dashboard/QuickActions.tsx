import Link from "next/link"
import { FileText, Mail, Search, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickAction {
  id: string
  title: string
  href: string
  icon: React.ElementType
  color: string
  bgColor: string
}

const actions: QuickAction[] = [
  {
    id: "resume",
    title: "Создать резюме",
    href: "/resume/create",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "letter",
    title: "Написать письмо",
    href: "/cover-letter",
    icon: Mail,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "vacancies",
    title: "Посмотреть вакансии",
    href: "/vacancies",
    icon: Search,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: "report",
    title: "Отчет по откликам",
    href: "/analytics/applications",
    icon: BarChart3,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
]

export function QuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Быстрые действия</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl",
                action.bgColor
              )}
            >
              <action.icon className={cn("h-7 w-7", action.color)} />
            </div>
            <span className="text-sm font-medium text-foreground">
              {action.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
