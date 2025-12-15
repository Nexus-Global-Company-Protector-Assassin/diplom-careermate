"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, User, Briefcase, BarChart3, Settings, CreditCard, Sparkles } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/ui/command"

const pages = [
  { name: "Dashboard", href: "/", icon: BarChart3, description: "Главная страница" },
  { name: "Профиль", href: "/profile", icon: User, description: "Ваши данные" },
  { name: "Резюме", href: "/resume", icon: FileText, description: "Управление резюме" },
  { name: "Вакансии", href: "/vacancies", icon: Briefcase, description: "Поиск работы" },
  { name: "Аналитика", href: "/analytics", icon: BarChart3, description: "Статистика" },
  { name: "Настройки", href: "/settings", icon: Settings, description: "Настройки" },
  { name: "Тарифы", href: "/pricing", icon: CreditCard, description: "Планы подписки" },
]

const quickActions = [
  { name: "Создать резюме", action: "resume", icon: FileText },
  { name: "AI-подбор вакансий", action: "vacancies", icon: Sparkles },
  { name: "Обновить профиль", action: "profile", icon: User },
]

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors w-full max-w-[200px] sm:max-w-[280px]"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left truncate">Поиск...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Поиск по приложению..." />
        <CommandList>
          <CommandEmpty>Ничего не найдено.</CommandEmpty>
          <CommandGroup heading="Страницы">
            {pages.map((page) => (
              <CommandItem key={page.href} onSelect={() => handleSelect(page.href)}>
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{page.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Быстрые действия">
            {quickActions.map((action) => (
              <CommandItem key={action.action} onSelect={() => handleSelect(`/${action.action}`)}>
                <action.icon className="mr-2 h-4 w-4" />
                <span>{action.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
