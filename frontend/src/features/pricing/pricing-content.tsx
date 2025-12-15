"use client"

import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Check, Zap, Crown, Rocket, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/shared/lib/utils"

const plans = [
  {
    id: "free",
    name: "Бесплатный",
    description: "Для начала карьерного пути",
    price: 0,
    period: "навсегда",
    icon: Zap,
    color: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    buttonVariant: "outline" as const,
    features: ["1 резюме", "Базовый поиск вакансий", "5 откликов в месяц", "Базовая аналитика", "Email-поддержка"],
    limitations: ["Нет AI-рекомендаций", "Нет приоритетной поддержки"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Для активного поиска работы",
    price: 990,
    period: "в месяц",
    icon: Crown,
    color: "bg-blue-600",
    iconColor: "text-white",
    popular: true,
    buttonVariant: "default" as const,
    features: [
      "Неограниченное количество резюме",
      "AI-анализ вакансий",
      "Неограниченные отклики",
      "Расширенная аналитика",
      "Персональный карьерный коуч",
      "Приоритетная поддержка",
      "LinkedIn интеграция",
      "HeadHunter интеграция",
    ],
    limitations: [],
  },
  {
    id: "business",
    name: "Business",
    description: "Для команд и рекрутеров",
    price: 4990,
    period: "в месяц",
    icon: Rocket,
    color: "bg-gradient-to-br from-indigo-600 to-purple-600",
    iconColor: "text-white",
    buttonVariant: "outline" as const,
    features: [
      "Всё из Pro тарифа",
      "До 10 пользователей",
      "Командная аналитика",
      "API доступ",
      "Белая метка",
      "Персональный менеджер",
      "SLA 99.9%",
      "Обучение команды",
    ],
    limitations: [],
  },
]

const yearlyDiscount = 20

export function PricingContent() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const getPrice = (price: number) => {
    if (price === 0) return 0
    if (billingPeriod === "yearly") {
      return Math.round(price * 12 * (1 - yearlyDiscount / 100))
    }
    return price
  }

  const getPeriodLabel = (price: number) => {
    if (price === 0) return "навсегда"
    return billingPeriod === "yearly" ? "в год" : "в месяц"
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Выберите тариф</h1>
          <p className="text-muted-foreground">Найдите подходящий план для ваших целей</p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-muted p-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              billingPeriod === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Ежемесячно
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              billingPeriod === "yearly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Ежегодно
          </button>
        </div>
        {billingPeriod === "yearly" && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            -{yearlyDiscount}% скидка
          </Badge>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer",
              selectedPlan === plan.id && "ring-2 ring-blue-600",
              plan.popular && "border-blue-600 border-2",
            )}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0">
                <Badge className="rounded-none rounded-bl-lg bg-blue-600 text-white">Популярный</Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", plan.color)}>
                  <plan.icon className={cn("h-6 w-6", plan.iconColor)} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{getPrice(plan.price).toLocaleString("ru-RU")} ₽</span>
                <span className="text-muted-foreground">/{getPeriodLabel(plan.price)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant={plan.buttonVariant}
                className={cn("w-full", plan.popular && "bg-blue-600 hover:bg-blue-700 text-white")}
              >
                {plan.id === "free" ? "Текущий план" : "Выбрать план"}
              </Button>

              <div className="space-y-3">
                <p className="text-sm font-medium">Включено:</p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {plan.limitations.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Ограничения:</p>
                  {plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 shrink-0" />
                      <span>{limitation}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ or Additional Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 shrink-0">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Нужна помощь с выбором?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Наша команда поможет подобрать оптимальный тариф для ваших задач. Свяжитесь с нами для бесплатной
                консультации.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Связаться с поддержкой
                </Button>
                <Button variant="ghost" size="sm">
                  Сравнить тарифы
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Comparison Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Сравнение возможностей</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Функция</th>
                  <th className="text-center py-3 px-4 font-medium">Бесплатный</th>
                  <th className="text-center py-3 px-4 font-medium bg-blue-50 dark:bg-blue-950">Pro</th>
                  <th className="text-center py-3 px-4 font-medium">Business</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Резюме", free: "1", pro: "∞", business: "∞" },
                  { feature: "Отклики в месяц", free: "5", pro: "∞", business: "∞" },
                  { feature: "AI-рекомендации", free: false, pro: true, business: true },
                  { feature: "Карьерный коуч", free: false, pro: true, business: true },
                  { feature: "Аналитика", free: "Базовая", pro: "Расширенная", business: "Командная" },
                  { feature: "Интеграции", free: false, pro: true, business: true },
                  { feature: "API доступ", free: false, pro: false, business: true },
                  { feature: "Поддержка", free: "Email", pro: "Приоритетная", business: "24/7" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 px-4">{row.feature}</td>
                    <td className="text-center py-3 px-4">
                      {typeof row.free === "boolean" ? (
                        row.free ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="text-center py-3 px-4 bg-blue-50 dark:bg-blue-950">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        row.pro
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.business === "boolean" ? (
                        row.business ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        row.business
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
