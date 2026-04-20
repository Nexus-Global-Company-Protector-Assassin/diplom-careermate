"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import {
  Wrench, Plus, X, CheckCircle2, Sparkles, ChevronRight, TrendingUp,
} from "lucide-react"
import { NormalizedSkillDto } from "@/shared/api/types"
import { cn } from "@/shared/lib/utils"

/* ─── Category coloring ─────────────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  Frontend:  "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20",
  Backend:   "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400  border-indigo-500/20",
  DevOps:    "bg-orange-500/10 text-orange-600 dark:text-orange-400  border-orange-500/20",
  Data:      "bg-purple-500/10 text-purple-600 dark:text-purple-400  border-purple-500/20",
  Mobile:    "bg-pink-500/10   text-pink-600   dark:text-pink-400    border-pink-500/20",
  Database:  "bg-cyan-500/10   text-cyan-600   dark:text-cyan-400    border-cyan-500/20",
  Tools:     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Soft:      "bg-amber-500/10  text-amber-600  dark:text-amber-400   border-amber-500/20",
}
const CATEGORY_LABELS: Record<string, string> = {
  Frontend: "Frontend", Backend: "Backend", DevOps: "DevOps",
  Data: "Data / ML", Mobile: "Mobile", Database: "Database",
  Tools: "Tools", Soft: "Soft Skills",
}

function NormalizedBadge({ skill }: { skill: NormalizedSkillDto }) {
  const color = CATEGORY_COLORS[skill.category ?? ""] ?? "bg-muted text-muted-foreground border-border"
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", color)}>
      {skill.name}
    </span>
  )
}

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface UnifiedSkillsCardProps {
  /** Raw technical skills array */
  technicalSkills: string[]
  /** Raw professional skills array */
  professionalSkills: string[]
  /** Normalized skills from backend (profileSkills relation) */
  normalizedSkills: Array<{ skill: NormalizedSkillDto }>
  /** Callback to open the edit modal */
  onEdit: () => void
}

export function UnifiedSkillsCard({
  technicalSkills,
  professionalSkills,
  normalizedSkills,
  onEdit,
}: UnifiedSkillsCardProps) {
  const byCategory = useMemo(() => {
    return normalizedSkills.reduce<Record<string, NormalizedSkillDto[]>>((acc, entry) => {
      const cat = entry.skill.category ?? "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(entry.skill);
      return acc;
    }, {});
  }, [normalizedSkills]);

  const totalRaw = technicalSkills.length + professionalSkills.length;
  const hasSkills = totalRaw > 0 || normalizedSkills.length > 0;

  return (
    <Card className="bg-card border-border overflow-hidden">
      {/* Gradient top stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Навыки</h2>
              <p className="text-xs text-muted-foreground">
                Автоматически сгруппированы
              </p>
            </div>
          </div>
          <Button onClick={onEdit} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            Редактировать <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {hasSkills ? (
          <div className="space-y-5">
            {Object.entries(byCategory).map(([category, skills]) => (
              <div key={category}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                  {CATEGORY_LABELS[category] ?? category}
                  <span className="ml-1.5 opacity-50">({skills.length})</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <NormalizedBadge key={s.id} skill={s} />
                  ))}
                </div>
              </div>
            ))}
            
            {normalizedSkills.length === 0 && totalRaw > 0 && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Обрабатываем добавленные навыки...
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Wrench className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground mb-1">Навыки не добавлены</p>
            <p className="text-xs text-muted-foreground mb-4">Укажите стек технологий, чтобы получать лучшие рекомендации вакансий</p>
            <Button variant="outline" size="sm" onClick={onEdit} className="text-blue-600 gap-1.5 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20">
              <Plus className="h-3.5 w-3.5" /> Добавить навыки
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
