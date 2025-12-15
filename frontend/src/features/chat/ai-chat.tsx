"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import { BebsichLogo } from "@/shared/assets/bebsich-logo"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Привет! Я Bebsich - твой персональный карьерный помощник. Чем могу помочь сегодня?",
    timestamp: new Date(),
  },
]

const quickReplies = ["Как улучшить резюме?", "Подготовка к собеседованию", "Найти вакансии"]

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes("резюме")) {
      return "Для улучшения резюме рекомендую:\n\n1. Добавьте конкретные достижения с цифрами\n2. Используйте ключевые слова из вакансий\n3. Проверьте грамматику и оформление\n4. Добавьте релевантные навыки\n\nХотите, чтобы я проанализировал ваше текущее резюме?"
    }

    if (lowerMessage.includes("собеседован")) {
      return "Подготовка к собеседованию включает:\n\n1. Изучите компанию и продукт\n2. Подготовьте рассказ о себе (1-2 минуты)\n3. Практикуйте ответы на типичные вопросы\n4. Подготовьте вопросы для работодателя\n\nМогу помочь с практикой ответов на вопросы!"
    }

    if (lowerMessage.includes("вакансии") || lowerMessage.includes("работ")) {
      return "Я вижу, что вы ищете работу! На основе вашего профиля могу порекомендовать:\n\n• Senior Data Analyst в Yandex (93% совместимость)\n• Data Analyst в Sber (81% совместимость)\n\nПерейдите в раздел Вакансии для просмотра всех предложений."
    }

    if (lowerMessage.includes("привет") || lowerMessage.includes("здравствуй")) {
      return "Привет! Рад видеть вас снова. Чем могу помочь сегодня? Могу помочь с:\n\n• Анализом и улучшением резюме\n• Подготовкой к собеседованию\n• Поиском подходящих вакансий\n• Карьерными советами"
    }

    return "Интересный вопрос! Я могу помочь вам с:\n\n• Анализом и улучшением резюме\n• Подготовкой к собеседованию\n• Поиском вакансий по вашему профилю\n• Карьерными рекомендациями\n\nЧто именно вас интересует?"
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateResponse(input)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleQuickReply = (reply: string) => {
    setInput(reply)
    setTimeout(() => handleSend(), 100)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-0 shadow-lg hover:from-blue-600 hover:to-cyan-500 hover:shadow-xl transition-all duration-300 z-50"
      >
        <BebsichLogo className="h-10 w-10" />
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl bg-card border border-border shadow-2xl transition-all duration-300",
        isMinimized ? "h-14 w-80" : "h-[500px] w-96 max-h-[80vh]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <BebsichLogo className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Bebsich</h3>
            {!isMinimized && <p className="text-xs text-white/80">AI-помощник</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  )}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
