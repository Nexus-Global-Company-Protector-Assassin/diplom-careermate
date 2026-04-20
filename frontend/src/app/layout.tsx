import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/shared/context/theme-context"
import { SidebarProvider } from "@/shared/context/sidebar-context"
import { CoreQueryProvider } from "@/app/providers/query-provider"
import { ToastProvider } from "@/shared/ui/toast-notification"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "CareerMate - Умный карьерный помощник",
  description: "Платформа для управления карьерой с AI-помощником"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <CoreQueryProvider>
          <ThemeProvider>
            <SidebarProvider>
              <ToastProvider>{children}</ToastProvider>
            </SidebarProvider>
          </ThemeProvider>
        </CoreQueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
