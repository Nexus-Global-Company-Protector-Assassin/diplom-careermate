"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Sparkles, Copy, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"

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

  const generateLetter = () => {
    if (!company || !position) return

    setIsGenerating(true)

    // Simulated AI generation
    setTimeout(() => {
      const letter = `Уважаемый HR-менеджер компании ${company}!

Я с большим интересом ознакомился с вакансией "${position}" и хотел бы предложить свою кандидатуру на данную позицию.

Имея более 5 лет опыта в области аналитики данных, я уверен, что мои навыки и опыт позволят мне внести значительный вклад в развитие вашей компании.

Мои ключевые компетенции включают:
• Глубокий опыт работы с Python, SQL и инструментами визуализации данных
• Успешный опыт оптимизации бизнес-процессов на основе data-driven решений
• Навыки работы в кросс-функциональных командах и презентации результатов руководству

${keyPoints ? `\nДополнительно хочу отметить: ${keyPoints}\n` : ""}
Буду рад возможности обсудить, как мой опыт может быть полезен для ${company}. Готов предоставить дополнительную информацию и ответить на любые вопросы.

С уважением,
Сергей Баранов
oldersik@gmail.ru | +7 (900) 123-45-67`

      setGeneratedLetter(letter)
      setIsGenerating(false)
    }, 1500)
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
