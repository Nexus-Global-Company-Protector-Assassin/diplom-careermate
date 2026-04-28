"use client"

import { Check, Lock, Sparkles, Zap, Brain, FileText, TrendingUp, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"

const FREE_FEATURES = [
  { icon: Brain,      label: "10 AI-запросов в день",                note: "сбрасывается ночью" },
  { icon: FileText,   label: "До 3 резюме в хранилище",              note: null },
  { icon: TrendingUp, label: "3 прохождения карьерного теста",       note: null },
  { icon: Zap,        label: "Анализ вакансий (Ghost Job Detection)", note: null },
  { icon: Zap,        label: "AI-подготовка к интервью",             note: null },
  { icon: Zap,        label: "Семантический поиск вакансий",         note: null },
  { icon: Zap,        label: "AI cover letter для вакансий",         note: null },
]

const PRO_FEATURES = [
  "Неограниченные AI-запросы",
  "До 20 резюме в хранилище",
  "Приоритетная очередь генерации",
  "Расширенная аналитика карьеры",
  "Персональный карьерный ассистент",
  "Экспорт в PDF с брендингом",
  "Ранний доступ к новым функциям",
  "Приоритетная поддержка",
]

function GreenCheck() {
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
    </div>
  )
}

function BlueCheck() {
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
      <Check className="h-3 w-3 text-blue-400" />
    </div>
  )
}

export function PricingContent() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <Badge
          variant="secondary"
          className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 px-3 py-1"
        >
          <Sparkles className="mr-1.5 h-3 w-3" />
          Тарифы CareerMate
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Выберите свой путь</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Начните бесплатно — все инструменты уже доступны. Pro открывает неограниченные возможности.
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Free plan */}
        <div className="rounded-2xl border bg-card p-6 flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Бесплатный</h2>
              <Badge variant="outline" className="text-xs">Текущий план</Badge>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-bold">0 ₽</span>
              <span className="text-muted-foreground text-sm">/ навсегда</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Всё необходимое для старта — AI-анализ вакансий, подготовка к интервью и карьерный тест.
            </p>
          </div>

          <ul className="space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-3">
                <GreenCheck />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{f.label}</span>
                  {f.note && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{f.note}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <Button variant="outline" className="w-full mt-auto" disabled>
            Текущий план
          </Button>
        </div>

        {/* Pro plan */}
        <div className="relative rounded-2xl overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-violet-500 to-blue-600 rounded-2xl" />
          <div className="relative m-px rounded-[15px] bg-slate-900 text-white flex flex-col gap-5 p-6">

            {/* Glow blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[15px]">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Pro
                </h2>
                <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Скоро
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold text-white/30">—</span>
                <span className="text-sm text-white/40">цена объявится при запуске</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Полный доступ без ограничений. Платёжная система в разработке — оставьте email и получите скидку первым.
              </p>
            </div>

            <ul className="relative space-y-3">
              {PRO_FEATURES.map((feat) => (
                <li key={feat} className="flex items-center gap-3">
                  <BlueCheck />
                  <span className="text-sm text-white/80">{feat}</span>
                </li>
              ))}
            </ul>

            <div className="relative mt-auto flex flex-col gap-2">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-blue-500/30"
              >
                Уведомить о запуске
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-[11px] text-white/40">
                Никакого спама — только одно письмо при запуске
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className="mt-8 rounded-xl border border-dashed bg-muted/30 p-5 flex items-start gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
          <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium">Pro-функции активно разрабатываются</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Мы работаем над платёжной системой и расширенными возможностями. Все ваши данные и прогресс
            сохранятся при переходе на Pro. Бесплатный план остаётся бесплатным навсегда.
          </p>
        </div>
      </div>
    </div>
  )
}
