"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useDashboardSummary } from "@/widgets/dashboard/api/use-analytics"

export function SalaryComparison() {
  const { data: dashboard } = useDashboardSummary()

  const salaryData = dashboard?.salaryData || {
    position: "Не указана",
    yourSalary: 0,
    marketAvg: 200000,
    marketMin: 100000,
    marketMax: 350000,
    vacanciesInRange: 0,
  }

  const percentDiff = salaryData.marketAvg > 0
    ? Math.round(((salaryData.yourSalary - salaryData.marketAvg) / salaryData.marketAvg) * 100)
    : 0

  const range = salaryData.marketMax - salaryData.marketMin
  const yourPosition = range > 0
    ? Math.max(0, Math.min(100, ((salaryData.yourSalary - salaryData.marketMin) / range) * 100))
    : 50

  const formatSalary = (amount: number) => {
    if (amount === 0) return "Не указана"
    return new Intl.NumberFormat("ru-RU").format(amount) + " ₽"
  }

  const getEvaluation = () => {
    if (percentDiff > 10) return { text: "Отлично", color: "text-green-600" }
    if (percentDiff >= -5) return { text: "Хорошо", color: "text-green-600" }
    if (percentDiff >= -15) return { text: "Средне", color: "text-yellow-600" }
    return { text: "Ниже рынка", color: "text-red-600" }
  }

  const evaluation = getEvaluation()

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-card-foreground">Сравнение зарплаты с рынком</CardTitle>
        <p className="text-sm text-muted-foreground">{salaryData.position}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Your salary vs market */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Ваша целевая зарплата</p>
            <p className="text-2xl font-bold text-card-foreground">{formatSalary(salaryData.yourSalary)}</p>
          </div>
          <Badge
            className={`${
              percentDiff > 0
                ? "bg-green-100 text-green-700"
                : percentDiff < 0
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
            }`}
          >
            {percentDiff > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : percentDiff < 0 ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <Minus className="h-3 w-3 mr-1" />
            )}
            {percentDiff > 0 ? "+" : ""}
            {percentDiff}% от рынка
          </Badge>
        </div>

        {/* Market range visualization */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Мин: {formatSalary(salaryData.marketMin)}</span>
            <span>Средняя: {formatSalary(salaryData.marketAvg)}</span>
            <span>Макс: {formatSalary(salaryData.marketMax)}</span>
          </div>
          <div className="relative h-3 rounded-full bg-gradient-to-r from-red-200 via-yellow-200 to-green-200">
            {/* Market average marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-500"
              style={{
                left: `${range > 0 ? ((salaryData.marketAvg - salaryData.marketMin) / range) * 100 : 50}%`,
              }}
            />
            {/* Your salary marker */}
            <div
              className="absolute -top-1 w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center"
              style={{ left: `calc(${yourPosition}% - 10px)` }}
            >
              <span className="text-[8px] text-white font-bold">Вы</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold text-card-foreground">
              {Math.round(yourPosition)}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <p className="text-xs text-muted-foreground">Ваш перцентиль</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold text-card-foreground">{salaryData.vacanciesInRange}</p>
            <p className="text-xs text-muted-foreground">Вакансий в диапазоне</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className={`text-lg font-bold ${evaluation.color}`}>{evaluation.text}</p>
            <p className="text-xs text-muted-foreground">Оценка</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
