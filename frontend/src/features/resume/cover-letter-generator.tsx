"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Sparkles, Copy, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { useGenerateCoverLetter } from "./api/use-resumes"
import { useProfile } from "@/features/profile/api/use-profile"

interface CoverLetterGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CoverLetterGenerator({ open, onOpenChange }: CoverLetterGeneratorProps) {
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [keyPoints, setKeyPoints] = useState("")
  const [generatedLetter, setGeneratedLetter] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const { mutateAsync: generateCoverLetterApi } = useGenerateCoverLetter()
  const { data: profile } = useProfile()

  const generateLetter = async () => {
    if (!company || !position) return

    setIsGenerating(true)
    try {
      const res = await generateCoverLetterApi({ company, position, keyPoints, profile })
      setGeneratedLetter(res.text)
    } catch (e) {
      console.error(e)
      setGeneratedLetter("Ошибка генерации сопроводительного письма. Проверьте соединение с сервером.")
    } finally {
      setIsGenerating(false)
    }
  }



  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter)
  }

  const resetForm = () => {
    setCompany("")
    setPosition("")
    setKeyPoints("")
    setGeneratedLetter("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-card-foreground">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI-генератор сопроводительного письма
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedLetter ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-card-foreground">Компания</Label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Название компании"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Позиция</Label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Data Analyst"
                    className="bg-background border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Ключевые моменты (опционально)</Label>
                <Textarea
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="Что особенно важно подчеркнуть в письме..."
                  className="bg-background border-border min-h-[80px]"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted border border-border">
                <pre className="whitespace-pre-wrap text-sm text-card-foreground font-sans">{generatedLetter}</pre>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" className="bg-transparent border-border">
                  <Copy className="h-4 w-4 mr-2" /> Копировать
                </Button>
                <Button onClick={resetForm} variant="outline" className="bg-transparent border-border">
                  <RefreshCw className="h-4 w-4 mr-2" /> Создать новое
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent border-border">
            Закрыть
          </Button>
          {!generatedLetter && (
            <Button
              onClick={generateLetter}
              disabled={!company || !position || isGenerating}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Сгенерировать
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
