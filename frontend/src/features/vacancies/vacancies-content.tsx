"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Loader2,
  ExternalLink,
  FileText,
  Mic,
  Copy,
  Languages,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Checkbox } from "@/shared/ui/checkbox"
import { useRecommendedVacancies, useApplyToVacancy, useToggleFavorite, useAdzunaVacancies, useAdzunaParse, useEvaluateVacancy, useInterviewPrep, useGenerateCoverLetter, Vacancy, VacancySearchFilters } from "./api/use-vacancies"
import { useResumesHistory } from "@/features/resume/api/use-resumes"
import { useProfile } from "@/features/profile/api/use-profile"

const filterTags = ["Data Analyst", "Python", "SQL", "Remote", "Настроить фильтры"]



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
  url?: string | null
  archetype?: string
  matchedSkills?: string[]
  missingSkills?: string[]
  freshnessScore?: number | null
  freshnessLabel?: string | null
  daysOld?: number | null
}

// Vacancy type is imported from use-vacancies.ts (typed against Prisma model)



export function VacanciesContent() {
  const router = useRouter()
  const { data: profile } = useProfile()

  const fallbackPos = profile?.workExperience?.[0]?.position || profile?.workExperience?.[0]?.title || "";
  const dPos = profile?.desiredPosition || fallbackPos;
  const pSalary = profile?.desiredSalaryMin || profile?.desiredSalaryMax || null;

  const extractSkills = (skillsObj: any): string[] => {
    if (!skillsObj) return [];
    if (Array.isArray(skillsObj)) return skillsObj;
    const tech = Array.isArray(skillsObj.technical) ? skillsObj.technical : [];
    const prof = Array.isArray(skillsObj.professional) ? skillsObj.professional : [];
    return [...tech, ...prof];
  };

  const pSkillsFlat = extractSkills(profile?.skills);

  const { data: recommendedJobs, isLoading: isJobsLoading } = useRecommendedVacancies(
    dPos,
    pSkillsFlat,
    pSalary !== null ? pSalary : undefined
  )
  const { mutate: applyToJob } = useApplyToVacancy()
  const { mutate: toggleFavApi } = useToggleFavorite()

  const [jobs, setJobs] = useState<Job[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearchQuery, setActiveSearchQuery] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<string[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")

  // Cover letter states
  const [coverLetter, setCoverLetter] = useState<string>("")
  const [coverLetterLanguage, setCoverLetterLanguage] = useState<'ru' | 'en'>('ru')
  const [coverLetterCopied, setCoverLetterCopied] = useState(false)
  const [coverLetterNoResume, setCoverLetterNoResume] = useState(false)
  const { mutateAsync: generateCoverLetter, isPending: isGeneratingLetter } = useGenerateCoverLetter()

  // Analysis Modal States
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false)
  const [analyzingJob, setAnalyzingJob] = useState<Job | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const { mutateAsync: evaluateVacancy, isPending: isEvaluating } = useEvaluateVacancy()

  // Interview Prep Modal States
  const [interviewModalOpen, setInterviewModalOpen] = useState(false)
  const [interviewJob, setInterviewJob] = useState<Job | null>(null)
  const [interviewResult, setInterviewResult] = useState<any>(null)
  const { mutateAsync: fetchInterviewPrep, isPending: isInterviewLoading } = useInterviewPrep()

  // Resume list for selector
  const { data: resumesHistoryData } = useResumesHistory()
  const savedResumes = resumesHistoryData?.resumes || []

  // Adzuna search
  const [appliedFilters, setAppliedFilters] = useState<VacancySearchFilters>({})
  const { data: adzunaData, isLoading: adzunaLoading } = useAdzunaVacancies({
    query: activeSearchQuery,
    ...appliedFilters
  })
  const { mutateAsync: parseAdzuna, isPending: adzunaParsing } = useAdzunaParse()
  const adzunaVacancies: Vacancy[] = adzunaData || []

  // Filter states
  const [salaryFrom, setSalaryFrom] = useState("")
  const [salaryTo, setSalaryTo] = useState("")
  const [experience, setExperience] = useState("")
  const [remote, setRemote] = useState(false)
  const [location, setLocation] = useState("")

  // Load recommended jobs initially
  useEffect(() => {
    if (recommendedJobs && !activeSearchQuery) {
      setJobs(recommendedJobs)
    }
  }, [recommendedJobs, activeSearchQuery])

  // Known skills for text extraction (mirrors backend)
  const KNOWN_SKILLS = [
    'python', 'javascript', 'typescript', 'java', 'c#', 'c++', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab',
    'react', 'angular', 'vue', 'vue.js', 'next.js', 'nextjs', 'nuxt', 'svelte', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'vite',
    'redux', 'mobx', 'graphql', 'rest api', 'jquery', 'node.js', 'nodejs', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'spring', '.net',
    'sql', 'nosql', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'sqlite', 'oracle',
    'pandas', 'numpy', 'scipy', 'scikit-learn', 'sklearn', 'tensorflow', 'pytorch', 'keras', 'xgboost', 'spark', 'pyspark', 'hadoop',
    'airflow', 'dbt', 'kafka', 'rabbitmq', 'etl', 'machine learning', 'deep learning', 'nlp', 'computer vision',
    'power bi', 'powerbi', 'tableau', 'looker', 'metabase', 'bigquery', 'snowflake', 'redshift', 'databricks',
    'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'google cloud', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab',
    'linux', 'nginx', 'prometheus', 'grafana', 'git', 'jira', 'confluence', 'figma', 'agile', 'scrum', 'microservices', 'system design',
    'jest', 'pytest', 'postman', 'swagger', 'statistics', 'a/b testing', 'regression', 'classification', 'clustering',
    'feature engineering', 'data visualization', 'data analysis', 'data modeling', 'data pipeline', 'time series', 'neural networks',
  ];

  const extractSkillsFromText = (text: string): string[] => {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const skill of KNOWN_SKILLS) {
      const idx = lower.indexOf(skill);
      if (idx !== -1) {
        const before = idx > 0 ? lower[idx - 1] : ' ';
        const after = idx + skill.length < lower.length ? lower[idx + skill.length] : ' ';
        const isBoundary = (c: string) => /[\s,;.()\[\]{}\-\/"'!?:&|<>]/.test(c);
        if (isBoundary(before) && isBoundary(after)) {
          const display = skill.charAt(0).toUpperCase() + skill.slice(1);
          if (!found.includes(display)) found.push(display);
        }
      }
    }
    return found;
  };

  // Match calculation for Adzuna results (synced with backend calcMatch)
  const calcMatchLocal = (v: Vacancy) => {
    const W_ROLE = 0.30;
    const W_SKILLS = 0.30;
    const W_SENIORITY = 0.15;
    const W_SALARY = 0.15;
    const W_DESC = 0.10;

    let roleScore = 0;
    let skillScore = 0;
    let seniorityScore = 0;
    let salaryScore = 0;
    let descScore = 0;

    const vTitle = (v.title || '').toLowerCase();
    const dPosStr = (dPos || '').toLowerCase();
    const pSkills = pSkillsFlat;
    const vSkills = v.skills || [];
    const vDesc = v.descriptionPreview || '';
    const descLower = vDesc.toLowerCase();

    // 1. Role Score
    if (dPosStr && vTitle) {
      const roleKeywords = dPosStr.split(/\s+/).filter((w: string) => w.length > 2);
      if (roleKeywords.length > 0) {
        let matches = 0;
        for (const kw of roleKeywords) { if (vTitle.includes(kw)) matches++; }
        const ratio = matches / roleKeywords.length;
        if (ratio >= 1) roleScore = 100;
        else if (ratio > 0) roleScore = 40 + ratio * 50;
        else roleScore = 10;
      } else { roleScore = 50; }
    } else { roleScore = 50; }

    // 2. Seniority Score
    const getSeniority = (s: string) => {
      if (s.includes("junior") || s.includes("intern") || s.includes("trainee")) return 1;
      if (s.includes("middle")) return 2;
      if (s.includes("senior")) return 3;
      if (s.includes("lead") || s.includes("principal") || s.includes("director")) return 4;
      return 0;
    };
    const vSen = getSeniority(vTitle);
    const dSen = getSeniority(dPosStr);
    if (vSen !== 0 && dSen !== 0) {
      if (vSen === dSen) seniorityScore = 100;
      else if (Math.abs(vSen - dSen) === 1) seniorityScore = 60;
      else seniorityScore = 20;
    } else if (vSen === 0 && dSen === 0) { seniorityScore = 70; }
    else { seniorityScore = 50; }

    // 3. Skills Score — Jaccard + description extraction
    const normalise = (s: string) => s.toLowerCase().trim();
    const allVSkills = new Set(vSkills.map(normalise));
    if (descLower) {
      for (const s of extractSkillsFromText(descLower)) allVSkills.add(normalise(s));
    }
    if (pSkills && pSkills.length > 0 && allVSkills.size > 0) {
      const profSet = new Set(pSkills.map(normalise));
      let matches = 0;
      for (const vs of allVSkills) { if (profSet.has(vs)) matches++; }
      const union = new Set([...profSet, ...allVSkills]);
      const jaccard = matches / union.size;
      const recall = matches / pSkills.length;
      skillScore = Math.min(100, jaccard * 40 + recall * 60);
    } else if (pSkills && pSkills.length > 0) { skillScore = 15; }
    else { skillScore = 50; }

    // 4. Salary Score — smooth proportional curve
    const getCurrencyRate = (cur: string) => {
      const c = (cur || '').toUpperCase();
      if (c.includes('GBP') || c.includes('£')) return 115;
      if (c.includes('USD') || c.includes('$')) return 90;
      if (c.includes('EUR') || c.includes('€')) return 100;
      return 1;
    };
    if (pSalary && (v.salaryFrom || v.salaryTo)) {
      const rate = getCurrencyRate(v.salaryCurrency || v.salaryLabel || '');
      let avg = 0;
      if (v.salaryFrom && v.salaryTo) avg = (v.salaryFrom + v.salaryTo) / 2;
      else if (v.salaryFrom) avg = v.salaryFrom;
      else if (v.salaryTo) avg = v.salaryTo;
      avg = avg * rate;
      const ratio = avg / pSalary;
      if (ratio >= 1.2) salaryScore = 100;
      else if (ratio >= 0.9) salaryScore = 80 + (ratio - 0.9) / 0.3 * 20;
      else if (ratio >= 0.5) salaryScore = 30 + (ratio - 0.5) / 0.4 * 50;
      else salaryScore = Math.max(0, ratio * 60);
    } else if (!pSalary && (v.salaryFrom || v.salaryTo)) {
      const salAvg = ((v.salaryFrom || 0) + (v.salaryTo || 0)) / 2;
      salaryScore = salAvg > 0 ? Math.min(80, 50 + Math.log10(salAvg) * 5) : 50;
    } else { salaryScore = 50; }

    // 5. Description relevance
    if (dPosStr && descLower) {
      const keywords = dPosStr.split(/\s+/).filter((w: string) => w.length > 2);
      if (keywords.length > 0) {
        let hits = 0;
        for (const kw of keywords) {
          const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const count = (descLower.match(regex) || []).length;
          if (count > 0) hits += Math.min(count, 3);
        }
        descScore = Math.min(100, (hits / (keywords.length * 2)) * 100);
      } else { descScore = 50; }
    } else { descScore = 50; }

    let finalScore = roleScore * W_ROLE + skillScore * W_SKILLS + seniorityScore * W_SENIORITY + salaryScore * W_SALARY + descScore * W_DESC;
    if (roleScore <= 10) finalScore *= 0.3;
    if (seniorityScore <= 20) finalScore *= 0.7;

    return Math.max(0, Math.min(100, Math.round(finalScore)));
  };

  // Map Adzuna results into display jobs format when they arrive
  useEffect(() => {
    if (adzunaVacancies.length > 0) {
      const mapped: Job[] = adzunaVacancies.map((v) => {
        const score = calcMatchLocal(v);
        return {
          id: v.id,
          company: v.employer,
          title: v.title,
          location: v.location || "Не указано",
          type: v.schedule || "Полная занятость",
          posted: new Date(v.publishedAt || v.createdAt).toLocaleDateString("ru-RU"),
          skills: v.skills || [],
          salary: v.salaryLabel || "Зарплата не указана",
          match: String(score),
          matchColor: score >= 75
            ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
            : score >= 50
              ? "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
              : "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
          logo: (v.employer || "X").charAt(0).toUpperCase(),
          url: v.url || null,
          archetype: v.archetype,
          matchedSkills: v.matchedSkills,
          missingSkills: v.missingSkills,
          freshnessScore: v.freshnessScore,
          freshnessLabel: v.freshnessLabel,
          daysOld: v.daysOld,
        }
      }).filter((j) => Number(j.match) > 20).sort((a, b) => Number(b.match) - Number(a.match)); // Filter junk and Sort!
      setJobs(mapped)
    }
  }, [adzunaVacancies, profile?.skills, profile?.desiredPosition])

  // Main search handler — calls Adzuna API then loads from DB reactively
  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearchError(null)
    try {
      await parseAdzuna({ query: q, count: 10 })
      setActiveSearchQuery(q)
    } catch (e: any) {
      setSearchError(e.message || "Ошибка при поиске вакансий")
    }
  }

  const toggleFavorite = (id: string) => {
    const isFav = !favorites.includes(id)
    setFavorites((prev) => (isFav ? [...prev, id] : prev.filter((f) => f !== id)))
    toggleFavApi({ vacancyId: id, isFavorite: isFav })
  }

  const handleApply = async (job: Job) => {
    setSelectedJob(job)
    setCoverLetter("")
    setCoverLetterNoResume(false)
    setCoverLetterCopied(false)
    setApplyModalOpen(true)
    try {
      const res = await generateCoverLetter({
        vacancyId: job.id,
        resumeId: selectedResumeId || undefined,
        language: coverLetterLanguage,
      })
      if ('noResume' in res) {
        setCoverLetterNoResume(true)
      } else {
        setCoverLetter(res.coverLetter)
      }
    } catch (e) {
      console.error('Cover letter generation failed', e)
      // Fallback: empty textarea for manual input
    }
  }

  const handleRegenerateLetter = async () => {
    if (!selectedJob) return
    setCoverLetter("")
    setCoverLetterNoResume(false)
    setCoverLetterCopied(false)
    try {
      const res = await generateCoverLetter({
        vacancyId: selectedJob.id,
        resumeId: selectedResumeId || undefined,
        language: coverLetterLanguage,
      })
      if ('noResume' in res) {
        setCoverLetterNoResume(true)
      } else {
        setCoverLetter(res.coverLetter)
      }
    } catch (e) {
      console.error('Cover letter generation failed', e)
    }
  }

  const handleCopyLetter = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter)
      setCoverLetterCopied(true)
      setTimeout(() => setCoverLetterCopied(false), 2000)
    }
  }

  const confirmApply = () => {
    if (selectedJob) {
      applyToJob({ vacancyId: selectedJob.id, coverLetter: coverLetter || undefined })
      setAppliedJobs((prev) => [...prev, selectedJob.id])
      setApplyModalOpen(false)
      setSelectedJob(null)
      setCoverLetter("")
    }
  }

  const handleAnalyze = async (job: Job) => {
    setAnalyzingJob(job)
    setAnalysisResult(null)
    setAnalysisModalOpen(true)
    try {
      const res = await evaluateVacancy({ vacancyId: job.id, resumeId: selectedResumeId || undefined })
      setAnalysisResult(res)
    } catch (e) {
      console.error(e)
    }
  }

  const handleInterviewPrep = async (job: Job) => {
    setInterviewJob(job)
    setInterviewResult(null)
    setInterviewModalOpen(true)
    try {
      const res = await fetchInterviewPrep({ vacancyId: job.id, resumeId: selectedResumeId || undefined })
      setInterviewResult(res)
    } catch (e) {
      console.error(e)
    }
  }

  const applyFilters = () => {
    setAppliedFilters({
      salaryFrom: salaryFrom ? Number(salaryFrom) : undefined,
      salaryTo: salaryTo ? Number(salaryTo) : undefined,
      experience: experience === "any" ? undefined : experience,
      remote: remote || undefined,
      location: location || undefined
    })
    setFilterModalOpen(false)
  }

  const isSearching = adzunaParsing || adzunaLoading

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


      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Должность, навыки, компании..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Sparkles className="h-4 w-4" />
            }
            {isSearching ? "Ищем…" : "AI-подбор"}
          </Button>
        </div>
      </div>
      {searchError && (
        <p className="text-xs text-destructive">{searchError}</p>
      )}

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
        {[
          {
            value: String(jobs.length),
            label: "Найдено вакансий",
            change: activeSearchQuery ? `По запросу: ${activeSearchQuery}` : Object.keys(appliedFilters).length > 0 ? "С учётом фильтров" : "AI-подбор по профилю",
            positive: jobs.length > 0,
          },
          {
            value: String(appliedJobs.length),
            label: "Ваши отклики",
            change: appliedJobs.length > 0 ? `${appliedJobs.length} отправлено` : "Вы пока не откликались",
            positive: appliedJobs.length > 0,
          },
          {
            value: jobs.length > 0
              ? `${Math.round(jobs.reduce((acc, j) => acc + parseInt(j.match), 0) / jobs.length)}%`
              : "—",
            label: "Среднее совпадение",
            change: jobs.length > 0 ? "На основе ваших навыков" : "Нет данных",
            positive: jobs.length > 0,
          },
        ].map((stat, i) => (
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
              {jobs
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Рекомендованные вакансии</h2>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
              <SelectTrigger className="bg-card border-border w-[260px]">
                <SelectValue placeholder="Выберите резюме для подбора" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все резюме</SelectItem>
                {savedResumes.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
                        {job.archetype && job.archetype !== 'Unknown' && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                            {job.archetype}
                          </Badge>
                        )}
                        {job.freshnessScore !== undefined && job.freshnessScore !== null && (
                          <Badge variant="outline" className={`
                            ${job.freshnessScore >= 75 ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" :
                              job.freshnessScore >= 50 ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" :
                              "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                            }
                          `}>
                            {job.freshnessScore < 50 && <span className="mr-1">⚠️</span>}
                            {job.freshnessLabel} {job.daysOld ? `(${job.daysOld} дн.)` : ''}
                          </Badge>
                        )}
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
                        {job.matchedSkills && job.matchedSkills.length > 0 ? (
                           <>
                             {job.matchedSkills.map((skill, j) => (
                               <Badge key={`m-${j}`} variant="secondary" className="bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                 <Check className="h-3 w-3 mr-1 inline" />{skill}
                               </Badge>
                             ))}
                             {job.missingSkills?.map((skill, j) => (
                               <Badge key={`miss-${j}`} variant="secondary" className="bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 opacity-80">
                                 <X className="h-3 w-3 mr-1 inline" />{skill}
                               </Badge>
                             ))}
                             {(!job.missingSkills || job.missingSkills.length === 0) && job.skills.filter(s => !job.matchedSkills?.includes(s.toLowerCase())).map((skill, j) => (
                               <Badge key={j} variant="secondary" className="bg-muted text-muted-foreground">
                                 {skill}
                               </Badge>
                             ))}
                           </>
                        ) : (
                          job.skills.map((skill, j) => (
                            <Badge key={j} variant="secondary" className="bg-muted text-muted-foreground">
                              {skill}
                            </Badge>
                          ))
                        )}
                      </div>
                      <p className="font-semibold mt-2 text-card-foreground">{job.salary}</p>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors mt-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Открыть на Adzuna
                        </a>
                      )}
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
                    className="flex-1 sm:flex-none text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/30"
                    onClick={() => handleAnalyze(job)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" /> Детальный анализ
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/30"
                    onClick={() => handleInterviewPrep(job)}
                  >
                    <Mic className="h-4 w-4 mr-2" /> STAR-подготовка
                  </Button>
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

      {/* Jobs Table — Applied Jobs */}
      {appliedJobs.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Вакансия</th>
                  <th className="p-4 font-medium">Компания</th>
                  <th className="p-4 font-medium">Совпадение</th>
                  <th className="p-4 font-medium">Статус</th>
                  <th className="p-4 font-medium">Ответ</th>
                </tr>
              </thead>
              <tbody>
                {appliedJobs.map((jobId) => {
                  const job = jobs.find((j) => j.id === jobId)
                  if (!job) return null
                  return (
                    <tr key={jobId} className="border-b border-border last:border-0">
                      <td className="p-4 text-card-foreground">{job.title}</td>
                      <td className="p-4 text-card-foreground">{job.company}</td>
                      <td className="p-4"><Badge className={job.matchColor}>{job.match}</Badge></td>
                      <td className="p-4">
                        <Badge className="bg-blue-500 text-white">Отправлено</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">—</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

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
            <div className="space-y-2">
              <Label className="text-card-foreground">Страна / Город</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Например, Москва"
                className="bg-background border-border"
              />
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

      {/* Apply Modal — AI Cover Letter */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              Отклик на вакансию
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="py-2 space-y-4">
              {/* Job info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shrink-0">
                  {selectedJob.logo}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-card-foreground truncate">{selectedJob.title}</h4>
                  <p className="text-xs text-muted-foreground">{selectedJob.company}</p>
                </div>
              </div>

              {/* Language toggle + Regenerate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Язык письма:</span>
                  <div className="flex rounded-md border border-border overflow-hidden text-sm">
                    <button
                      onClick={() => setCoverLetterLanguage('ru')}
                      className={`px-3 py-1 transition-colors ${
                        coverLetterLanguage === 'ru'
                          ? 'bg-blue-600 text-white'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      RU
                    </button>
                    <button
                      onClick={() => setCoverLetterLanguage('en')}
                      className={`px-3 py-1 transition-colors ${
                        coverLetterLanguage === 'en'
                          ? 'bg-blue-600 text-white'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>
                {!isGeneratingLetter && !coverLetterNoResume && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateLetter}
                    className="gap-1.5 text-xs bg-transparent border-border"
                  >
                    <Sparkles className="h-3 w-3" />
                    Перегенерировать
                  </Button>
                )}
              </div>

              {/* Content area */}
              {isGeneratingLetter ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                  <p className="text-sm text-muted-foreground animate-pulse text-center">
                    ✨ Генерируем персонализированное письмо...<br />
                    <span className="text-xs">Анализируем вакансию и ваше резюме</span>
                  </p>
                </div>
              ) : coverLetterNoResume ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Резюме не найдено</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Для генерации письма нужно сначала создать резюме на основе вашего профиля.
                  </p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 gap-2 text-sm"
                    onClick={() => { setApplyModalOpen(false); router.push('/resume'); }}
                  >
                    <FileText className="h-4 w-4" /> Создать резюме
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-card-foreground text-sm">Сопроводительное письмо</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLetter}
                      className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      disabled={!coverLetter}
                    >
                      {coverLetterCopied
                        ? <><Check className="h-3 w-3 text-green-500" /> Скопировано</>  
                        : <><Copy className="h-3 w-3" /> Копировать</>
                      }
                    </Button>
                  </div>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full min-h-[200px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    placeholder={coverLetter ? '' : 'Напишите сопроводительное письмо вручную...'}
                  />
                  {coverLetter && (
                    <p className="text-xs text-muted-foreground text-right">{coverLetter.length} символов</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyModalOpen(false)} className="bg-transparent border-border">
              Отмена
            </Button>
            <Button
              onClick={confirmApply}
              className="bg-green-500 hover:bg-green-600 gap-2"
              disabled={isGeneratingLetter || coverLetterNoResume}
            >
              <Check className="h-4 w-4" />
              Отправить отклик
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analysis Modal */}
      <Dialog open={analysisModalOpen} onOpenChange={setAnalysisModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Глубокий анализ вакансии
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {!analysisResult && isEvaluating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                <p className="text-muted-foreground animate-pulse text-center">Оцениваем компетенции, навыки и зарплату...<br />Это займет несколько секунд.</p>
              </div>
            ) : analysisResult?.noResume ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">Резюме не найдено</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Для проведения глубокого анализа вакансии необходимо сначала сгенерировать резюме на основе вашего профиля.
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={() => { setAnalysisModalOpen(false); router.push('/resume'); }}
                >
                  <FileText className="h-4 w-4" />
                  Создать резюме
                </Button>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg">{analyzingJob?.title}</h3>
                    <p className="text-sm text-muted-foreground">{analyzingJob?.company}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                      {analysisResult.grade}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">{analysisResult.score}/100</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4 bg-background">
                    <h4 className="font-semibold text-foreground flex items-center mb-2"><Check className="h-4 w-4 mr-2 text-green-500" />Резюме роли</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.A_Summary}</p>
                  </div>

                  <div className="border border-border rounded-lg p-4 bg-background">
                    <h4 className="font-semibold text-foreground flex items-center mb-2"><Search className="h-4 w-4 mr-2 text-blue-500" />Совпадение и пробелы</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.B_CV_Match}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-border rounded-lg p-4 bg-background">
                      <h4 className="font-semibold text-foreground mb-2">Стратегия</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.C_Strategy}</p>
                    </div>
                    <div className="border border-border rounded-lg p-4 bg-background">
                      <h4 className="font-semibold text-foreground mb-2">Компенсация</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.D_Compensation}</p>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4 bg-background">
                    <h4 className="font-semibold text-foreground flex items-center mb-2"><FileText className="h-4 w-4 mr-2 text-orange-500" />Персонализация резюме</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.E_Personalization}</p>
                  </div>

                  <div className="border border-border rounded-lg p-4 bg-background mb-4">
                    <h4 className="font-semibold text-foreground flex items-center mb-2"><Check className="h-4 w-4 mr-2 text-purple-500" />План собеседования</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.F_Interview}</p>
                  </div>

                  {analysisResult.G_Legitimacy && (
                    <div className="border border-red-200 dark:border-red-900/50 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10 mb-4">
                      <h4 className="font-semibold text-foreground flex items-center mb-2">
                        <span className="mr-2">🕵️</span> Оценка реальности (Ghost Job Detection)
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`
                            ${analysisResult.G_Legitimacy.verdict?.includes('High') ? "bg-green-100 text-green-800 border-green-200" :
                              analysisResult.G_Legitimacy.verdict?.includes('Caution') ? "bg-orange-100 text-orange-800 border-orange-200" :
                              "bg-red-100 text-red-800 border-red-200"
                            }
                          `}>
                            {analysisResult.G_Legitimacy.verdict}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysisResult.G_Legitimacy.explanation}</p>
                        {analysisResult.G_Legitimacy.signals && analysisResult.G_Legitimacy.signals.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ключевые сигналы:</span>
                            <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                              {analysisResult.G_Legitimacy.signals.map((sig: string, i: number) => (
                                <li key={i}>{sig}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-destructive">Ошибка при анализе.</div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAnalysisModalOpen(false)}>Закрыть</Button>
            {analysisResult && (
              <Button onClick={() => { setAnalysisModalOpen(false); if (analyzingJob) handleApply(analyzingJob); }} className="bg-green-500 hover:bg-green-600">Откликнуться</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Prep STAR+R Modal */}
      <Dialog open={interviewModalOpen} onOpenChange={setInterviewModalOpen}>
        <DialogContent className="sm:max-w-[750px] bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-card-foreground flex items-center gap-2">
              <Mic className="h-5 w-5 text-orange-500" />
              Подготовка к интервью (STAR+R)
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {!interviewResult && isInterviewLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <p className="text-muted-foreground animate-pulse text-center">Генерируем банк историй STAR+R...<br />Анализируем ваш опыт под требования вакансии.</p>
              </div>
            ) : interviewResult?.noResume ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">Резюме не найдено</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Для генерации STAR-историй нужно сначала создать резюме.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => { setInterviewModalOpen(false); router.push('/resume'); }}>
                  <FileText className="h-4 w-4" /> Создать резюме
                </Button>
              </div>
            ) : interviewResult?.questions?.length > 0 ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg">{interviewJob?.title}</h3>
                    <p className="text-sm text-muted-foreground">{interviewJob?.company}</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    {interviewResult.questions.length} вопросов
                  </Badge>
                </div>

                {/* Tips */}
                {interviewResult.tips && (
                  <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
                    <h4 className="font-semibold text-foreground flex items-center mb-2"><Sparkles className="h-4 w-4 mr-2 text-orange-500" />Общие советы</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interviewResult.tips}</p>
                  </div>
                )}

                {/* STAR Questions */}
                <div className="space-y-4">
                  {interviewResult.questions.map((q: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg p-4 bg-background">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-foreground flex-1">
                          <span className="text-orange-500 mr-2">Q{i + 1}.</span>
                          {q.question}
                        </h4>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          {q.category === 'behavioral' ? '🧠 Поведенческий' : q.category === 'technical' ? '⚙️ Технический' : '📋 Ситуационный'}
                        </Badge>
                      </div>
                      {q.star && (
                        <div className="space-y-2 pl-2 border-l-2 border-orange-200 dark:border-orange-800">
                          <div><span className="text-xs font-bold text-orange-600 dark:text-orange-400">S — Ситуация:</span><p className="text-sm text-muted-foreground mt-0.5">{q.star.situation}</p></div>
                          <div><span className="text-xs font-bold text-blue-600 dark:text-blue-400">T — Задача:</span><p className="text-sm text-muted-foreground mt-0.5">{q.star.task}</p></div>
                          <div><span className="text-xs font-bold text-green-600 dark:text-green-400">A — Действия:</span><p className="text-sm text-muted-foreground mt-0.5">{q.star.action}</p></div>
                          <div><span className="text-xs font-bold text-purple-600 dark:text-purple-400">R — Результат:</span><p className="text-sm text-muted-foreground mt-0.5">{q.star.result}</p></div>
                          <div><span className="text-xs font-bold text-pink-600 dark:text-pink-400">R+ — Рефлексия:</span><p className="text-sm text-muted-foreground mt-0.5">{q.star.reflection}</p></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Candidate Questions */}
                {interviewResult.candidate_questions?.length > 0 && (
                  <div className="border border-border rounded-lg p-4 bg-background">
                    <h4 className="font-semibold text-foreground flex items-center mb-3"><Search className="h-4 w-4 mr-2 text-blue-500" />Ваши вопросы работодателю</h4>
                    <ul className="space-y-2">
                      {interviewResult.candidate_questions.map((cq: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-500 font-bold shrink-0">{i + 1}.</span>
                          {cq}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-destructive">Ошибка при генерации подготовки.</div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setInterviewModalOpen(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
