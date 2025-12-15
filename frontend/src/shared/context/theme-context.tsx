"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface ThemeSettings {
  compactMode: boolean
  largeFont: boolean
}

interface ThemeContextType {
  settings: ThemeSettings
  toggleCompactMode: () => void
  toggleLargeFont: () => void
  updateSettings: (settings: Partial<ThemeSettings>) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>({
    compactMode: false,
    largeFont: false,
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("careermate-theme")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings({
          compactMode: parsed.compactMode || false,
          largeFont: parsed.largeFont || false,
        })
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const body = document.body

    if (settings.compactMode) {
      body.classList.add("compact")
    } else {
      body.classList.remove("compact")
    }

    if (settings.largeFont) {
      body.classList.add("large-font")
    } else {
      body.classList.remove("large-font")
    }

    localStorage.setItem("careermate-theme", JSON.stringify(settings))
  }, [settings, mounted])

  const toggleCompactMode = () => {
    setSettings((prev) => ({ ...prev, compactMode: !prev.compactMode }))
  }

  const toggleLargeFont = () => {
    setSettings((prev) => ({ ...prev, largeFont: !prev.largeFont }))
  }

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  return (
    <ThemeContext.Provider value={{ settings, toggleCompactMode, toggleLargeFont, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
