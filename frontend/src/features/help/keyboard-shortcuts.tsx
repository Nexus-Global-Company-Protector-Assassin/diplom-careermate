"use client"

import { useState, useEffect } from "react"
import { Keyboard } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

const shortcuts = [
  { keys: ["⌘", "K"], description: "Открыть поиск" },
  { keys: ["⌘", "B"], description: "Свернуть/развернуть сайдбар" },
  { keys: ["⌘", "/"], description: "Открыть справку по горячим клавишам" },
  { keys: ["Esc"], description: "Закрыть модальное окно" },
]

const navigationShortcuts = [
  { keys: ["G", "D"], description: "Перейти на Dashboard" },
  { keys: ["G", "P"], description: "Перейти в Профиль" },
  { keys: ["G", "R"], description: "Перейти в Резюме" },
  { keys: ["G", "V"], description: "Перейти в Вакансии" },
  { keys: ["G", "A"], description: "Перейти в Аналитику" },
  { keys: ["G", "S"], description: "Перейти в Настройки" },
]

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted"
        title="Горячие клавиши (⌘/)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-card-foreground">
              <Keyboard className="h-5 w-5" />
              Горячие клавиши
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Общие</h4>
              <div className="space-y-2">
                {shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-card-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <kbd
                          key={j}
                          className="px-2 py-1 text-xs font-medium bg-muted rounded border border-border text-card-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Навигация</h4>
              <div className="space-y-2">
                {navigationShortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-card-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <kbd
                          key={j}
                          className="px-2 py-1 text-xs font-medium bg-muted rounded border border-border text-card-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              На Mac используйте ⌘, на Windows/Linux — Ctrl
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
