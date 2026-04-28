"use client"

import { useState } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { TrendingUp, TrendingDown, Lightbulb, Code, Clock, Eye, Rocket } from "lucide-react"
import { CareerQuizModal } from "@/features/analytics/career-quiz-modal"
import { CareerPathResult } from "@/features/analytics/career-path-result"
import { useLatestAssessment } from "@/features/analytics/api/use-career-assessment"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts"
import { SalaryComparison } from "@/widgets/analytics/salary-comparison"
import { useAnalyticsStats } from "./api/use-analytics-stats"

type Period = "week" | "month" | "quarter" | "year"

const periodTabs: { key: Period; label: string }[] = [
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "quarter", label: "Квартал" },
  { key: "year", label: "Год" },
]

const tips = [
  {
    icon: Lightbulb,
    text: "Увеличьте отклики в FinTech — там высокий спрос на специалистов",
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30",
  },
  {
    icon: Code,
    text: "Добавьте актуальные навыки в профиль — это повысит видимость вашего резюме",
    color: "text-green-600 bg-green-50 dark:bg-green-900/30",
  },
  {
    icon: Clock,
    text: "Лучшее время для откликов — вторник 10:00 - 12:00",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
  },
  {
    icon: Eye,
    text: "Заполните профиль полностью, чтобы рекрутеры чаще находили вас",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
  },
]

export function AnalyticsContent() {
  const [activePeriod, setActivePeriod] = useState<Period>("week")
  const { data: statsData, isLoading } = useAnalyticsStats(activePeriod)
  const { data: latestAssessment } = useLatestAssessment()
  const [quizOpen, setQuizOpen] = useState(false)

  const currentStats = statsData?.statsCards || [
    { value: "0", label: "Отправлено откликов", change: "Нет данных", positive: true },
    { value: "0%", label: "Коэффициент ответов", change: "Нет данных", positive: true },
    { value: "0", label: "Приглашение на интервью", change: "Нет данных", positive: true },
    { value: "0%", label: "Оптимизация профиля", change: "Нет данных", positive: false },
  ]

  const currentActivityData = statsData?.activityData || []
  const statusData = statsData?.statusData || [{ name: "Нет данных", value: 1, color: "#94a3b8" }]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Анализ карьеры</h1>
        <div className="flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
          {periodTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activePeriod === tab.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setActivePeriod(tab.key)}
              className={`whitespace-nowrap ${activePeriod === tab.key ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {currentStats.map((stat, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              <p
                className={`text-[10px] sm:text-xs mt-1 flex items-center gap-1 ${stat.positive ? "text-green-600" : "text-red-500"}`}
              >
                {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className="truncate">{stat.change}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-card-foreground">Активность по дням</h2>
            <div className="flex gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-card-foreground">Отклики</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-cyan-400" />
                <span className="text-card-foreground">Приглашения</span>
              </div>
            </div>
            {currentActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={currentActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="отклики" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="приглашения" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                {isLoading ? "Загрузка..." : "Нет данных за выбранный период"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Chart */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-card-foreground">Статус откликов</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SalaryComparison />

      {/* Tips */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-1">
        {/* AI Tips */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Рекомендации AI</h2>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-white/10 p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${tip.color}`}>
                    <tip.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm flex-1">{tip.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Career Paths */}
      {latestAssessment ? (
        <CareerPathResult
          assessment={latestAssessment}
          onRetake={() => setQuizOpen(true)}
        />
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <Rocket className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="text-base font-semibold text-foreground">Карьерные пути</h2>
              <p className="text-sm text-muted-foreground">
                Пройдите тест из 10 вопросов — AI определит лучшие карьерные пути и построит детальный роадмап роста.
              </p>
            </div>
            <Button
              onClick={() => setQuizOpen(true)}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Пройти тест
            </Button>
          </CardContent>
        </Card>
      )}

      <CareerQuizModal
        open={quizOpen}
        onOpenChange={setQuizOpen}
        onComplete={() => setQuizOpen(false)}
      />
    </div>
  )
}
