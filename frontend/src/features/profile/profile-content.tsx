"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { User, Briefcase, GraduationCap, Wrench, X, Plus, Trash2, Upload, Loader2, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { useRouter } from "next/navigation"
import { useRunPoc } from "@/features/poc/api/use-run-poc"
import { useUploadResume } from "@/features/profile/api/use-upload-resume"
import { ProfileDto, ParsedProfileDto, PocRunResponseDto } from "@/shared/api"
import { toast } from "sonner"
import { useProfile, useUpdateProfile } from "./api/use-profile"
import { UnifiedSkillsCard } from "./skills-analysis-card"

interface PersonalData {
  fullName: string
  email: string
  phone: string
  city: string
  telegram: string
  github: string
}

interface WorkExperience {
  id: string
  position: string
  company: string
  period: string
}

interface Education {
  id: string
  institution: string
  degree: string
  year: string
}

interface Skills {
  technical: string[]
  professional: string[]
}

export function ProfileContent() {
  const router = useRouter()
  const { data: profileData, isLoading: profileLoading } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()
  const { mutate: runPoc, isPending } = useRunPoc()
  const { mutate: uploadResume, isPending: isUploading } = useUploadResume()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    uploadResume(file, {
      onSuccess: (parsed: ParsedProfileDto) => {
        toast.success(`✅ Резюме разобрано! Привет, ${parsed.fullName}!`)
        // Auto-fill profile from parsed AI data
        setPersonalData(prev => ({ ...prev, fullName: parsed.fullName || prev.fullName }))
        if (parsed.desiredPosition) {
          setWorkExperience(prev => prev.map((w, i) => i === 0 ? { ...w, position: parsed.desiredPosition! } : w))
        }
        if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
          setSkills(prev => ({ ...prev, technical: parsed.skills! }))
        }
        if (Array.isArray(parsed.workExperience) && parsed.workExperience.length > 0) {
          const mapped = parsed.workExperience.map((w: any, i: number) => ({
            id: String(Date.now() + i),
            position: w.position || w.jobTitle || "",
            company: w.company || w.employer || "",
            period: w.period || w.years || "",
          }))
          setWorkExperience(mapped)
        }
      },
      onError: (err: Error) => {
        toast.error("Не удалось разобрать резюме", { description: err.message })
      }
    })

    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const [personalData, setPersonalData] = useState<PersonalData>({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    telegram: "",
    github: "",
  })

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([])

  const [education, setEducation] = useState<Education[]>([])

  const [skills, setSkills] = useState<Skills>({
    technical: [],
    professional: [],
  })

  // Load from database on mount
  useEffect(() => {
    if (profileData) {
      if (profileData.fullName) setPersonalData(p => ({ ...p, fullName: profileData.fullName! }))
      if (profileData.phone) setPersonalData(p => ({ ...p, phone: profileData.phone! }))
      if (profileData.location) setPersonalData(p => ({ ...p, city: profileData.location! }))
      
      // Extract Email/Telegram/Github from aboutMe
      if (profileData.aboutMe) {
        const emailMatch = profileData.aboutMe.match(/Email:\s*(.*)/)
        const tgMatch = profileData.aboutMe.match(/Telegram:\s*(.*)/)
        const ghMatch = profileData.aboutMe.match(/GitHub:\s*(.*)/)
        setPersonalData(p => ({
          ...p,
          email: emailMatch ? emailMatch[1] : p.email,
          telegram: tgMatch ? tgMatch[1] : p.telegram,
          github: ghMatch ? ghMatch[1] : p.github,
        }))
      }

      if (profileData.workExperience && Array.isArray(profileData.workExperience)) {
        setWorkExperience(profileData.workExperience)
      }
      if (profileData.education && Array.isArray(profileData.education)) {
        setEducation(profileData.education)
      }
      if (profileData.skills && profileData.skills.technical && profileData.skills.professional) {
        setSkills(profileData.skills)
      }
    }
  }, [profileData])

  const syncToDb = (
    pd = personalData,
    we = workExperience,
    ed = education,
    sk = skills
  ) => {
    const totalExperienceYears = we.reduce((acc, current) => acc + 2, 0);
    updateProfile({
      fullName: pd.fullName,
      phone: pd.phone,
      location: pd.city,
      desiredPosition: we[0]?.position || "Специалист",
      experienceYears: totalExperienceYears,
      education: ed,
      workExperience: we,
      skills: sk,
      aboutMe: `Telegram: ${pd.telegram}\nGitHub: ${pd.github}\nEmail: ${pd.email}`,
    })
  }

  // Modal states
  const [personalModalOpen, setPersonalModalOpen] = useState(false)
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [educationModalOpen, setEducationModalOpen] = useState(false)
  const [skillsModalOpen, setSkillsModalOpen] = useState(false)

  // Temp states for editing
  const [tempPersonal, setTempPersonal] = useState<PersonalData>(personalData)
  const [tempWork, setTempWork] = useState<WorkExperience[]>(workExperience)
  const [tempEducation, setTempEducation] = useState<Education[]>(education)
  const [tempSkills, setTempSkills] = useState<Skills>(skills)
  const [newTechnicalSkill, setNewTechnicalSkill] = useState("")
  const [newProfessionalSkill, setNewProfessionalSkill] = useState("")

  const openPersonalModal = () => {
    setTempPersonal(personalData)
    setPersonalModalOpen(true)
  }

  const savePersonalData = () => {
    setPersonalData(tempPersonal)
    syncToDb(tempPersonal, workExperience, education, skills)
    setPersonalModalOpen(false)
  }

  const openWorkModal = () => {
    setTempWork([...workExperience])
    setWorkModalOpen(true)
  }

  const addWorkExperience = () => {
    setTempWork([...tempWork, { id: Date.now().toString(), position: "", company: "", period: "" }])
  }

  const removeWorkExperience = (id: string) => {
    setTempWork(tempWork.filter((w) => w.id !== id))
  }

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: string) => {
    setTempWork(tempWork.map((w) => (w.id === id ? { ...w, [field]: value } : w)))
  }

  const saveWorkExperience = () => {
    setWorkExperience(tempWork)
    syncToDb(personalData, tempWork, education, skills)
    setWorkModalOpen(false)
  }

  const openEducationModal = () => {
    setTempEducation([...education])
    setEducationModalOpen(true)
  }

  const addEducation = () => {
    setTempEducation([...tempEducation, { id: Date.now().toString(), institution: "", degree: "", year: "" }])
  }

  const removeEducation = (id: string) => {
    setTempEducation(tempEducation.filter((e) => e.id !== id))
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setTempEducation(tempEducation.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const saveEducation = () => {
    setEducation(tempEducation)
    syncToDb(personalData, workExperience, tempEducation, skills)
    setEducationModalOpen(false)
  }

  const openSkillsModal = () => {
    setTempSkills({ ...skills, technical: [...skills.technical], professional: [...skills.professional] })
    setNewTechnicalSkill("")
    setNewProfessionalSkill("")
    setSkillsModalOpen(true)
  }

  const addTechnicalSkill = () => {
    if (newTechnicalSkill.trim()) {
      setTempSkills({ ...tempSkills, technical: [...tempSkills.technical, newTechnicalSkill.trim()] })
      setNewTechnicalSkill("")
    }
  }

  const addProfessionalSkill = () => {
    if (newProfessionalSkill.trim()) {
      setTempSkills({ ...tempSkills, professional: [...tempSkills.professional, newProfessionalSkill.trim()] })
      setNewProfessionalSkill("")
    }
  }

  const removeTechnicalSkill = (index: number) => {
    setTempSkills({ ...tempSkills, technical: tempSkills.technical.filter((_, i) => i !== index) })
  }

  const removeProfessionalSkill = (index: number) => {
    setTempSkills({ ...tempSkills, professional: tempSkills.professional.filter((_, i) => i !== index) })
  }

  const saveSkills = () => {
    setSkills(tempSkills)
    syncToDb(personalData, workExperience, education, tempSkills)
    setSkillsModalOpen(false)
  }

  const handleRunPoc = () => {
    const totalExperienceYears = tempWork.reduce((acc, current) => {
      // Very rough experience estimation for PoC
      return acc + 2;
    }, 0);

    const dto: ProfileDto = {
      fullName: personalData.fullName,
      phone: personalData.phone,
      location: personalData.city,
      desiredPosition: workExperience[0]?.position || "Специалист",
      experienceYears: totalExperienceYears,
      education: education,
      workExperience: workExperience,
      skills: skills,
      aboutMe: `Telegram: ${personalData.telegram}\nGitHub: ${personalData.github}\nEmail: ${personalData.email}`,
    }

    runPoc(dto, {
      onSuccess: (_data: PocRunResponseDto) => {
        toast.success("Анализ успешно завершен!")
        router.push("/poc/result")
      },
      onError: (error: Error) => {
        toast.error("Ошибка при запуске алгоритма", {
          description: error.message || "Убедитесь, что бэкенд и Agent запущены"
        })
      }
    })
  }

  const progressStages = [
    { text: "Анализируем ваш профиль...", tip: "ИИ вытягивает ключевые навыки из вашего опыта." },
    { text: "Ищем подходящие вакансии...", tip: "Сверяем ваши данные с базой HeadHunter." },
    { text: "Пишем идеальное резюме...", tip: "Адаптируем достижения под лучшие предложения." },
    { text: "Формируем рекомендации...", tip: "Почти готово! Собираем советы для вас." },
  ]
  const [currentStage, setCurrentStage] = useState(0)

  useEffect(() => {
    if (isPending) {
      setCurrentStage(0);
      const interval = setInterval(() => {
        setCurrentStage(prev => (prev < progressStages.length - 1 ? prev + 1 : prev));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPending]);

  return (
    <div className="space-y-6 relative">
      {/* AI Analysis Overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl border-blue-500/30 overflow-hidden">
            <div className="h-1 w-full bg-muted">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000 ease-in-out" 
                style={{ width: `${((currentStage + 1) / progressStages.length) * 100}%` }}
              />
            </div>
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full relative z-10 shadow-lg">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2 animate-pulse">{progressStages[currentStage].text}</h2>
              <p className="text-muted-foreground text-sm">{progressStages[currentStage].tip}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
      </div>

      {/* Personal Data */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Личные данные</h2>
            </div>
            <Button onClick={openPersonalModal} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Редактировать →
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">ФИО:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">{personalData.fullName}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">{personalData.email}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Телефон:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">{personalData.phone}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Город:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">{personalData.city}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Ссылка для обратной связи:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">{personalData.telegram}</span>
            </p>
            <p>
              <span className="text-muted-foreground">GitHub:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">{personalData.github}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Опыт работы</h2>
            </div>
            <Button onClick={openWorkModal} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Редактировать →
            </Button>
          </div>
          <div className="space-y-6">
            {workExperience.map((work) => (
              <div key={work.id} className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Должность:</span>{" "}
                  <span className="text-blue-600 dark:text-blue-400">{work.position}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Место работы:</span>{" "}
                  <span className="text-blue-600 dark:text-blue-400">{work.company}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Время работы:</span>{" "}
                  <span className="text-blue-600 dark:text-blue-400">{work.period}</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Образование</h2>
            </div>
            <Button onClick={openEducationModal} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Редактировать →
            </Button>
          </div>
          <div className="space-y-6">
            {education.map((edu) => (
              <div key={edu.id} className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Место:</span>{" "}
                  <span className="text-blue-600 dark:text-blue-400">{edu.institution}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Направление:</span>{" "}
                  <span className="text-blue-600 dark:text-blue-400">{edu.degree}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Год окончания обучения:</span>{" "}
                  <span className="text-blue-600 dark:text-blue-400">{edu.year}</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Skills — unified card with raw + AI-normalized */}
      <UnifiedSkillsCard
        technicalSkills={skills.technical}
        professionalSkills={skills.professional}
        normalizedSkills={profileData?.profileSkills ?? []}
        onEdit={openSkillsModal}
      />

      {/* Personal Data Modal */}
      <Dialog open={personalModalOpen} onOpenChange={setPersonalModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Редактировать личные данные</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-card-foreground">ФИО</Label>
              <Input
                value={tempPersonal.fullName}
                onChange={(e) => setTempPersonal({ ...tempPersonal, fullName: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Email</Label>
              <Input
                value={tempPersonal.email}
                onChange={(e) => setTempPersonal({ ...tempPersonal, email: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Телефон</Label>
              <Input
                value={tempPersonal.phone}
                onChange={(e) => setTempPersonal({ ...tempPersonal, phone: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Город</Label>
              <Input
                value={tempPersonal.city}
                onChange={(e) => setTempPersonal({ ...tempPersonal, city: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Telegram</Label>
              <Input
                value={tempPersonal.telegram}
                onChange={(e) => setTempPersonal({ ...tempPersonal, telegram: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">GitHub</Label>
              <Input
                value={tempPersonal.github}
                onChange={(e) => setTempPersonal({ ...tempPersonal, github: e.target.value })}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPersonalModalOpen(false)}
              className="bg-transparent border-border"
            >
              Отмена
            </Button>
            <Button onClick={savePersonalData} className="bg-blue-600 hover:bg-blue-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Experience Modal */}
      <Dialog open={workModalOpen} onOpenChange={setWorkModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Редактировать опыт работы</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {tempWork.map((work, index) => (
              <div key={work.id} className="space-y-3 p-4 border border-border rounded-lg relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeWorkExperience(work.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium text-muted-foreground">Место работы #{index + 1}</p>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Должность</Label>
                  <Input
                    value={work.position}
                    onChange={(e) => updateWorkExperience(work.id, "position", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Компания</Label>
                  <Input
                    value={work.company}
                    onChange={(e) => updateWorkExperience(work.id, "company", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Период</Label>
                  <Input
                    value={work.period}
                    onChange={(e) => updateWorkExperience(work.id, "period", e.target.value)}
                    placeholder="2020 - настоящее время"
                    className="bg-background border-border"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addWorkExperience} className="w-full bg-transparent border-border">
              <Plus className="h-4 w-4 mr-2" /> Добавить место работы
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkModalOpen(false)} className="bg-transparent border-border">
              Отмена
            </Button>
            <Button onClick={saveWorkExperience} className="bg-blue-600 hover:bg-blue-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Modal */}
      <Dialog open={educationModalOpen} onOpenChange={setEducationModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Редактировать образование</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {tempEducation.map((edu, index) => (
              <div key={edu.id} className="space-y-3 p-4 border border-border rounded-lg relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeEducation(edu.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium text-muted-foreground">Образование #{index + 1}</p>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Учебное заведение</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Направление/Степень</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-card-foreground">Год окончания</Label>
                  <Input
                    value={edu.year}
                    onChange={(e) => updateEducation(edu.id, "year", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addEducation} className="w-full bg-transparent border-border">
              <Plus className="h-4 w-4 mr-2" /> Добавить образование
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEducationModalOpen(false)}
              className="bg-transparent border-border"
            >
              Отмена
            </Button>
            <Button onClick={saveEducation} className="bg-blue-600 hover:bg-blue-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skills Modal */}
      <Dialog open={skillsModalOpen} onOpenChange={setSkillsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Редактировать навыки</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-card-foreground font-semibold">Технические навыки</Label>
              <div className="flex flex-wrap gap-2">
                {tempSkills.technical.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                  >
                    {skill}
                    <button onClick={() => removeTechnicalSkill(i)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTechnicalSkill}
                  onChange={(e) => setNewTechnicalSkill(e.target.value)}
                  placeholder="Добавить навык..."
                  onKeyDown={(e) => e.key === "Enter" && addTechnicalSkill()}
                  className="bg-background border-border"
                />
                <Button onClick={addTechnicalSkill} size="icon" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-card-foreground font-semibold">Профессиональные навыки</Label>
              <div className="flex flex-wrap gap-2">
                {tempSkills.professional.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm"
                  >
                    {skill}
                    <button onClick={() => removeProfessionalSkill(i)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newProfessionalSkill}
                  onChange={(e) => setNewProfessionalSkill(e.target.value)}
                  placeholder="Добавить навык..."
                  onKeyDown={(e) => e.key === "Enter" && addProfessionalSkill()}
                  className="bg-background border-border"
                />
                <Button onClick={addProfessionalSkill} size="icon" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSkillsModalOpen(false)}
              className="bg-transparent border-border"
            >
              Отмена
            </Button>
            <Button onClick={saveSkills} className="bg-blue-600 hover:bg-blue-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
}
