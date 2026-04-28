"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  Sparkles,
  Lock,
  Zap,
  Brain,
  FileText,
  TrendingUp,
  X,
  ArrowRight,
  Clock,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface QuotaEvent {
  type: string
  message: string
  used: number
  limit: number
}

const QUOTA_LABELS: Record<string, { title: string; icon: React.ElementType; description: string }> = {
  ai_daily: {
    title: "Дневной лимит AI исчерпан",
    icon: Brain,
    description: "Вы использовали все AI-запросы на сегодня. Они обновляются каждую ночь.",
  },
  resumes: {
    title: "Лимит резюме исчерпан",
    icon: FileText,
    description: "На бесплатном плане можно хранить до 3 резюме. Удалите старое или переходите на Pro.",
  },
  quiz: {
    title: "Лимит карьерных тестов исчерпан",
    icon: TrendingUp,
    description: "На бесплатном плане доступно 3 прохождения карьерного теста.",
  },
}

const PRO_FEATURES = [
  "Неограниченные AI-запросы",
  "До 20 резюме в хранилище",
  "Приоритетная генерация резюме",
  "Расширенная аналитика карьеры",
  "Персональный карьерный ассистент",
  "Экспорт в PDF с брендингом",
]

export function UpgradeModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [event, setEvent] = useState<QuotaEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<QuotaEvent>).detail
      setEvent(detail)
      setOpen(true)
    }
    window.addEventListener("quota-exceeded", handler)
    return () => window.removeEventListener("quota-exceeded", handler)
  }, [])

  if (!event) return null

  const info = QUOTA_LABELS[event.type] ?? QUOTA_LABELS.ai_daily
  const Icon = info.icon
  const isAiDaily = event.type === "ai_daily"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-md border-0 overflow-hidden shadow-2xl">

        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 pt-8 pb-6 text-white">
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Glow blob */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Icon className="h-7 w-7 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{info.title}</h2>
              <p className="mt-1 text-sm text-white/60 leading-relaxed">{info.description}</p>
            </div>

            {/* Usage pill */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/70">
              <span>Использовано:</span>
              <span className="font-semibold text-white">{event.used}</span>
              <span>/</span>
              <span>{event.limit}</span>
              {isAiDaily && (
                <>
                  <span className="mx-1 text-white/30">·</span>
                  <Clock className="h-3 w-3" />
                  <span>сбрасывается ночью</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pro teaser */}
        <div className="bg-background px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">CareerMate Pro — скоро</span>
            <Badge
              variant="secondary"
              className="ml-auto text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0"
            >
              В разработке
            </Badge>
          </div>

          <ul className="space-y-2">
            {PRO_FEATURES.map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Zap className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                </div>
                {feat}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-blue-500/20 border-0"
              onClick={() => { setOpen(false); router.push("/pricing") }}
            >
              Узнать подробнее
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground h-8 text-xs" onClick={() => setOpen(false)}>
              Продолжить с бесплатным планом
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
