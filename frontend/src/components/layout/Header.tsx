"use client"

import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b border-border bg-white px-6",
        className
      )}
    >
      <button className="relative rounded-lg p-2 hover:bg-muted">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
      </button>

      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
        СБ
      </div>
    </header>
  )
}
