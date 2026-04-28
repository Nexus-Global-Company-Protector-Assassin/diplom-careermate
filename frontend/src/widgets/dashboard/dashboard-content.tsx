"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import Link from "next/link"
import {
  FileText,
  Mail,
  Search,
  BarChart3,
  Target,
  MapPin,
  DollarSign,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Edit,
} from "lucide-react"
import { InterviewTracker } from "@/widgets/dashboard/interview-tracker"
import { ProfileCompletion } from "@/widgets/dashboard/profile-completion"
import { Achievements } from "@/widgets/dashboard/achievements"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useWeeklyAnalytics, useDashboardSummary, analyticsKeys } from "./api/use-analytics"
import { useProfile, useUpdateProfile } from "@/features/profile/api/use-profile"
import { useQueryClient } from "@tanstack/react-query"

const quickActions = [
  { icon: FileText, label: "Создать резюме", color: "bg-blue-500/10 text-blue-600", href: "/resume" },
  { icon: Mail, label: "Написать письмо", color: "bg-emerald-500/10 text-emerald-600", href: "/resume" },
  { icon: Search, label: "Посмотреть вакансии", color: "bg-pink-500/10 text-pink-600", href: "/vacancies" },
  { icon: BarChart3, label: "Отчет по откликам", color: "bg-cyan-500/10 text-cyan-600", href: "/analytics" },
]

interface CareerGoal {
  position: string
  location: string
  salary: string
  experience: string
}

export function DashboardContent() {
  const { data: analyticsStats } = useWeeklyAnalytics()
  const { data: dashboard } = useDashboardSummary()
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()
  const queryClient = useQueryClient()

  const defaultGoal: CareerGoal = {
    position: "Не указана",
    location: "Не указана",
    salary: "Не указана",
    experience: "Не указан",
  }

  const [careerGoal, setCareerGoal] = useState<CareerGoal>(defaultGoal)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [tempGoal, setTempGoal] = useState<CareerGoal>(defaultGoal)
  const [isSavingGoal, setIsSavingGoal] = useState(false)

  // Sync career goal from backend data
  useEffect(() => {
    if (dashboard?.careerGoal) {
      setCareerGoal(dashboard.careerGoal)
    }
  }, [dashboard])

  const saveGoal = async () => {
    setIsSavingGoal(true)
    try {
      const salaryNum = parseInt(tempGoal.salary.replace(/\D/g, "")) || undefined
      const expNum = parseInt(tempGoal.experience) || undefined
      await updateProfile({
        ...profile,
        desiredPosition: tempGoal.position !== "Не указана" ? tempGoal.position : profile?.desiredPosition,
        location: tempGoal.location !== "Не указана" ? tempGoal.location : profile?.location,
        desiredSalaryMin: salaryNum ?? profile?.desiredSalaryMin,
        experienceYears: expNum ?? profile?.experienceYears,
      })
      setCareerGoal(tempGoal)
      await queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard() })
    } finally {
      setIsSavingGoal(false)
      setGoalModalOpen(false)
    }
  }

  const openGoalModal = () => {
    setTempGoal(careerGoal)
    setGoalModalOpen(true)
  }

  const userName = dashboard?.fullName || "Пользователь"
  const careerProgress = dashboard?.careerProgress || [
    { label: "Анализ завершен", done: false },
    { label: "Резюме готово", done: false },
    { label: "Отклики идут", done: false },
    { label: "Приглашения", done: false },
  ]

  const doneCount = careerProgress.filter((s) => s.done).length
  const progressPercent = Math.round((doneCount / careerProgress.length) * 100)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shrink-0">
          <div className="text-2xl sm:text-3xl">🤖</div>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Привет, {userName}!</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Вы ещё на шаг ближе к работе своей мечты!</p>
        </div>
      </div>

      {/* Career Progress */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-6 sm:mb-8 text-card-foreground">Карьерный прогресс</h2>
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1.5 bg-muted rounded-full" />
            <div
              className="absolute top-5 left-0 h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 shadow-sm shadow-blue-500/50"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="relative flex justify-between">
              {careerProgress.map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all duration-300 ${
                      step.done
                        ? "bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/40"
                        : "border-2 border-muted bg-card text-muted-foreground"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-muted" />
                    )}
                  </div>
                  <span
                    className={`mt-2 sm:mt-3 text-[10px] sm:text-xs text-center max-w-[60px] sm:max-w-[80px] leading-tight ${
                      step.done
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Achievements dashboardData={dashboard} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4 text-card-foreground">Быстрые действия</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {quickActions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <button className="w-full flex flex-col items-center gap-2 sm:gap-3 rounded-xl border border-border p-4 sm:p-6 hover:bg-accent hover:border-blue-300 transition-all duration-200 hover:shadow-md">
                      <div
                        className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${action.color}`}
                      >
                        <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-card-foreground text-center">
                        {action.label}
                      </span>
                    </button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Career Goal */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">Карьерная цель</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full font-medium">
                  Активная
                </span>
                <Button variant="ghost" size="icon" onClick={openGoalModal} className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Из вашего профиля</p>
            <div className="space-y-3 sm:space-y-4">
              {[
                { icon: Target, label: "Должность", value: careerGoal.position },
                { icon: MapPin, label: "Локация / Формат", value: careerGoal.location },
                { icon: DollarSign, label: "Целевая зарплата", value: careerGoal.salary },
                { icon: Briefcase, label: "Опыт работы", value: careerGoal.experience },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <item.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-card-foreground truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <InterviewTracker />
        <ProfileCompletion dashboardData={dashboard} />
      </div>

      {/* Weekly Report */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4 sm:mb-6 text-card-foreground">Отчёт за неделю</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {(analyticsStats || [
              { icon: "📋", value: "0", label: "Новые вакансии" },
              { icon: "🗓️", value: "0", label: "Интервью назначено" },
              { icon: "📧", value: "0", label: "Откликов отправлено" },
              { icon: "🤖", value: "0", label: "Рекомендации ИИ" },
            ]).map((stat: any, i: number) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl mb-2">{stat.icon}</div>
                <p className="text-xl sm:text-2xl font-bold text-card-foreground">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Рекомендации от AI-ассистента</h3>
              <p className="text-sm text-slate-300 mb-4">
                Рекомендую обновить раздел &quot;Навыки&quot; — появились новые тренды в аналитике данных. Добавьте Python, SQL и
                работу с облачными сервисами для повышения конкурентоспособности на 30%.
              </p>
              <Link href="/profile">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">Обновить профиль →</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Goal Modal */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Редактировать карьерную цель</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-card-foreground">Желаемая должность</Label>
              <Input
                value={tempGoal.position}
                onChange={(e) => setTempGoal({ ...tempGoal, position: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Локация / Формат</Label>
              <Input
                value={tempGoal.location}
                onChange={(e) => setTempGoal({ ...tempGoal, location: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Целевая зарплата</Label>
              <Input
                value={tempGoal.salary}
                onChange={(e) => setTempGoal({ ...tempGoal, salary: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Опыт работы</Label>
              <Input
                value={tempGoal.experience}
                onChange={(e) => setTempGoal({ ...tempGoal, experience: e.target.value })}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalModalOpen(false)} className="bg-transparent border-border">
              Отмена
            </Button>
            <Button onClick={saveGoal} className="bg-blue-600 hover:bg-blue-700" disabled={isSavingGoal}>
              {isSavingGoal ? "Сохраняем..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
