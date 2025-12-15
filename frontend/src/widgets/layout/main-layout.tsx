"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Footer } from "./footer"
import { AIChat } from "@/features/chat/ai-chat"
import { useSidebar } from "@/shared/context/sidebar-context"
import { cn } from "@/shared/lib/utils"
import { OnboardingModal } from "@/features/onboarding/onboarding-modal"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn("flex min-h-screen flex-col transition-all duration-300", isCollapsed ? "lg:ml-16" : "lg:ml-64")}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <Footer />
      </div>
      <AIChat />
      <OnboardingModal />
    </div>
  )
}
