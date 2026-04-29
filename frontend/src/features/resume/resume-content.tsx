"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Sparkles,
  Eye,
  FileText,
  CheckCircle2,
  Linkedin,
  Upload,
  X,
  File,
  Download,
  Edit,
  Trash2,
  PenTool,
  AlertTriangle,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  Loader2,
  Brain,
  Search,
  Wand2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { CoverLetterGenerator } from "@/features/resume/cover-letter-generator"
import { useResumesHistory, useSaveResume, useDeleteResume } from "./api/use-resumes"
import { useUploadResume } from "@/features/profile/api/use-upload-resume"
import { useReviewResume, useStoreResumeFile, type ResumeReviewResult } from "./api/use-review-resume"
import { useGenerateQuestions, useGenerateResume, type ResumeQuestion, type QuestionAnswer } from "./api/use-create-resume"
import { useProfile } from "@/features/profile/api/use-profile"
import { Textarea } from "@/shared/ui/textarea"
import ReactMarkdown from "react-markdown"

// PDF download — pure pdf-lib (no html2canvas, no lab() issues)
const downloadResumePdf = async (text: string, fullName: string) => {
  const { PDFDocument, rgb } = await import('pdf-lib')
  const fontkit = (await import('@pdf-lib/fontkit')).default

  // Load Cyrillic font
  const fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.1/files/inter-cyrillic-400-normal.woff'
  const fontBoldUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.1/files/inter-cyrillic-700-normal.woff'
  const [fontBytes, fontBoldBytes] = await Promise.all([
    fetch(fontUrl).then(r => r.arrayBuffer()),
    fetch(fontBoldUrl).then(r => r.arrayBuffer()),
  ])

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(fontBytes)
  const fontBold = await doc.embedFont(fontBoldBytes)

  const pageW = 595.28 // A4 width in points
  const pageH = 841.89 // A4 height
  const mL = 56, mR = 56, mTop = 56, mBot = 56
  const usableW = pageW - mL - mR

  let page = doc.addPage([pageW, pageH])
  let y = pageH - mTop

  const blue = rgb(0.145, 0.388, 0.922)
  const dark = rgb(0.059, 0.090, 0.165)
  const gray = rgb(0.200, 0.255, 0.333)
  const lightGray = rgb(0.580, 0.639, 0.722)
  const lineColor = rgb(0.886, 0.910, 0.941)

  const checkPage = (needed: number) => {
    if (y - needed < mBot) {
      page = doc.addPage([pageW, pageH])
      y = pageH - mTop
    }
  }

  const drawText = (txt: string, x: number, yy: number, f: typeof font, size: number, color: typeof dark) => {
    // Truncate text that's too wide
    let t = txt
    while (f.widthOfTextAtSize(t, size) > usableW - (x - mL) && t.length > 1) {
      t = t.slice(0, -1)
    }
    page.drawText(t, { x, y: yy, font: f, size, color })
  }

  const wrapText = (txt: string, f: typeof font, size: number, maxW: number): string[] => {
    const words = txt.split(' ')
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (f.widthOfTextAtSize(test, size) <= maxW) {
        current = test
      } else {
        if (current) lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)
    return lines.length ? lines : ['']
  }

  // === HEADER ===
  drawText(fullName || 'Резюме', mL, y, fontBold, 22, dark)
  y -= 28
  page.drawLine({ start: { x: mL, y }, end: { x: pageW - mR, y }, thickness: 2.5, color: blue })
  y -= 14
  const dateStr = `Сгенерировано CareerMate AI • ${new Date().toLocaleDateString('ru-RU')}`
  drawText(dateStr, mL, y, font, 8, lightGray)
  y -= 24

  // === CONTENT ===
  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { y -= 8; continue }

    const clean = trimmed.replace(/\*\*(.+?)\*\*/g, '$1')

    if (trimmed.startsWith('## ')) {
      checkPage(28)
      y -= 10
      const title = clean.replace(/^## /, '')
      drawText(title, mL, y, fontBold, 14, dark)
      y -= 5
      page.drawLine({ start: { x: mL, y }, end: { x: pageW - mR, y }, thickness: 0.5, color: lineColor })
      y -= 14
    } else if (trimmed.startsWith('### ')) {
      checkPage(22)
      y -= 8
      page.drawLine({ start: { x: mL, y: y + 12 }, end: { x: mL, y: y - 2 }, thickness: 2.5, color: blue })
      const title = clean.replace(/^### /, '')
      drawText(title, mL + 10, y, fontBold, 11, rgb(0.118, 0.251, 0.686))
      y -= 14
    } else if (trimmed.startsWith('# ')) {
      checkPage(30)
      y -= 12
      const title = clean.replace(/^# /, '')
      drawText(title, mL, y, fontBold, 16, dark)
      y -= 18
    } else if (trimmed.startsWith('- ')) {
      checkPage(16)
      const bullet = clean.replace(/^- /, '')
      const wrapped = wrapText(bullet, font, 10, usableW - 14)
      drawText('•', mL + 2, y, fontBold, 10, blue)
      for (const wl of wrapped) {
        checkPage(14)
        drawText(wl, mL + 14, y, font, 10, gray)
        y -= 14
      }
    } else {
      checkPage(14)
      const wrapped = wrapText(clean, font, 10, usableW)
      for (const wl of wrapped) {
        checkPage(14)
        drawText(wl, mL, y, font, 10, gray)
        y -= 14
      }
    }
  }

  const pdfBytes = await doc.save()
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fullName || 'Resume'}_CareerMate.pdf`
  a.click()
  URL.revokeObjectURL(url)
}






interface ResumeCard {
  id: string
  title: string
  subtitle: string
  content?: string
  reviewData?: any
  updated: string
  status: "Активное" | "Устаревшее" | "Черновик"
  statusColor: string
}

function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 9) return "bg-emerald-500 text-white"
    if (score >= 7) return "bg-blue-500 text-white"
    if (score >= 5) return "bg-amber-500 text-white"
    return "bg-red-500 text-white"
  }
  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-lg ${getColor()}`}>
      {score}/10
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { label: string; className: string }> = {
    critical: { label: "Критично", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    major: { label: "Важно", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    minor: { label: "Мелочь", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  }
  const c = config[severity] || config.minor
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.className}`}>{c.label}</span>
}

/** Animated step-by-step loader */
function AnalysisLoader({ step }: { step: 'uploading' | 'parsing' | 'analyzing' | 'saving' }) {
  const steps = [
    { key: 'uploading', icon: Upload, label: 'Загрузка файла...' },
    { key: 'parsing', icon: Search, label: 'Извлечение текста...' },
    { key: 'analyzing', icon: Brain, label: 'AI анализирует резюме...' },
    { key: 'saving', icon: Wand2, label: 'Сохранение результата...' },
  ]
  const currentIdx = steps.findIndex(s => s.key === step)

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center animate-bounce">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      </div>
      <div className="space-y-2 w-full max-w-xs">
        {steps.map((s, i) => {
          const Icon = s.icon
          const isActive = i === currentIdx
          const isDone = i < currentIdx
          return (
            <div
              key={s.key}
              className={`flex items-center gap-2 text-sm transition-all duration-500 ${
                isActive ? 'text-blue-500 font-medium scale-105' : isDone ? 'text-emerald-500' : 'text-muted-foreground/40'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : isActive ? (
                <Icon className="h-4 w-4 animate-pulse shrink-0" />
              ) : (
                <Icon className="h-4 w-4 shrink-0" />
              )}
              <span className={isActive ? 'animate-pulse' : ''}>{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ResumeContent() {
  const { data: historyData } = useResumesHistory()
  const { mutate: saveResume, isPending: isSaving } = useSaveResume()
  const { mutate: deleteResume } = useDeleteResume()
  const { mutate: uploadToAgent, isPending: isParsing } = useUploadResume()
  const { mutate: reviewResume, isPending: isReviewing } = useReviewResume()
  const { mutate: storeFile } = useStoreResumeFile()
  const { data: profileData } = useProfile()
  const { mutate: generateQuestions, isPending: isGeneratingQuestions } = useGenerateQuestions()
  const { mutate: generateResume, isPending: isGeneratingResume } = useGenerateResume()

  const [resumeCards, setResumeCards] = useState<ResumeCard[]>([])
  const [resumeTable, setResumeTable] = useState<any[]>([])

  // ── Create Resume State ──
  const [createResumeOpen, setCreateResumeOpen] = useState(false)
  const [createStep, setCreateStep] = useState<'loading' | 'questions' | 'generating' | 'result'>('loading')
  const [aiQuestions, setAiQuestions] = useState<ResumeQuestion[]>([])
  const [profileSummary, setProfileSummary] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [generatedMarkdown, setGeneratedMarkdown] = useState('')
  const [generatedTips, setGeneratedTips] = useState<string[]>([])
  const [createError, setCreateError] = useState('')

  const buildProfileForAgent = () => {
    if (!profileData) return {}
    const we = Array.isArray(profileData.workExperience) ? profileData.workExperience.map((w: any) => ({
      company: w.company || '',
      position: w.position || '',
      duration: w.period || '',
      description: '',
    })) : []
    const edu = Array.isArray(profileData.education) ? profileData.education.map((e: any) => ({
      institution: e.institution || '',
      degree: e.degree || '',
    })) : []
    const skills = profileData.skills?.technical ? [...(profileData.skills.technical || []), ...(profileData.skills.professional || [])] : []

    // Email is on User (auth), not on Profile — decode from JWT
    let email = ''
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1] || ''))
          email = payload?.email || ''
        }
      } catch {
        email = ''
      }
    }

    // aboutMe in DB sometimes encodes "Telegram: ... | GitHub: ... | Email: ..." (see profile-content.tsx)
    // Extract them so the agent gets clean fields.
    const aboutMeRaw = profileData.aboutMe || ''
    const telegramFromAbout = aboutMeRaw.match(/Telegram:\s*([^\n|]+)/i)?.[1]?.trim()
    const githubFromAbout = aboutMeRaw.match(/GitHub:\s*([^\n|]+)/i)?.[1]?.trim()
    const emailFromAbout = aboutMeRaw.match(/Email:\s*([^\n|]+)/i)?.[1]?.trim()

    return {
      fullName: profileData.fullName || '',
      desiredPosition: profileData.desiredPosition || (Array.isArray(profileData.workExperience) && profileData.workExperience[0]?.position) || 'Специалист',
      experienceYears: typeof profileData.experienceYears === 'number' ? profileData.experienceYears : we.length * 2,
      skills,
      workExperience: we,
      education: edu,
      aboutMe: aboutMeRaw,
      email: email || emailFromAbout || '',
      phone: profileData.phone || '',
      location: profileData.location || '',
      linkedinUrl: profileData.linkedinUrl || '',
      githubUrl: profileData.githubUrl || githubFromAbout || '',
      portfolioUrl: profileData.portfolioUrl || '',
      telegram: telegramFromAbout || '',
    }
  }

  const handleOpenCreateResume = () => {
    setCreateResumeOpen(true)
    setCreateStep('loading')
    setCreateError('')
    setAnswers({})
    setGeneratedMarkdown('')
    setGeneratedTips([])

    const agentProfile = buildProfileForAgent()
    generateQuestions(agentProfile, {
      onSuccess: (data) => {
        setAiQuestions(data.questions)
        setProfileSummary(data.profileSummary)
        setCreateStep('questions')
      },
      onError: (err) => {
        setCreateError(err.message)
        setCreateStep('questions')
      },
    })
  }

  const handleGenerateResume = () => {
    setCreateStep('generating')
    const agentProfile = buildProfileForAgent()
    const answersList: QuestionAnswer[] = aiQuestions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || '',
    })).filter(a => a.answer.trim())

    generateResume({ profileData: agentProfile, answers: answersList }, {
      onSuccess: (data) => {
        setGeneratedMarkdown(data.resumeMarkdown)
        setGeneratedTips(data.tips)
        setCreateStep('result')
        // Auto-save to DB
        const title = data.resumeMarkdown.match(/^#\s+(.+)$/m)?.[1] || 'AI Резюме'
        const subtitle = data.resumeMarkdown.match(/^##\s+(.+)$/m)?.[1] || 'Сгенерировано AI'
        saveResume({ title, subtitle, content: data.resumeMarkdown, type: 'ai-generated' })
      },
      onError: (err) => {
        setCreateError(err.message)
        setCreateStep('questions')
      },
    })
  }

  useEffect(() => {
    if (historyData?.resumes) {
      setResumeCards(historyData.resumes)
    }
    if (historyData?.history) {
      setResumeTable(historyData.history)
    }
  }, [historyData])

  const [checklistModalOpen, setChecklistModalOpen] = useState(false)

  const [checklistItems, setChecklistItems] = useState([
    { id: "c1", text: "Заголовок профиля оптимизирован", done: true, description: "Заголовок должен содержать должность, ключевые навыки и ценность для работодателя", section: "Профиль", difficulty: "Легко" },
    { id: "c2", text: "Загрузите профессиональное фото", done: false, description: "Профили с фото получают в 14× больше просмотров по сравнению с профилями без фото", section: "Профиль", difficulty: "Легко" },
    { id: "c3", text: "Добавьте раздел 'About' (о себе)", done: false, description: "Напишите 2-3 предложения о своём вкладе и уникальной ценности для работодателя", section: "Профиль", difficulty: "Средне" },
    { id: "c4", text: "Укажите ключевые навыки (5-10 шт.)", done: false, description: "Выберите навыки, по которым вас чаще всего ищут рекрутеры. Ссылайтесь на описания вакансий", section: "Профиль", difficulty: "Легко" },
    { id: "c5", text: "Опишите опыт с результатами и цифрами", done: false, description: "Используйте STAR-фрейм. Пример: 'Увеличил конверсию на 35% за 3 мес. через аб/тесты'", section: "Опыт", difficulty: "Средне" },
    { id: "c6", text: "Добавьте все места работы с датами", done: false, description: "Отсутствие дат вызывает недоверие. Укажите месяц и год начала и окончания каждой роли", section: "Опыт", difficulty: "Легко" },
    { id: "c7", text: "Добавьте образование и сертификаты", done: false, description: "Сертификаты повышают доверие и показывают инициативность. Coursera, Google, AWS и другие", section: "Опыт", difficulty: "Средне" },
    { id: "c8", text: "Попросите 3+ коллег написать рекомендации", done: false, description: "Рекомендации от коллег и руководителей значительно повышают доверие к вашему профилю", section: "Активность", difficulty: "Сложно" },
    { id: "c9", text: "Включите 'Открыт для предложений'", done: false, description: "Статус Open to Work или 'Поиск работы' даёт вам попасть в поисковые выдачи рекрутеров", section: "Активность", difficulty: "Легко" },
    { id: "c10", text: "Напишите 1-2 поста в своёй области", done: false, description: "Активные авторы получают больше просмотров и попадают в верх поиска по ключевым словам", section: "Активность", difficulty: "Сложно" },
  ])

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedResume, setSelectedResume] = useState<ResumeCard | null>(null)
  const [reviewResult, setReviewResult] = useState<ResumeReviewResult | null>(null)
  const [isViewingExisting, setIsViewingExisting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [resumeTitle, setResumeTitle] = useState("")
  const [coverLetterOpen, setCoverLetterOpen] = useState(false)
  const [showImprovedResume, setShowImprovedResume] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<'uploading' | 'parsing' | 'analyzing' | 'saving'>('uploading')
  const [saveNotification, setSaveNotification] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (saveNotification) {
      const timer = setTimeout(() => setSaveNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveNotification])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!uploadedFile || !resumeTitle) return
    const file = uploadedFile  // capture after null-guard for type-safe closure
    const title = resumeTitle

    setAnalysisStep('uploading')

    // Use the new deep review endpoint
    setTimeout(() => setAnalysisStep('parsing'), 800)
    setTimeout(() => setAnalysisStep('analyzing'), 2000)

    reviewResume(
      { file },
      {
        onSuccess: (result) => {
          setAnalysisStep('saving')
          setReviewResult(result)
          // Persist original file to MinIO/S3 (fire-and-forget, non-blocking)
          storeFile(
            { file, title },
            { onError: (e) => console.warn('[StoreFile] MinIO upload failed (non-blocking):', e) },
          )

          // Auto-save the resume with reviewData immediately to DB
          const content = `Анализ резюме от AI Агента:\n\nОценка: ${result.overallScore}/10 — ${result.overallVerdict}\n\nФИО: ${result.extractedProfile.fullName}\nДолжность: ${result.extractedProfile.currentPosition || 'Не указана'}\nОпыт: ${result.extractedProfile.experienceYears} лет\nНавыки: ${result.extractedProfile.skills.join(', ')}`

          saveResume({
            title,
            subtitle: `Файл: ${file.name}`,
            type: 'uploaded_file',
            content,
            reviewData: result,
          }, {
            onSuccess: () => {
              setUploadModalOpen(false)
              setIsViewingExisting(false)
              setReviewModalOpen(true)
              setSaveNotification('Резюме сохранено с AI-анализом ✓')
            },
            onError: (saveError) => {
              console.error('[SaveResume] Failed to save with reviewData:', saveError)
              // Still show the review result even if save failed
              setUploadModalOpen(false)
              setIsViewingExisting(false)
              setReviewModalOpen(true)
            }
          })
        },
        onError: (error) => {
          console.error('[ReviewResume] Deep review failed, falling back to simple parse:', error)
          setAnalysisStep('parsing')

          // Fallback: use old simple parsing
          uploadToAgent(file, {
            onSuccess: (parsedData) => {
              storeFile({ file, title }, { onError: (e) => console.warn('[StoreFile] fallback MinIO upload failed:', e) })
              setAnalysisStep('saving')
              let formattedContent = `Анализ резюме от AI Агента:\n\n`
              if (parsedData.fullName) formattedContent += `ФИО: ${parsedData.fullName}\n`
              if (parsedData.desiredPosition) formattedContent += `Должность: ${parsedData.desiredPosition}\n`
              if (parsedData.skills && parsedData.skills.length > 0) {
                formattedContent += `\nКлючевые навыки: ${parsedData.skills.join(", ")}\n`
              }
              if (parsedData.workExperience && parsedData.workExperience.length > 0) {
                formattedContent += `\nОпыт работы:\n`
                parsedData.workExperience.forEach((we: any) => {
                  formattedContent += `- ${we.jobTitle || we.position} в ${we.employer || we.company} (${we.years || we.period})\n`
                })
              }

              // Build a basic reviewData from parsed data for persistence
              const basicReviewData = {
                overallScore: 0,
                overallVerdict: 'Требует доработки' as const,
                noChangesNeeded: false,
                strengths: [],
                weaknesses: [],
                missingForTarget: [],
                improvedResume: formattedContent,
                changesSummary: ['Базовый парсинг без глубокого анализа'],
                extractedProfile: {
                  fullName: parsedData.fullName || 'Не указано',
                  currentPosition: parsedData.desiredPosition,
                  skills: parsedData.skills || [],
                  experienceYears: parsedData.workExperience?.length || 0,
                },
                _fallback: true,
              }

              saveResume({
                title,
                subtitle: `Файл: ${file.name}`,
                type: 'uploaded_file',
                content: formattedContent,
                reviewData: basicReviewData,
              }, {
                onSuccess: () => {
                  setUploadModalOpen(false)
                  setUploadedFile(null)
                  setResumeTitle("")
                  setSaveNotification('Резюме сохранено (базовый парсинг) ✓')
                }
              })
            },
            onError: (parseError) => {
              console.error('[UploadToAgent] Simple parse also failed:', parseError)
              setAnalysisStep('saving')
              saveResume({
                title,
                subtitle: `Файл: ${file.name}`,
                type: 'uploaded_file',
                content: `[Ошибка: Не удалось распознать документ AI Агентом. Файл загружен без анализа.]`
              }, {
                onSuccess: () => {
                  setUploadModalOpen(false)
                  setUploadedFile(null)
                  setResumeTitle("")
                  setSaveNotification('Резюме загружено без анализа')
                }
              })
            }
          })
        }
      }
    )
  }

  const handleSaveImprovedVersion = () => {
    if (!reviewResult || !resumeTitle) return

    saveResume({
      title: `${resumeTitle} (улучшенное)`,
      subtitle: 'Улучшено AI-агентом',
      type: 'ai_improved',
      content: reviewResult.improvedResume,
      reviewData: reviewResult,
    }, {
      onSuccess: () => {
        setReviewModalOpen(false)
        setReviewResult(null)
        setUploadedFile(null)
        setResumeTitle("")
        setShowImprovedResume(false)
        setIsViewingExisting(false)
        setSaveNotification('Улучшенная версия сохранена ✓')
      }
    })
  }

  const handleViewAnalysis = (resume: ResumeCard) => {
    if (resume.reviewData) {
      setReviewResult(resume.reviewData as ResumeReviewResult)
      setResumeTitle(resume.title)
      setIsViewingExisting(true)
      setReviewModalOpen(true)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handlePreview = (resume: ResumeCard) => {
    setSelectedResume(resume)
    setPreviewModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteResume(id)
  }

  const handleToggleChecklist = (id: string) => {
    setChecklistItems(checklistItems.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Save notification toast */}
      {saveNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">{saveNotification}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Резюме и документы</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Управляйте своими резюме и сопроводительными письмами
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCoverLetterOpen(true)}
            className="bg-transparent border-border w-full sm:w-auto"
          >
            <PenTool className="h-4 w-4 mr-2" /> Написать письмо
          </Button>
          <Button
            onClick={handleOpenCreateResume}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4 mr-2" /> Создать резюме
          </Button>
          <Button onClick={() => setUploadModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" /> Загрузить резюме
          </Button>
        </div>
      </div>

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Рекомендации от AI-ассистента</h3>
              <p className="text-sm text-slate-300 mb-4">
                Загрузите резюме — AI-агент проведёт глубокий анализ: оценит качество, найдёт сильные и слабые стороны, и предложит улучшенную версию.
              </p>
              <Button onClick={() => setUploadModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">Загрузить и проанализировать →</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Мои резюме</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumeCards.map((resume) => (
            <Card key={resume.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex justify-end mb-2">
                  <Badge className={resume.statusColor}>{resume.status}</Badge>
                </div>
                <h3 className="font-semibold mb-1 text-card-foreground truncate">{resume.title}</h3>
                <p className="text-xs text-muted-foreground mb-1 truncate">{resume.subtitle}</p>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-xs text-muted-foreground">{resume.updated}</p>
                  {resume.reviewData && !(resume.reviewData as any)._fallback && (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                      {(resume.reviewData as any).overallScore}/10
                    </span>
                  )}
                  {resume.reviewData && (resume.reviewData as any)._fallback && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                      базовый
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {resume.reviewData && !(resume.reviewData as any)._fallback && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                      onClick={() => handleViewAnalysis(resume)}
                    >
                      <Sparkles className="h-4 w-4 mr-1" /> Анализ
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent border-border"
                    onClick={() => handlePreview(resume)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Просмотр
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50 bg-transparent dark:border-red-900 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(resume.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resume Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">История отправок</h2>
        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Компания</th>
                  <th className="p-4 font-medium">Документы</th>
                  <th className="p-4 font-medium">Дата</th>
                  <th className="p-4 font-medium">Статус</th>
                  <th className="p-4 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {resumeTable.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-card-foreground">{row.name}</td>
                    <td className="p-4 text-card-foreground">{row.company}</td>
                    <td className="p-4 text-card-foreground">{row.date}</td>
                    <td className="p-4">
                      <Badge className={`${row.statusColor} text-white`}>{row.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* LinkedIn/HH Checklist */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shrink-0">
              <Linkedin className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 w-full">
              <h3 className="font-semibold mb-1 text-card-foreground">LinkedIn / HH помощник</h3>
              <p className="text-sm text-muted-foreground mb-4">Проверьте и улучшите ваш профиль на внешних сайтах</p>
              <div className="space-y-2 mb-4">
                {checklistItems.map((item) => (
                  <button
                    key={item.id}
                    className="flex items-center gap-2 w-full text-left hover:bg-accent rounded-lg p-2 -ml-2 transition-colors"
                    onClick={() => handleToggleChecklist(item.id)}
                  >
                    <CheckCircle2
                      className={`h-5 w-5 shrink-0 ${item.done ? "text-emerald-500" : "text-muted-foreground/30"}`}
                    />
                    <span
                      className={`text-sm ${item.done ? "text-card-foreground line-through" : "text-muted-foreground"}`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
              <Button variant="outline" className="w-full bg-transparent border-border" onClick={() => setChecklistModalOpen(true)}>
                Открыть чеклист
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn / HH Checklist Modal */}
      <Dialog open={checklistModalOpen} onOpenChange={setChecklistModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-600" />
              LinkedIn / HH — Чеклист профиля
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-5">
            {/* Progress bar */}
            {(() => {
              const done = checklistItems.filter(i => i.done).length
              const total = checklistItems.length
              const pct = Math.round((done / total) * 100)
              const getColor = () => pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-400'
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Выполнено: <strong className="text-card-foreground">{done}/{total}</strong> пунктов</span>
                    <span className={`font-bold text-lg ${ pct === 100 ? 'text-emerald-500' : pct >= 60 ? 'text-blue-500' : 'text-amber-500' }`}>{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {pct === 100 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Профиль полностью оптимизирован! Рекрутеры вас заметят 🎉</span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Grouped sections */}
            {(['\u041f\u0440\u043e\u0444\u0438\u043b\u044c', '\u041e\u043f\u044b\u0442', '\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c'] as const).map(section => {
              const sectionItems = checklistItems.filter(i => i.section === section)
              const sectionDone = sectionItems.filter(i => i.done).length
              const sectionEmoji: Record<string, string> = { 'Профиль': '👤', 'Опыт': '💼', 'Активность': '🚀' }
              return (
                <div key={section}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{sectionEmoji[section]}</span>
                    <h3 className="font-semibold text-card-foreground">{section}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{sectionDone}/{sectionItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    {sectionItems.map(item => {
                      const diffColor: Record<string, string> = {
                        'Легко': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                        'Средне': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                        'Сложно': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      }
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleToggleChecklist(item.id)}
                          className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                            item.done
                              ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900'
                              : 'bg-background border-border hover:border-blue-300 dark:hover:border-blue-700 hover:bg-muted/50'
                          }`}
                        >
                          <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            item.done ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/40'
                          }`}>
                            {item.done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium ${ item.done ? 'line-through text-muted-foreground' : 'text-card-foreground' }`}>
                                {item.text}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${diffColor[item.difficulty]}`}>
                                {item.difficulty}
                              </span>
                            </div>
                            <p className={`text-xs mt-0.5 ${ item.done ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground' }`}>
                              {item.description}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChecklistModalOpen(false)} className="bg-transparent border-border">
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => {
        if (!isReviewing && !isParsing && !isSaving) {
          setUploadModalOpen(open)
        }
      }}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Загрузить новое резюме</DialogTitle>
          </DialogHeader>

          {/* Show loader when processing */}
          {(isReviewing || isParsing || isSaving) ? (
            <AnalysisLoader step={analysisStep} />
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-card-foreground">Название резюме</Label>
                <Input
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  placeholder="Например: Frontend Developer"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-card-foreground">Файл резюме</Label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors ${
                    dragActive ? "border-blue-500 bg-blue-500/10" : "border-border hover:border-blue-500/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                        <File className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-medium text-card-foreground truncate">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile()
                        }}
                        className="ml-auto text-destructive hover:text-destructive shrink-0"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-card-foreground font-medium mb-1">Перетащите файл сюда</p>
                      <p className="text-sm text-muted-foreground">или нажмите для выбора файла (PDF, DOC, DOCX)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {!(isReviewing || isParsing || isSaving) && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setUploadModalOpen(false)}
                className="bg-transparent border-border w-full sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadedFile || !resumeTitle}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Анализировать (AI)
                </span>
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* === REVIEW RESULT MODAL === */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-500" />
              {isViewingExisting ? 'Результат AI-анализа' : 'AI-анализ завершён'}
              {reviewResult && <ScoreBadge score={reviewResult.overallScore} />}
            </DialogTitle>
          </DialogHeader>

          {reviewResult && (
            <div className="space-y-5 py-2">
              {/* Auto-saved notification */}
              {!isViewingExisting && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-400">Резюме автоматически сохранено с результатами анализа</span>
                </div>
              )}

              {/* Verdict */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Target className="h-5 w-5 text-blue-500 shrink-0" />
                <div>
                  <p className="font-semibold text-card-foreground">{reviewResult.overallVerdict}</p>
                  <p className="text-xs text-muted-foreground">
                    {reviewResult.extractedProfile.fullName}
                    {reviewResult.extractedProfile.currentPosition && ` • ${reviewResult.extractedProfile.currentPosition}`}
                    {` • ${reviewResult.extractedProfile.experienceYears} лет опыта`}
                  </p>
                </div>
                {reviewResult.noChangesNeeded && (
                  <Badge className="ml-auto bg-emerald-500 text-white shrink-0">Без изменений ✓</Badge>
                )}
              </div>

              {/* Strengths */}
              {reviewResult.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Сильные стороны ({reviewResult.strengths.length})
                  </h4>
                  <div className="space-y-2">
                    {reviewResult.strengths.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <p className="font-medium text-sm text-card-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {reviewResult.weaknesses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Слабые стороны ({reviewResult.weaknesses.length})
                  </h4>
                  <div className="space-y-2">
                    {reviewResult.weaknesses.map((w, i) => (
                      <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-card-foreground">{w.title}</p>
                          <SeverityBadge severity={w.severity} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{w.description}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 flex items-start gap-1">
                          <TrendingUp className="h-3 w-3 mt-0.5 shrink-0" />
                          {w.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing for target */}
              {reviewResult.missingForTarget.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Не хватает для целевой позиции:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewResult.missingForTarget.map((m, i) => (
                      <span key={i} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Changes summary */}
              {reviewResult.changesSummary.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Внесённые AI-улучшения:</h4>
                  <ul className="space-y-1">
                    {reviewResult.changesSummary.map((c, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">→</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improved Resume (collapsible) */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center">
                  <button
                    onClick={() => setShowImprovedResume(!showImprovedResume)}
                    className="flex-1 flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Улучшенное резюме
                    </span>
                    {showImprovedResume ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mr-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1.5 text-xs"
                    onClick={() => downloadResumePdf(
                      reviewResult.improvedResume,
                      reviewResult.extractedProfile?.fullName || ''
                    )}
                  >
                    <Download className="h-3.5 w-3.5" /> Скачать PDF
                  </Button>
                </div>
                {showImprovedResume && (
                  <div className="p-4 border-t border-border bg-muted/30 max-h-[300px] overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-xs text-card-foreground">
                      {reviewResult.improvedResume}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            {isViewingExisting ? (
              /* Viewing existing analysis - just close button */
              <Button
                onClick={() => {
                  setReviewModalOpen(false)
                  setIsViewingExisting(false)
                  setReviewResult(null)
                  setShowImprovedResume(false)
                }}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                Закрыть
              </Button>
            ) : (
              /* New analysis - option to save improved version */
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewModalOpen(false)
                    setReviewResult(null)
                    setUploadedFile(null)
                    setResumeTitle("")
                    setShowImprovedResume(false)
                  }}
                  className="bg-transparent border-border w-full sm:w-auto"
                >
                  Закрыть
                </Button>
                <Button
                  onClick={handleSaveImprovedVersion}
                  disabled={isSaving || reviewResult?.noChangesNeeded === true}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isSaving ? "Сохраняем..." : "Сохранить улучшенное отдельно"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{selectedResume?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex-1 overflow-y-auto min-h-0">
            <div className="bg-muted rounded-lg p-6 min-h-[300px] flex flex-col text-sm border border-border">
              {selectedResume?.content ? (
                <div className="flex-1 whitespace-pre-wrap break-words text-card-foreground">
                  {selectedResume.content}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-card-foreground font-medium">Нет содержимого для предпросмотра</p>
                  <p className="text-muted-foreground mt-2">{selectedResume?.subtitle}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Download className="h-4 w-4 mr-2" /> Скачать
            </Button>
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Edit className="h-4 w-4 mr-2" /> Редактировать
            </Button>
            <Button
              onClick={() => setPreviewModalOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cover Letter Generator */}
      <CoverLetterGenerator open={coverLetterOpen} onOpenChange={setCoverLetterOpen} />

      {/* ═══ Create Resume Modal ═══ */}
      <Dialog open={createResumeOpen} onOpenChange={setCreateResumeOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              {createStep === 'loading' && 'Анализируем ваш профиль...'}
              {createStep === 'questions' && 'Дополните информацию'}
              {createStep === 'generating' && 'Генерируем резюме...'}
              {createStep === 'result' && 'Готовое резюме'}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Loading */}
          {createStep === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center animate-bounce">
                  <Brain className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm">AI анализирует ваш профиль и определяет недостающую информацию...</p>
            </div>
          )}

          {/* Step 2: Questions */}
          {createStep === 'questions' && (
            <div className="space-y-4 py-2">
              {createError && (
                <div className="bg-red-500/10 text-red-600 p-3 rounded-lg text-sm">
                  {createError}
                </div>
              )}
              {profileSummary && (
                <div className="bg-violet-500/10 p-3 rounded-lg text-sm text-violet-700 dark:text-violet-300">
                  <strong>Оценка профиля:</strong> {profileSummary}
                </div>
              )}
              {aiQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-2 p-4 border border-border rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="bg-violet-500 text-white text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <Label className="text-card-foreground font-medium">{q.question}</Label>
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                      <p className="text-xs text-muted-foreground mt-1">💡 {q.hint}</p>
                    </div>
                  </div>
                  <Textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Ваш ответ..."
                    className="bg-background border-border min-h-[80px] resize-none"
                  />
                </div>
              ))}
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateResumeOpen(false)} className="bg-transparent border-border w-full sm:w-auto">
                  Отмена
                </Button>
                <Button
                  onClick={handleGenerateResume}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white w-full sm:w-auto"
                  disabled={isGeneratingResume}
                >
                  <Wand2 className="h-4 w-4 mr-2" /> Сгенерировать резюме
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Generating */}
          {createStep === 'generating' && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center animate-bounce">
                  <Wand2 className="h-3 w-3 text-white" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm">AI составляет профессиональное резюме...</p>
              <p className="text-xs text-muted-foreground">Это может занять до 2 минут</p>
            </div>
          )}

          {/* Step 4: Result */}
          {createStep === 'result' && (
            <div className="space-y-4 py-2">
              <div className="bg-background border border-border rounded-lg p-6 prose prose-sm dark:prose-invert max-w-none max-h-[50vh] overflow-y-auto">
                <ReactMarkdown>{generatedMarkdown}</ReactMarkdown>
              </div>
              {generatedTips.length > 0 && (
                <div className="bg-amber-500/10 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">💡 Советы по улучшению:</h4>
                  <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 space-y-1">
                    {generatedTips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              )}
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  className="bg-transparent border-border w-full sm:w-auto"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedMarkdown)
                  }}
                >
                  📋 Скопировать
                </Button>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Сохранено
                </div>
                <Button
                  onClick={() => setCreateResumeOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  Закрыть
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
