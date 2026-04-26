"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Loader2, Upload, CheckCircle2, AlertCircle, FileText, X } from "lucide-react"
import { toast } from "sonner"
import { useUploadResume } from "@/features/profile/api/use-upload-resume"
import { useUpdateProfile } from "@/features/profile/api/use-profile"
import { mapParsedToProfile, type MappedProfileData } from "@/features/profile/utils/map-parsed-to-profile"
import { getProfileCompleteness, type MissingField } from "@/features/profile/utils/profile-completeness"
import type { ProfileDto, ParsedProfileDto } from "@/shared/api/types"

interface ResumeImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingProfile: ProfileDto
}

type ModalStep = "upload" | "preview" | "success"

const FIELD_LABELS: Record<string, string> = {
  fullName: "ФИО",
  desiredPosition: "Желаемая должность",
  experienceYears: "Лет опыта",
  workExperience: "Опыт работы",
  skills: "Навыки",
  aboutMe: "О себе",
  careerGoals: "Карьерные цели",
}

function formatFieldValue(key: string, value: unknown): string {
  if (key === "workExperience" && Array.isArray(value)) {
    return `${value.length} ${value.length === 1 ? "запись" : value.length < 5 ? "записи" : "записей"}`
  }
  if (key === "skills" && value && typeof value === "object" && !Array.isArray(value)) {
    const s = value as { technical: string[] }
    const preview = s.technical.slice(0, 4).join(", ")
    return s.technical.length > 4 ? `${preview}...` : preview
  }
  if (Array.isArray(value)) return value.slice(0, 4).join(", ")
  return String(value)
}

export function ResumeImportModal({ open, onOpenChange, existingProfile }: ResumeImportModalProps) {
  const [step, setStep] = useState<ModalStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mappedData, setMappedData] = useState<MappedProfileData | null>(null)
  const [stillMissing, setStillMissing] = useState<MissingField[]>([])
  const [filledKeys, setFilledKeys] = useState<string[]>([])

  const { mutate: uploadResume, isPending: isUploading } = useUploadResume()
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after close animation
    setTimeout(() => {
      setStep("upload")
      setFile(null)
      setMappedData(null)
    }, 300)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleParse = () => {
    if (!file) return
    uploadResume(file, {
      onSuccess: (parsed: ParsedProfileDto) => {
        const mapped = mapParsedToProfile(parsed, existingProfile)
        setMappedData(mapped)
        if (Object.keys(mapped).length === 0) {
          toast.info("Все поля уже заполнены — резюме не добавило новых данных")
          handleClose()
          return
        }
        setStep("preview")
      },
      onError: (err: Error) => {
        toast.error("Не удалось разобрать резюме", { description: err.message })
      },
    })
  }

  const handleConfirm = () => {
    if (!mappedData) return
    updateProfile(mappedData as ProfileDto, {
      onSuccess: () => {
        const keys = Object.keys(mappedData)
        setFilledKeys(keys)
        const newProfile = { ...existingProfile, ...mappedData }
        const { missing } = getProfileCompleteness(newProfile)
        setStillMissing(missing)
        setStep("success")
      },
      onError: (err: Error) => {
        toast.error("Ошибка сохранения профиля", { description: err.message })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            {step === "upload" && "Импорт из резюме"}
            {step === "preview" && "Что будет заполнено"}
            {step === "success" && "Профиль обновлён"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Загрузите резюме — мы автоматически заполним пустые поля профиля.
            </p>

            <label
              className={`
                flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer
                transition-colors
                ${isDragging ? "border-blue-500 bg-blue-500/5" : "border-border hover:border-blue-500/50 hover:bg-muted/30"}
                ${file ? "border-blue-500/50 bg-blue-500/5" : ""}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} МБ
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); setFile(null) }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Выбрать другой
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Перетащите файл или нажмите</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX — до 10 МБ</p>
                  </div>
                </>
              )}
            </label>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Отмена</Button>
              <Button
                onClick={handleParse}
                disabled={!file || isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Анализируем резюме...
                  </>
                ) : (
                  "Далее"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && mappedData && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Уже заполненные поля не будут перезаписаны.
            </p>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-1/3">Поле</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Значение</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mappedData).map(([key, value]) => (
                    <tr key={key} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">
                        {FIELD_LABELS[key] ?? key}
                      </td>
                      <td className="px-3 py-2 text-foreground truncate max-w-[240px]">
                        {formatFieldValue(key, value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>Назад</Button>
              <Button
                onClick={handleConfirm}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Сохраняем...
                  </>
                ) : (
                  "Подтвердить"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div className="space-y-4">
            {filledKeys.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Заполнено из резюме:</p>
                <ul className="space-y-1">
                  {filledKeys.map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm text-emerald-500">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {FIELD_LABELS[key] ?? key}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stillMissing.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-sm font-medium text-foreground">Ещё нужно заполнить вручную:</p>
                <ul className="space-y-1">
                  {stillMissing.map((field) => (
                    <li key={field.key} className="flex items-center gap-2 text-sm text-amber-500">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {field.label}
                      <span className="text-xs text-muted-foreground ml-auto">+{field.weight}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700 text-white">
                Готово
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
