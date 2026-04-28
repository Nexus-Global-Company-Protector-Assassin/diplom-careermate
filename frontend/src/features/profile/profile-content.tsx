"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Label } from "@/shared/ui/label"
import { User, Briefcase, GraduationCap, Wrench, X, Plus, Trash2, Upload, Loader2, Sparkles, Settings2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/shared/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { useRouter } from "next/navigation"
import { useRunPoc } from "@/features/poc/api/use-run-poc"
import { ProfileDto, PocRunResponseDto } from "@/shared/api"
import { toast } from "sonner"
import { useProfile, useUpdateProfile } from "./api/use-profile"
import { useSkillsDictionary } from "./api/use-skills"
import { getAccessToken } from "@/shared/lib/auth"
import { UnifiedSkillsCard } from "./skills-analysis-card"
import { ProfileCompletenessCard } from "./profile-completeness-card"
import { ResumeImportModal } from "./resume-import-modal"

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
  description: string
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

interface Preferences {
  workFormat: string
  companyType: string
  managementStyle: string
}

const WORK_FORMAT_OPTIONS = [
  { value: 'remote', label: 'Удалённо' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'onsite', label: 'В офисе' },
]

const COMPANY_TYPE_OPTIONS = [
  { value: 'startup', label: 'Стартап' },
  { value: 'scaleup', label: 'Scale-up' },
  { value: 'enterprise', label: 'Корпорация' },
  { value: 'agency', label: 'Агентство' },
  { value: 'product', label: 'Продуктовая компания' },
]

const MANAGEMENT_STYLE_OPTIONS = [
  { value: 'flat', label: 'Плоская иерархия' },
  { value: 'structured', label: 'Структурированная' },
  { value: 'autonomous', label: 'Автономная работа' },
  { value: 'mentorship', label: 'Менторство и рост' },
]

function SkillCombobox({
  onAdd,
  exclude,
  color = "blue",
  placeholder = "Поиск навыка...",
}: {
  onAdd: (name: string) => void
  exclude: string[]
  color?: "blue" | "emerald"
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)
  const { data: dictionary = [] } = useSkillsDictionary()

  const excludeLower = new Set(exclude.map(s => s.toLowerCase()))
  const suggestions = dictionary
    .filter(s => !excludeLower.has(s.name.toLowerCase()) && s.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 15)

  const commit = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setQuery("")
    setOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const showDropdown = open && (suggestions.length > 0 || query.length > 1)
  const btnCls = color === "emerald"
    ? "bg-emerald-600 hover:bg-emerald-700"
    : "bg-blue-600 hover:bg-blue-700"

  return (
    <div ref={wrapRef} className="flex gap-2 relative">
      <div className="relative flex-1">
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); commit(query) }
            if (e.key === "Escape") setOpen(false)
            if (e.key === "ArrowDown" && suggestions.length > 0) {
              const first = wrapRef.current?.querySelector<HTMLButtonElement>("[data-skill-item]")
              first?.focus()
            }
          }}
          placeholder={placeholder}
          className="bg-background border-border w-full"
        />
        {showDropdown && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] rounded-md border border-border bg-popover shadow-lg overflow-hidden">
            <div className="max-h-52 overflow-y-auto">
              {suggestions.length === 0 && query.length > 1 && (
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                  onMouseDown={e => { e.preventDefault(); commit(query) }}
                >
                  Добавить «<span className="font-medium">{query}</span>»
                </button>
              )}
              {suggestions.map(skill => (
                <button
                  key={skill.id}
                  data-skill-item
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent transition-colors focus:bg-accent focus:outline-none"
                  onMouseDown={e => { e.preventDefault(); commit(skill.name) }}
                >
                  <span>{skill.name}</span>
                  {skill.category && (
                    <span className="text-xs text-muted-foreground ml-3 shrink-0">{skill.category}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <Button onMouseDown={e => { e.preventDefault(); commit(query) }} size="icon" className={btnCls}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ProfileContent() {
  const router = useRouter()
  const { data: profileData, isLoading: profileLoading } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()
  const { mutate: runPoc, isPending } = useRunPoc()

  const [importModalOpen, setImportModalOpen] = useState(false)
  const [aboutMe, setAboutMe] = useState("")

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

  const [preferences, setPreferences] = useState<Preferences>({
    workFormat: '',
    companyType: '',
    managementStyle: '',
  })

  // Load from database on mount
  useEffect(() => {
    if (profileData) {
      // Decode email from JWT payload (email is not in Profile, it's on User)
      let emailFromToken = ''
      try {
        const token = getAccessToken()
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          emailFromToken = payload.email || ''
        }
      } catch { /* ignore */ }

      setPersonalData(p => ({
        ...p,
        fullName:  profileData.fullName    || p.fullName,
        phone:     profileData.phone       || p.phone,
        city:      profileData.location    || p.city,
        github:    profileData.githubUrl   || p.github,
        telegram:  profileData.linkedinUrl || p.telegram,
        email:     emailFromToken          || p.email,
      }))

      if (profileData.aboutMe) setAboutMe(profileData.aboutMe)

      // workExperience: DB stores { company, position, startDate, endDate, current }
      // Component needs { id, company, position, period }
      if (Array.isArray(profileData.workExperience)) {
        const mapped = (profileData.workExperience as any[]).map((w, i) => ({
          id:          w.id          || String(Date.now() + i),
          position:    w.position    || '',
          company:     w.company     || '',
          period:      w.period      || (w.startDate
            ? `${w.startDate}${w.current ? ' — настоящее время' : w.endDate ? ` — ${w.endDate}` : ''}`
            : ''),
          description: w.description || '',
        }))
        setWorkExperience(mapped)
      }

      // education: DB stores { institution, field, degree, endYear }
      // Component needs { id, institution, degree, year }
      if (Array.isArray(profileData.education)) {
        const mapped = (profileData.education as any[]).map((e, i) => ({
          id:          e.id          || String(Date.now() + i),
          institution: e.institution || '',
          degree:      e.field       || e.degree || '',
          year:        e.year        || String(e.endYear || ''),
        }))
        setEducation(mapped)
      }

      // skills: DB may be flat string[] or { technical, professional }
      if (profileData.skills) {
        const s = profileData.skills as any
        if (s.technical) {
          setSkills(s)
        } else if (Array.isArray(s)) {
          setSkills({ technical: s as string[], professional: [] })
        }
      }

      setPreferences({
        workFormat: (profileData as any).workFormatPreference || '',
        companyType: (profileData as any).companyTypePreference || '',
        managementStyle: (profileData as any).managementStylePreference || '',
      })
    }
  }, [profileData])

  const syncToDb = (
    pd = personalData,
    we = workExperience,
    ed = education,
    sk = skills,
    prefs = preferences,
    am = aboutMe,
  ) => {
    updateProfile({
      fullName:                   pd.fullName,
      phone:                      pd.phone,
      location:                   pd.city,
      desiredPosition:            we[0]?.position || 'Специалист',
      experienceYears:            we.length * 2,
      education:                  ed,
      workExperience:             we,
      skills:                     sk,
      aboutMe:                    am.trim() || null,
      githubUrl:                  pd.github   || undefined,
      linkedinUrl:                pd.telegram || undefined,
      workFormatPreference:       prefs.workFormat      || undefined,
      companyTypePreference:      prefs.companyType     || undefined,
      managementStylePreference:  prefs.managementStyle || undefined,
    } as any)
  }

  // Modal states
  const [personalModalOpen, setPersonalModalOpen] = useState(false)
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [educationModalOpen, setEducationModalOpen] = useState(false)
  const [skillsModalOpen, setSkillsModalOpen] = useState(false)
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false)
  const [aboutMeModalOpen, setAboutMeModalOpen] = useState(false)
  const [tempAboutMe, setTempAboutMe] = useState("")

  // Temp states for editing
  const [tempPersonal, setTempPersonal] = useState<PersonalData>(personalData)
  const [tempWork, setTempWork] = useState<WorkExperience[]>(workExperience)
  const [tempEducation, setTempEducation] = useState<Education[]>(education)
  const [tempSkills, setTempSkills] = useState<Skills>(skills)
  const [tempPreferences, setTempPreferences] = useState<Preferences>(preferences)

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
    setTempWork([...tempWork, { id: Date.now().toString(), position: "", company: "", period: "", description: "" }])
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
    setSkillsModalOpen(true)
  }

  const removeTechnicalSkill = (index: number) => {
    setTempSkills(s => ({ ...s, technical: s.technical.filter((_, i) => i !== index) }))
  }

  const removeProfessionalSkill = (index: number) => {
    setTempSkills(s => ({ ...s, professional: s.professional.filter((_, i) => i !== index) }))
  }

  const saveSkills = () => {
    setSkills(tempSkills)
    syncToDb(personalData, workExperience, education, tempSkills)
    setSkillsModalOpen(false)
  }

  const handleOpenSection = (section: "personal" | "work" | "skills" | "about") => {
    if (section === "personal" || section === "about") openPersonalModal()
    else if (section === "work") openWorkModal()
    else if (section === "skills") openSkillsModal()
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportModalOpen(true)}
          className="gap-2 bg-transparent border-border hover:border-blue-500/50 hover:text-blue-400"
        >
          <Upload className="h-4 w-4" />
          Импорт из резюме
        </Button>
      </div>

      {profileData && (
        <ProfileCompletenessCard
          profile={profileData}
          onOpenSection={handleOpenSection}
          onOpenImportModal={() => setImportModalOpen(true)}
        />
      )}

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
            {workExperience.map((work, idx) => (
              <div key={`${work.company}-${work.position}-${idx}`} className="space-y-1 text-sm">
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
                {work.description && (
                  <p>
                    <span className="text-muted-foreground">Описание:</span>{" "}
                    <span className="text-card-foreground whitespace-pre-line">{work.description}</span>
                  </p>
                )}
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
            {education.map((edu, idx) => (
              <div key={`${edu.institution}-${idx}`} className="space-y-1 text-sm">
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
      {/* About Me */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">О себе</h2>
            </div>
            <Button onClick={() => { setTempAboutMe(aboutMe); setAboutMeModalOpen(true) }} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Редактировать →
            </Button>
          </div>
          {aboutMe ? (
            <p className="text-sm text-card-foreground whitespace-pre-line">{aboutMe}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Расскажите о себе, своих целях и ценностях — это поможет подбирать более релевантные вакансии.</p>
          )}
        </CardContent>
      </Card>

      {/* Skills — unified card with raw + AI-normalized */}
      <UnifiedSkillsCard
        technicalSkills={skills.technical}
        professionalSkills={skills.professional}
        normalizedSkills={profileData?.profileSkills ?? []}
        onEdit={openSkillsModal}
      />

      {/* Preferences */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Предпочтения поиска</h2>
                <p className="text-xs text-muted-foreground">Влияют на подбор вакансий</p>
              </div>
            </div>
            <Button onClick={() => { setTempPreferences(preferences); setPreferencesModalOpen(true) }} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Редактировать →
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Формат работы:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {WORK_FORMAT_OPTIONS.find(o => o.value === preferences.workFormat)?.label || <span className="text-muted-foreground italic">не указано</span>}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Тип компании:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {COMPANY_TYPE_OPTIONS.find(o => o.value === preferences.companyType)?.label || <span className="text-muted-foreground italic">не указано</span>}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Стиль управления:</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {MANAGEMENT_STYLE_OPTIONS.find(o => o.value === preferences.managementStyle)?.label || <span className="text-muted-foreground italic">не указано</span>}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Data Modal */}
      <Dialog open={personalModalOpen} onOpenChange={setPersonalModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Редактировать личные данные</DialogTitle>
            <DialogDescription className="sr-only">Измените личные данные профиля</DialogDescription>
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
                readOnly
                className="bg-muted border-border text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email привязан к аккаунту и не может быть изменён здесь</p>
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
            <DialogDescription className="sr-only">Добавьте или измените места работы</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {tempWork.map((work, index) => (
              <div key={work.id || index} className="space-y-3 p-4 border border-border rounded-lg relative">
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
                <div className="space-y-2">
                  <Label className="text-card-foreground">Чем занимался / достижения</Label>
                  <Textarea
                    value={work.description}
                    onChange={(e) => updateWorkExperience(work.id, "description", e.target.value)}
                    placeholder="Разрабатывал REST API на NestJS, снизил latency с 400мс до 80мс. Настроил CI/CD, сократив время деплоя с 30 до 5 минут. Участвовал в ревью кода команды из 5 человек."
                    className="bg-background border-border min-h-[100px] resize-y"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Напишите своими словами — что делал, что построил, что улучшил. Это используется для генерации резюме.</p>
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
            <DialogDescription className="sr-only">Добавьте или измените учебные заведения</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {tempEducation.map((edu, index) => (
              <div key={edu.id || index} className="space-y-3 p-4 border border-border rounded-lg relative">
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
            <DialogDescription className="sr-only">Добавьте или удалите навыки</DialogDescription>
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
              <SkillCombobox
                onAdd={skill => setTempSkills(s => ({ ...s, technical: [...s.technical, skill] }))}
                exclude={tempSkills.technical}
                color="blue"
                placeholder="Поиск или добавление навыка..."
              />
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
              <SkillCombobox
                onAdd={skill => setTempSkills(s => ({ ...s, professional: [...s.professional, skill] }))}
                exclude={tempSkills.professional}
                color="emerald"
                placeholder="Поиск или добавление навыка..."
              />
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

      {/* Preferences Modal */}
      <Dialog open={preferencesModalOpen} onOpenChange={setPreferencesModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Предпочтения поиска работы</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">Эти данные улучшают подбор вакансий под вас</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-card-foreground">Формат работы</Label>
              <Select value={tempPreferences.workFormat} onValueChange={v => setTempPreferences(p => ({ ...p, workFormat: v }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Выберите формат..." />
                </SelectTrigger>
                <SelectContent>
                  {WORK_FORMAT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Тип компании</Label>
              <Select value={tempPreferences.companyType} onValueChange={v => setTempPreferences(p => ({ ...p, companyType: v }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Выберите тип компании..." />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Стиль управления</Label>
              <Select value={tempPreferences.managementStyle} onValueChange={v => setTempPreferences(p => ({ ...p, managementStyle: v }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Выберите стиль..." />
                </SelectTrigger>
                <SelectContent>
                  {MANAGEMENT_STYLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreferencesModalOpen(false)} className="bg-transparent border-border">
              Отмена
            </Button>
            <Button onClick={() => {
              setPreferences(tempPreferences)
              syncToDb(personalData, workExperience, education, skills, tempPreferences)
              setPreferencesModalOpen(false)
            }} className="bg-blue-600 hover:bg-blue-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* About Me Modal */}
      <Dialog open={aboutMeModalOpen} onOpenChange={setAboutMeModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">О себе</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Краткий рассказ о себе, целях и ценностях. Используется при генерации резюме и сопроводительных писем.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={tempAboutMe}
              onChange={e => setTempAboutMe(e.target.value)}
              placeholder="Опытный разработчик с фокусом на backend-системы. Увлекаюсь ML и системным дизайном. Ищу команду, где ценят инженерную культуру..."
              className="bg-background border-border min-h-[160px] resize-y"
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-2">{tempAboutMe.length} / 1000 символов</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAboutMeModalOpen(false)} className="bg-transparent border-border">
              Отмена
            </Button>
            <Button onClick={() => {
              setAboutMe(tempAboutMe)
              syncToDb(personalData, workExperience, education, skills, preferences, tempAboutMe)
              setAboutMeModalOpen(false)
            }} className="bg-blue-600 hover:bg-blue-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResumeImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        existingProfile={profileData ?? {}}
      />

    </div>
  )
}
