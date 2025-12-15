"use client"

import { useState } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  Clock,
  Heart,
  Share2,
  TrendingUp,
  X,
  Check,
  Building2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Checkbox } from "@/shared/ui/checkbox"

const filterTags = ["Data Analyst", "Python", "SQL", "Remote", "Настроить фильтры"]

const stats = [
  { value: "156", label: "Найдено вакансий", change: "+12 за последние 24 часа", positive: true },
  { value: "23", label: "Ваши отклики", change: "6 приглашений работодателями", positive: true },
  { value: "81%", label: "Среднее совпадение", change: "Отличный результат!", positive: true },
]

interface Job {
  id: string
  company: string
  title: string
  location: string
  type: string
  posted: string
  skills: string[]
  salary: string
  match: string
  matchColor: string
  logo: string
}

const initialJobs: Job[] = [
  {
    id: "1",
    company: "Yandex",
    title: "Senior Data Analyst",
    location: "Москва",
    type: "Полная",
    posted: "2 дня назад",
    skills: ["Python", "SQL", "Tableau"],
    salary: "200 000 - 300 000 ₽",
    match: "92%",
    matchColor: "text-green-600 bg-green-50",
    logo: "Y",
  },
  {
    id: "2",
    company: "Sber",
    title: "Data Analyst",
    location: "Удалённо",
    type: "Полная",
    posted: "5 дней назад",
    skills: ["Power BI", "SQL", "Excel"],
    salary: "180 000 - 250 000 ₽",
    match: "81%",
    matchColor: "text-blue-600 bg-blue-50",
    logo: "S",
  },
  {
    id: "3",
    company: "VK",
    title: "Product Analyst",
    location: "Санкт-Петербург",
    type: "Полная",
    posted: "1 неделю назад",
    skills: ["Python", "Clickhouse", "Airflow"],
    salary: "220 000 - 280 000 ₽",
    match: "78%",
    matchColor: "text-blue-600 bg-blue-50",
    logo: "V",
  },
]

const jobTable = [
  {
    id: "t1",
    title: "Data Analyst",
    company: "Yandex",
    date: "12.01.2025",
    status: "Рассматривается",
    statusColor: "bg-blue-500",
  },
  {
    id: "t2",
    title: "Senior Analyst",
    company: "Soar",
    date: "10.10.2025",
    status: "Приглашение",
    statusColor: "bg-green-500",
  },
  {
    id: "t3",
    title: "Data Scientist",
    company: "VK",
    date: "08.11.2025",
    status: "Интервью",
    statusColor: "bg-yellow-500",
  },
]

export function VacanciesContent() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [favorites, setFavorites] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<string[]>([])

  // Filter states
  const [salaryFrom, setSalaryFrom] = useState("")
  const [salaryTo, setSalaryTo] = useState("")
  const [experience, setExperience] = useState("")
  const [remote, setRemote] = useState(false)

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const handleApply = (job: Job) => {
    setSelectedJob(job)
    setApplyModalOpen(true)
  }

  const confirmApply = () => {
    if (selectedJob) {
      setAppliedJobs((prev) => [...prev, selectedJob.id])
      setApplyModalOpen(false)
      setSelectedJob(null)
    }
  }

  const applyFilters = () => {
    // Simple filter logic
    let filtered = initialJobs

    if (remote) {
      filtered = filtered.filter((job) => job.location.toLowerCase().includes("удалённо"))
    }

    setJobs(filtered)
    setFilterModalOpen(false)
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Вакансии</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Найди идеальную работу с помощью AI-подбора</p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Должность, навыки, компании..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-card border-border flex-1 sm:flex-none"
            onClick={() => setFilterModalOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" /> Фильтры
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
            <Sparkles className="h-4 w-4" /> AI-подбор
          </Button>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="flex gap-2 flex-wrap">
        {filterTags.map((tag, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer dark:bg-blue-900/30 dark:text-blue-400"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xl sm:text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-xs mt-1 ${stat.positive ? "text-green-600" : "text-muted-foreground"}`}>
                {stat.positive && <TrendingUp className="h-3 w-3 inline mr-1" />}
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-3 text-card-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              Избранные вакансии ({favorites.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {initialJobs
                .filter((job) => favorites.includes(job.id))
                .map((job) => (
                  <Badge key={job.id} variant="secondary" className="px-3 py-1.5 gap-2">
                    {job.title} • {job.company}
                    <button onClick={() => toggleFavorite(job.id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Jobs */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Рекомендованные вакансии</h2>
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white shrink-0">
                      {job.logo}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-card-foreground">{job.title}</h3>
                        <span className="text-sm text-muted-foreground">• {job.company}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {job.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {job.posted}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {job.skills.map((skill, j) => (
                          <Badge key={j} variant="secondary" className="bg-muted text-muted-foreground">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <p className="font-semibold mt-2 text-card-foreground">{job.salary}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={job.matchColor}>{job.match} match</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                  {appliedJobs.includes(job.id) ? (
                    <Button disabled className="flex-1 sm:flex-none bg-green-500 text-white">
                      <Check className="h-4 w-4 mr-2" /> Отклик отправлен
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleApply(job)}
                      className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600"
                    >
                      Откликнуться
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className={`bg-transparent ${favorites.includes(job.id) ? "text-red-500 border-red-200" : ""}`}
                    onClick={() => toggleFavorite(job.id)}
                  >
                    <Heart className={`h-4 w-4 ${favorites.includes(job.id) ? "fill-red-500" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="bg-transparent">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Вакансия</th>
                <th className="p-4 font-medium">Компания</th>
                <th className="p-4 font-medium">Дата</th>
                <th className="p-4 font-medium">Статус</th>
                <th className="p-4 font-medium">Ответ</th>
              </tr>
            </thead>
            <tbody>
              {jobTable.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-card-foreground">{row.title}</td>
                  <td className="p-4 text-card-foreground">{row.company}</td>
                  <td className="p-4 text-card-foreground">{row.date}</td>
                  <td className="p-4">
                    <Badge className={`${row.statusColor} text-white`}>{row.status}</Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Filter Modal */}
      <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Фильтры поиска</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-card-foreground">Зарплата от</Label>
                <Input
                  type="number"
                  value={salaryFrom}
                  onChange={(e) => setSalaryFrom(e.target.value)}
                  placeholder="100 000"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-card-foreground">Зарплата до</Label>
                <Input
                  type="number"
                  value={salaryTo}
                  onChange={(e) => setSalaryTo(e.target.value)}
                  placeholder="300 000"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-card-foreground">Опыт работы</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Любой" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Любой</SelectItem>
                  <SelectItem value="0-1">Без опыта - 1 год</SelectItem>
                  <SelectItem value="1-3">1-3 года</SelectItem>
                  <SelectItem value="3-5">3-5 лет</SelectItem>
                  <SelectItem value="5+">Более 5 лет</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remote" checked={remote} onCheckedChange={(checked) => setRemote(checked as boolean)} />
              <Label htmlFor="remote" className="text-card-foreground cursor-pointer">
                Только удалённая работа
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFilterModalOpen(false)}
              className="bg-transparent border-border"
            >
              Отмена
            </Button>
            <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
              Применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Modal */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Откликнуться на вакансию</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white">
                  {selectedJob.logo}
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground">{selectedJob.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Ваше резюме "Data Analyst - Современный" будет отправлено работодателю. Вы также можете добавить
                сопроводительное письмо.
              </p>
              <div className="space-y-2">
                <Label className="text-card-foreground">Сопроводительное письмо (опционально)</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Добавьте сопроводительное письмо..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyModalOpen(false)} className="bg-transparent border-border">
              Отмена
            </Button>
            <Button onClick={confirmApply} className="bg-green-500 hover:bg-green-600">
              Отправить отклик
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
