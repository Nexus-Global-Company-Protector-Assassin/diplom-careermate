"use client"

import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { FileText, Plus } from "lucide-react"
import { getProfileCompleteness, type MissingField } from "@/features/profile/utils/profile-completeness"
import type { ProfileDto } from "@/shared/api/types"

interface ProfileCompletenessCardProps {
  profile: ProfileDto
  onOpenSection: (section: "personal" | "work" | "skills" | "about") => void
  onOpenImportModal: () => void
}

function scoreColor(score: number): string {
  if (score < 40) return "bg-red-500"
  if (score < 70) return "bg-amber-500"
  if (score < 100) return "bg-blue-500"
  return "bg-emerald-500"
}

function scoreTextColor(score: number): string {
  if (score < 40) return "text-red-500"
  if (score < 70) return "text-amber-500"
  if (score < 100) return "text-blue-500"
  return "text-emerald-500"
}

export function ProfileCompletenessCard({
  profile,
  onOpenSection,
  onOpenImportModal,
}: ProfileCompletenessCardProps) {
  const { score, missing } = getProfileCompleteness(profile)

  if (score >= 100) return null

  return (
    <Card className="border-border bg-card mb-6">
      <CardContent className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">
                Профиль заполнен на{" "}
                <span className={scoreTextColor(score)}>{score}%</span>
              </span>
              <span className="text-xs text-muted-foreground">{score}/100</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Missing fields */}
        {missing.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Добавьте оставшиеся поля для лучших рекомендаций:
            </p>
            <div className="flex flex-wrap gap-2">
              {missing.map((field: MissingField) => (
                <button
                  key={field.key}
                  onClick={() => onOpenSection(field.section)}
                  className="
                    inline-flex items-center gap-1.5 rounded-full border border-border
                    px-3 py-1 text-xs text-muted-foreground
                    hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5
                    transition-colors cursor-pointer
                  "
                >
                  <Plus className="h-3 w-3" />
                  {field.label}
                  <span className="text-muted-foreground/60">+{field.weight}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Import button */}
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenImportModal}
            className="gap-2 bg-transparent border-border hover:border-blue-500/50 hover:text-blue-400"
          >
            <FileText className="h-4 w-4" />
            Импорт из резюме
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
