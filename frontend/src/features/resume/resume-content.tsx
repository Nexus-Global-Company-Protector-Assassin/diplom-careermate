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
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { CoverLetterGenerator } from "@/features/resume/cover-letter-generator"
import { useResumesHistory, useSaveResume, useDeleteResume } from "./api/use-resumes"
import { useUploadResume } from "@/features/profile/api/use-upload-resume"

interface ResumeCard {
  id: string
  title: string
  subtitle: string
  content?: string
  updated: string
  status: "Активное" | "Устаревшее" | "Черновик"
  statusColor: string
}

export function ResumeContent() {
  const { data: historyData } = useResumesHistory()
  const { mutate: saveResume, isPending: isSaving } = useSaveResume()
  const { mutate: deleteResume, isPending: isDeleting } = useDeleteResume()
  const { mutate: uploadToAgent, isPending: isParsing } = useUploadResume()

  const [resumeCards, setResumeCards] = useState<ResumeCard[]>([])
  const [resumeTable, setResumeTable] = useState<any[]>([])

  useEffect(() => {
    if (historyData?.resumes) {
      setResumeCards(historyData.resumes)
    }
    if (historyData?.history) {
      setResumeTable(historyData.history)
    }
  }, [historyData])



  const [checklistItems, setChecklistItems] = useState([
    { id: "c1", text: "Заголовок профиля оптимизирован", done: true },
    { id: "c2", text: "Добавьте описание опыта работы", done: false },
    { id: "c3", text: "Загрузите профессиональное фото", done: false },
  ])

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedResume, setSelectedResume] = useState<ResumeCard | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [resumeTitle, setResumeTitle] = useState("")
  const [coverLetterOpen, setCoverLetterOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (uploadedFile && resumeTitle) {
      uploadToAgent(uploadedFile, {
        onSuccess: (parsedData) => {
          // Format parsed data for beautiful display
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
          if (parsedData.education && parsedData.education.length > 0) {
            formattedContent += `\nОбразование:\n`
            parsedData.education.forEach((ed: any) => {
              formattedContent += `- ${ed.institution} (${ed.degree || ''}, ${ed.graduationYear || ''})\n`
            })
          }

          saveResume({
            title: resumeTitle,
            subtitle: `Файл: ${uploadedFile.name}`,
            type: 'uploaded_file',
            content: formattedContent
          }, {
            onSuccess: () => {
              setUploadModalOpen(false)
              setUploadedFile(null)
              setResumeTitle("")
            }
          })
        },
        onError: () => {
          // Fallback if AI parser fails
          saveResume({
            title: resumeTitle,
            subtitle: `Файл: ${uploadedFile.name}`,
            type: 'uploaded_file',
            content: `[Ошибка: Не удалось распознать документ AI Агентом. Файл загружен без анализа.]`
          }, {
            onSuccess: () => {
              setUploadModalOpen(false)
              setUploadedFile(null)
              setResumeTitle("")
            }
          })
        }
      })
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
                Рекомендую обновить раздел "Навыки" — появились новые тренды в аналитике данных. Добавьте Python, 3D
                visualization и актуальные данные для большего интереса от работодателей.
              </p>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">Обновить профиль →</Button>
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
                <p className="text-xs text-muted-foreground mb-4">{resume.updated}</p>
                <div className="flex gap-2">
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
              <Button variant="outline" className="w-full bg-transparent border-border">
                Открыть чеклист
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Загрузить новое резюме</DialogTitle>
          </DialogHeader>
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
              disabled={!uploadedFile || !resumeTitle || isSaving || isParsing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
            >
              {isParsing ? "Анализируем (AI)..." : isSaving ? "Загрузка..." : "Загрузить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{selectedResume?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted rounded-lg p-6 min-h-[300px] flex flex-col text-sm border border-border">
              {selectedResume?.content ? (
                <div className="flex-1 whitespace-pre-wrap text-card-foreground">
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
    </div>
  )
}
