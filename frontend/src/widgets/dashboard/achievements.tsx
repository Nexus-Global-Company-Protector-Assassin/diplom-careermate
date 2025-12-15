"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Trophy, Star, Zap, Target, Award, Flame, Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"

interface Achievement {
  id: string
  name: string
  description: string
  icon: typeof Trophy
  unlocked: boolean
  progress?: number
  maxProgress?: number
  color: string
}

const achievements: Achievement[] = [
  {
    id: "1",
    name: "Первый шаг",
    description: "Создать первое резюме",
    icon: Star,
    unlocked: true,
    color: "text-yellow-500",
  },
  {
    id: "2",
    name: "Активный соискатель",
    description: "Отправить 10 откликов",
    icon: Zap,
    unlocked: true,
    color: "text-blue-500",
  },
  {
    id: "3",
    name: "Целеустремлённый",
    description: "Установить карьерную цель",
    icon: Target,
    unlocked: true,
    color: "text-green-500",
  },
  {
    id: "4",
    name: "Профессионал",
    description: "Заполнить профиль на 100%",
    icon: Award,
    unlocked: false,
    progress: 78,
    maxProgress: 100,
    color: "text-purple-500",
  },
  {
    id: "5",
    name: "На волне",
    description: "Получить 5 приглашений на интервью",
    icon: Flame,
    unlocked: false,
    progress: 2,
    maxProgress: 5,
    color: "text-orange-500",
  },
  {
    id: "6",
    name: "Мастер резюме",
    description: "Создать 3 разных резюме",
    icon: Trophy,
    unlocked: false,
    progress: 1,
    maxProgress: 3,
    color: "text-amber-500",
  },
]

export function Achievements() {
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Достижения
          </CardTitle>
          <Badge variant="secondary">
            {unlockedCount}/{achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {achievements.map((achievement) => (
              <Tooltip key={achievement.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                      achievement.unlocked
                        ? "border-border bg-gradient-to-b from-background to-muted hover:shadow-md"
                        : "border-border/50 bg-muted/30 opacity-60"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        achievement.unlocked ? "bg-gradient-to-br from-amber-100 to-amber-200" : "bg-muted"
                      }`}
                    >
                      {achievement.unlocked ? (
                        <achievement.icon className={`h-5 w-5 ${achievement.color}`} />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(achievement.progress / (achievement.maxProgress || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <p className="text-xs text-blue-500 mt-1">
                        {achievement.progress}/{achievement.maxProgress}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
