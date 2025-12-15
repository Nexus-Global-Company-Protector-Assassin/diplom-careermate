"use client"

import { useState } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { User, Briefcase, GraduationCap, Wrench, X, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"

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
  const [personalData, setPersonalData] = useState<PersonalData>({
    fullName: "Баранов Сергей",
    email: "oldersik@gmail.ru",
    phone: "+7 (900) 123-45-67",
    city: "Владивосток",
    telegram: "https://t.me/skilpadtlof",
    github: "github.com/todovodopush",
  })

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    { id: "1", position: "Middle Data Analyst", company: "Сбер", period: "2018 - 2020" },
    { id: "2", position: "Senior Data Analyst", company: "Озон", period: "2020 г. - настоящее время" },
  ])

  const [education, setEducation] = useState<Education[]>([
    {
      id: "1",
      institution: "Дальневосточный федеральный университет",
      degree: "Магистр прикладной математики",
      year: "2018",
    },
    { id: "2", institution: "Яндекс.Практикум", degree: "Data Science Specialist", year: "2019" },
    { id: "3", institution: "Coursera", degree: "Advanced SQL", year: "2022" },
  ])

  const [skills, setSkills] = useState<Skills>({
    technical: [
      "Python (Pandas, NumPy, Scikit-learn)",
      "SQL (PostgreSQL, BigQuery)",
      "Tableau, Power BI",
      "A/B тестирование",
      "Машинное обучение",
    ],
    professional: [
      "Data Storytelling",
      "Продуктовая аналитика",
      "Работа с кросс-функциональными командами",
      "Постановка задач",
    ],
  })

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
    setSkillsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Профиль</h1>

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

      {/* Skills */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Навыки</h2>
            </div>
            <Button onClick={openSkillsModal} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Редактировать →
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2 text-card-foreground">Технические:</h3>
              <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 space-y-1">
                {skills.technical.map((skill, i) => (
                  <li key={i}>{skill}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-card-foreground">Профессиональные:</h3>
              <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 space-y-1">
                {skills.professional.map((skill, i) => (
                  <li key={i}>{skill}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

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
