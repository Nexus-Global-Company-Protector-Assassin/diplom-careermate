"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/shared/lib/utils"
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  BarChart3,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { useSidebar } from "@/shared/context/sidebar-context"
import { Button } from "@/shared/ui/button"
import { BebsichLogo } from "@/shared/assets/bebsich-logo"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/resume", label: "Резюме", icon: FileText },
  { href: "/vacancies", label: "Вакансии", icon: Briefcase },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
  { href: "/pricing", label: "Тарифы", icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar()

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobile} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              "flex items-center border-b border-sidebar-border px-4 py-4",
              isCollapsed ? "justify-center" : "justify-between",
            )}
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 shrink-0 overflow-hidden">
                <BebsichLogo className="h-7 w-7" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold text-sidebar-foreground">
                  Career<span className="text-blue-600">Mate</span>
                </span>
              )}
            </Link>

            {/* Mobile close button */}
            <Button variant="ghost" size="icon" onClick={closeMobile} className="lg:hidden h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && item.label}
                </Link>
              )
            })}
          </nav>

          {/* Collapse button - desktop only */}
          <div className="hidden lg:block border-t border-sidebar-border p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className={cn(
                "w-full justify-center text-muted-foreground hover:text-foreground",
                !isCollapsed && "justify-start px-3",
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Свернуть
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
