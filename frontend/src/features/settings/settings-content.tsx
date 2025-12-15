"use client"

import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { Bell, Shield, Palette, Link2, Check, Bot, Crown, Linkedin } from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/shared/context/theme-context"
import Link from "next/link"

export function SettingsContent() {
  const { settings: themeSettings, toggleCompactMode, toggleLargeFont } = useTheme()

  const [notifications, setNotifications] = useState({
    email: false,
    push: true,
    sms: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    dataProcessing: false,
    searchStatus: true,
  })

  const [darkThemeEnabled] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Настройки</h1>

      {/* Pro Plan Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Тариф Pro</h2>
          </div>
          <p className="text-blue-100 mb-4 text-sm sm:text-base">Расширенные возможности для вашего карьерного роста</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0" /> Неограниченное количество резюме
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0" /> AI-анализ вакансий
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0" /> Персональный карьерный коуч
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0" /> Приоритетная поддержка
            </div>
          </div>
          <Link href="/pricing">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900">Управление подпиской</Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">Уведомления</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">Email-уведомления</p>
                  <p className="text-sm text-muted-foreground truncate">Новые вакансии и обновления</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">Push-уведомления</p>
                  <p className="text-sm text-muted-foreground truncate">Мгновенные уведомления в браузере</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">SMS-оповещения</p>
                  <p className="text-sm text-muted-foreground truncate">Срочные уведомления</p>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">Конфиденциальность</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">Видимость профиля</p>
                  <p className="text-sm text-muted-foreground truncate">Показывать мой профиль в списке</p>
                </div>
                <Switch
                  checked={privacy.profileVisibility}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, profileVisibility: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">Обработка данных</p>
                  <p className="text-sm text-muted-foreground truncate">Разрешить улучшение сервиса</p>
                </div>
                <Switch
                  checked={privacy.dataProcessing}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, dataProcessing: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">Показывать статус поиска</p>
                  <p className="text-sm text-muted-foreground truncate">Отображать, что я активно ищу работу</p>
                </div>
                <Switch
                  checked={privacy.searchStatus}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, searchStatus: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                <Palette className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">Внешний вид</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 opacity-50">
                <div className="min-w-0">
                  <p className="font-medium">Тёмная тема</p>
                  <p className="text-sm text-muted-foreground truncate">Скоро будет доступно</p>
                </div>
                <Switch checked={darkThemeEnabled} disabled />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">Компактный режим</p>
                  <p className="text-sm text-muted-foreground truncate">Уменьшить отступы интерфейса</p>
                </div>
                <Switch checked={themeSettings.compactMode} onCheckedChange={toggleCompactMode} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">Большой шрифт</p>
                  <p className="text-sm text-muted-foreground truncate">Увеличить размер текста</p>
                </div>
                <Switch checked={themeSettings.largeFont} onCheckedChange={toggleLargeFont} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                <Link2 className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">Интеграции</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Linkedin className="h-5 w-5 text-blue-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">LinkedIn</p>
                    <p className="text-sm text-muted-foreground truncate">Подключено</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 shrink-0">
                  Подключить
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Bot className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">HeadHunter</p>
                    <p className="text-sm text-muted-foreground truncate">Не подключено</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-transparent shrink-0">
                  Управление
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-5 w-5 rounded bg-gradient-to-br from-blue-500 to-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">Google календарь</p>
                    <p className="text-sm text-muted-foreground truncate">Не подключено</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-transparent shrink-0">
                  Настроить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
