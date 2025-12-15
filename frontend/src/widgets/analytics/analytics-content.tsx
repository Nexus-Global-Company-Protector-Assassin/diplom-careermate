"use client"

import { useState } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { TrendingUp, TrendingDown, Lightbulb, Code, Clock, Eye } from "lucide-react"
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

type Period = "week" | "month" | "quarter" | "year"

const periodTabs: { key: Period; label: string }[] = [
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "quarter", label: "Квартал" },
  { key: "year", label: "Год" },
]

const activityDataByPeriod: Record<Period, { name: string; отклики: number; приглашения: number }[]> = {
  week: [
    { name: "Пн", отклики: 2, приглашения: 0 },
    { name: "Вт", отклики: 4, приглашения: 1 },
    { name: "Ср", отклики: 3, приглашения: 2 },
    { name: "Чт", отклики: 5, приглашения: 2 },
    { name: "Пт", отклики: 6, приглашения: 3 },
    { name: "Сб", отклики: 2, приглашения: 1 },
    { name: "Вс", отклики: 1, приглашения: 0 },
  ],
  month: [
    { name: "1 нед", отклики: 12, приглашения: 3 },
    { name: "2 нед", отклики: 18, приглашения: 5 },
    { name: "3 нед", отклики: 15, приглашения: 4 },
    { name: "4 нед", отклики: 22, приглашения: 8 },
  ],
  quarter: [
    { name: "Янв", отклики: 45, приглашения: 12 },
    { name: "Фев", отклики: 52, приглашения: 15 },
    { name: "Мар", отклики: 68, приглашения: 20 },
  ],
  year: [
    { name: "Q1", отклики: 165, приглашения: 47 },
    { name: "Q2", отклики: 198, приглашения: 58 },
    { name: "Q3", отклики: 220, приглашения: 72 },
    { name: "Q4", отклики: 180, приглашения: 55 },
  ],
}

const statsCardsByPeriod: Record<Period, { value: string; label: string; change: string; positive: boolean }[]> = {
  week: [
    { value: "24", label: "Отправлено откликов", change: "+8 за последние 24 часа", positive: true },
    { value: "42%", label: "Коэффициент ответов", change: "+3% за прошлые 24 часа", positive: true },
    { value: "12", label: "Приглашение на интервью", change: "+2 за последние 24 часа", positive: true },
    { value: "78%", label: "Оптимизация профиля", change: "-8% за последние 24 часа", positive: false },
  ],
  month: [
    { value: "67", label: "Отправлено откликов", change: "+15 за последнюю неделю", positive: true },
    { value: "48%", label: "Коэффициент ответов", change: "+6% за прошлый месяц", positive: true },
    { value: "28", label: "Приглашение на интервью", change: "+8 за последнюю неделю", positive: true },
    { value: "82%", label: "Оптимизация профиля", change: "+4% за прошлый месяц", positive: true },
  ],
  quarter: [
    { value: "165", label: "Отправлено откликов", change: "+45 за последний месяц", positive: true },
    { value: "52%", label: "Коэффициент ответов", change: "+10% за квартал", positive: true },
    { value: "47", label: "Приглашение на интервью", change: "+12 за последний месяц", positive: true },
    { value: "85%", label: "Оптимизация профиля", change: "+7% за квартал", positive: true },
  ],
  year: [
    { value: "763", label: "Отправлено откликов", change: "+180 за последний квартал", positive: true },
    { value: "55%", label: "Коэффициент ответов", change: "+13% за год", positive: true },
    { value: "232", label: "Приглашение на интервью", change: "+55 за последний квартал", positive: true },
    { value: "92%", label: "Оптимизация профиля", change: "+14% за год", positive: true },
  ],
}

const statusData = [
  { name: "Новые", value: 30, color: "#22c55e" },
  { name: "Рассматриваются", value: 25, color: "#3b82f6" },
  { name: "Приглашения", value: 20, color: "#f59e0b" },
  { name: "Отклонено", value: 25, color: "#ef4444" },
]

const tips = [
  {
    icon: Lightbulb,
    text: "Увеличьте отклики в FinTech — там высокий спрос на Data Analyst",
    color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30",
  },
  {
    icon: Code,
    text: "Добавьте Python и SQL, включительные слова — это повысит отклики на 23%",
    color: "text-green-600 bg-green-50 dark:bg-green-900/30",
  },
  {
    icon: Clock,
    text: "Лучшее время для откликов — вторник 10:00 - 12:00",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
  },
  {
    icon: Eye,
    text: "Ваше резюме чаще просматривают рекрутеры из банковской сферы",
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
  },
]

const platformData = [
  { name: "HeadHunter", views: 45, responses: 6, effectiveness: "75%" },
  { name: "LinkedIn", views: 32, responses: 4, effectiveness: "62%" },
  { name: "Хабр Карьера", views: 18, responses: 1, effectiveness: "45%" },
]

export function AnalyticsContent() {
  const [activePeriod, setActivePeriod] = useState<Period>("week")

  const currentStats = statsCardsByPeriod[activePeriod]
  const currentActivityData = activityDataByPeriod[activePeriod]

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

      {/* Tips and Platform Effectiveness */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
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

        {/* Platform Effectiveness */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-card-foreground">Эффективность по платформам</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px]">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b border-border">
                    <th className="pb-3 font-medium">Платформа</th>
                    <th className="pb-3 font-medium">Просмотры</th>
                    <th className="pb-3 font-medium">Отклики</th>
                    <th className="pb-3 font-medium">Эффективность</th>
                  </tr>
                </thead>
                <tbody>
                  {platformData.map((platform, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3 text-sm text-card-foreground">{platform.name}</td>
                      <td className="py-3 text-sm text-card-foreground">{platform.views}</td>
                      <td className="py-3 text-sm text-card-foreground">{platform.responses}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-12 sm:w-16 rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: platform.effectiveness }} />
                          </div>
                          <span className="text-sm text-card-foreground">{platform.effectiveness}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
