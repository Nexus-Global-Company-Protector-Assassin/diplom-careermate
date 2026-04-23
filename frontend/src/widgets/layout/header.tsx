"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, Menu, User, Settings, LogOut, CreditCard, MessageSquare, FileEdit } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Avatar, AvatarFallback } from "@/shared/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { useSidebar } from "@/shared/context/sidebar-context"
import { cn } from "@/shared/lib/utils"
import { SearchCommand } from "@/widgets/header/search-command"
import { InterviewPrep } from "@/features/interview/interview-prep"
import { CoverLetterGenerator } from "@/features/resume/cover-letter-generator"
import { KeyboardShortcuts } from "@/features/help/keyboard-shortcuts"
import { useLogout } from "@/features/auth/api/use-auth"

const notifications = [
  {
    id: "1",
    title: "Новый отклик",
    description: "Компания Yandex просмотрела ваше резюме",
    time: "5 мин назад",
    read: false,
  },
  {
    id: "2",
    title: "Приглашение на интервью",
    description: "Sber приглашает вас на собеседование",
    time: "1 час назад",
    read: false,
  },
  {
    id: "3",
    title: "Рекомендация AI",
    description: "Обновите навыки в профиле для лучших результатов",
    time: "2 часа назад",
    read: true,
  },
  {
    id: "4",
    title: "Новая вакансия",
    description: "Найдена вакансия с 95% совместимостью",
    time: "3 часа назад",
    read: false,
  },
]

export function Header() {
  const { toggleMobile } = useSidebar()
  const logout = useLogout()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsList, setNotificationsList] = useState(notifications)
  const [interviewPrepOpen, setInterviewPrepOpen] = useState(false)
  const [coverLetterOpen, setCoverLetterOpen] = useState(false)

  const unreadCount = notificationsList.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotificationsList(notificationsList.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotificationsList(notificationsList.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobile}
          className="lg:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex justify-center lg:justify-start">
          <SearchCommand />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <KeyboardShortcuts />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInterviewPrepOpen(true)}
            className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Подготовка к собеседованию"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCoverLetterOpen(true)}
            className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Генератор письма"
          >
            <FileEdit className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="relative text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-[10px] font-medium text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Уведомления</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Прочитать все
                  </Button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsList.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-900/10",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 rounded-full shrink-0",
                        notification.read ? "bg-transparent" : "bg-blue-500",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-2">
                <Button
                  variant="ghost"
                  className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Показать все уведомления
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-blue-500/20"
              >
                <Avatar className="h-9 w-9 bg-gradient-to-br from-emerald-400 to-emerald-600">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-sm font-medium">
                    СБ
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-foreground">Сергей Баранов</p>
                  <p className="text-xs text-muted-foreground">oldersik@gmail.ru</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Профиль</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Настройки</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/pricing" className="flex items-center cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Тарифы</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout.mutate()} className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Modals */}
      <InterviewPrep open={interviewPrepOpen} onOpenChange={setInterviewPrepOpen} />
      <CoverLetterGenerator open={coverLetterOpen} onOpenChange={setCoverLetterOpen} />
    </>
  )
}
