"use client"

import { useState } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, RefreshCw, ArrowRight } from "lucide-react"
import type { CareerAssessmentRecord, CareerPathResult } from "./api/use-career-assessment"

interface Props {
  assessment: CareerAssessmentRecord
  onRetake: () => void
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-muted-foreground'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20'
  if (score >= 60) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-muted border-border'
}

function PathCard({ path, rank }: { path: CareerPathResult; rank: number }) {
  const [open, setOpen] = useState(rank === 1)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{medals[rank - 1] ?? rank}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-base leading-tight">{path.role}</h3>
              <span className="text-xs text-muted-foreground capitalize">{path.domain}</span>
            </div>
          </div>
          <div className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${scoreBg(path.matchScore)} ${scoreColor(path.matchScore)}`}>
            {path.matchScore}%
          </div>
        </div>

        {/* Match reason */}
        <p className="text-sm text-muted-foreground leading-relaxed">{path.matchReason}</p>

        {/* Current skills + to learn */}
        <div className="flex flex-wrap gap-4 text-xs">
          {path.currentSkillsMatch?.length > 0 && (
            <div className="space-y-1">
              <p className="text-muted-foreground font-medium">Уже есть:</p>
              <div className="flex flex-wrap gap-1">
                {path.currentSkillsMatch.map((s) => (
                  <span key={s} className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 border border-emerald-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {path.skillsToLearn?.length > 0 && (
            <div className="space-y-1">
              <p className="text-muted-foreground font-medium">Изучить:</p>
              <div className="flex flex-wrap gap-1">
                {path.skillsToLearn.map((s) => (
                  <span key={s} className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 border border-blue-500/20">
                    + {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Salary */}
        {path.salaryRange && (
          <p className="text-sm">
            <span className="text-muted-foreground">Зарплата: </span>
            <span className="font-semibold text-foreground">{path.salaryRange}</span>
          </p>
        )}

        {/* Roadmap toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 transition-colors"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {open ? 'Скрыть роадмап' : 'Показать путь роста'}
        </button>

        {/* Roadmap steps */}
        {open && path.roadmap?.length > 0 && (
          <div className="space-y-2 border-l-2 border-border pl-4">
            {path.roadmap.map((step, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-blue-500/20 border-2 border-blue-500" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{step.level}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">{step.timeframe}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  {step.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {step.skills.map((s) => (
                        <span key={s} className="text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pros / Cons */}
        {((path.pros?.length ?? 0) > 0 || (path.cons?.length ?? 0) > 0) && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {path.pros?.length > 0 && (
              <div className="space-y-1">
                {path.pros.map((p) => (
                  <div key={p} className="flex items-start gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px" />
                    {p}
                  </div>
                ))}
              </div>
            )}
            {path.cons?.length > 0 && (
              <div className="space-y-1">
                {path.cons.map((c) => (
                  <div key={c} className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <XCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CareerPathResult({ assessment, onRetake }: Props) {
  const { result } = assessment

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <Card className="border-border bg-card">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">Ваш карьерный профиль</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.personalitySummary}</p>
              {result.dominantTraits?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.dominantTraits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetake}
              className="shrink-0 gap-1.5 bg-transparent border-border hover:border-blue-500/50 hover:text-blue-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Пересдать
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 paths */}
      {result.topPaths?.map((path) => (
        <PathCard key={path.role} path={path} rank={path.rank} />
      ))}
    </div>
  )
}
