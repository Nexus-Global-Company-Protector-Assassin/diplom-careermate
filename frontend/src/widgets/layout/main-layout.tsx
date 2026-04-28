"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Footer } from "./footer"
import { AIChat } from "@/features/chat/ai-chat"
import { useSidebar } from "@/shared/context/sidebar-context"
import { cn } from "@/shared/lib/utils"
import { OnboardingModal } from "@/features/onboarding/onboarding-modal"
import { UpgradeModal } from "@/features/quota/upgrade-modal"
import { Button } from "@/shared/ui/button"
import { AlertCircle, X } from "lucide-react"
import { useProfile } from "@/features/profile/api/use-profile"
import { getProfileCompleteness } from "@/features/profile/utils/profile-completeness"

const BANNER_KEY = "cm-profile-banner-dismissed"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const { data: profileData, isError } = useProfile()
  const [bannerDismissed, setBannerDismissed] = useState(true)

  useEffect(() => {
    const dismissed = sessionStorage.getItem(BANNER_KEY)
    setBannerDismissed(!!dismissed)
  }, [])

  const completeness = profileData && !isError ? getProfileCompleteness(profileData) : null
  const showBanner = !bannerDismissed && completeness !== null && completeness.score < 70

  const dismissBanner = () => {
    sessionStorage.setItem(BANNER_KEY, "1")
    setBannerDismissed(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn("flex min-h-screen flex-col transition-all duration-300", isCollapsed ? "lg:ml-16" : "lg:ml-64")}
      >
        <Header />

        {showBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
              Профиль заполнен на{" "}
              <strong>{completeness!.score}%</strong> — добавьте данные для лучших рекомендаций вакансий
            </p>
            <Button
              asChild
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 h-7 text-xs px-3"
            >
              <Link href="/profile">Заполнить</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={dismissBanner}
              className="h-7 w-7 text-amber-600 hover:text-amber-800 hover:bg-amber-500/10 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <Footer />
      </div>
      <AIChat />
      <OnboardingModal />
      <UpgradeModal />
    </div>
  )
}
