import type { ProfileDto } from "@/shared/api/types"

export type FieldKey =
  | "fullName"
  | "desiredPosition"
  | "phone"
  | "location"
  | "workExperience"
  | "skills"
  | "aboutMe"

export interface WeightedField {
  key: FieldKey
  label: string
  weight: number
  section: "personal" | "work" | "skills" | "about"
}

export interface MissingField {
  key: FieldKey
  label: string
  weight: number
  section: WeightedField["section"]
}

export interface ProfileCompletenessResult {
  score: number
  missing: MissingField[]
  filled: FieldKey[]
}

export const REQUIRED_FIELDS: WeightedField[] = [
  { key: "fullName",        label: "ФИО",                  weight: 20, section: "personal" },
  { key: "desiredPosition", label: "Желаемая должность",   weight: 15, section: "personal" },
  { key: "phone",           label: "Телефон",              weight: 10, section: "personal" },
  { key: "location",        label: "Город",                weight: 10, section: "personal" },
  { key: "workExperience",  label: "Опыт работы",          weight: 25, section: "work"     },
  { key: "skills",          label: "Навыки",               weight: 15, section: "skills"   },
  { key: "aboutMe",         label: "О себе",               weight: 5,  section: "about"    },
]

function isFieldFilled(profile: ProfileDto, key: FieldKey): boolean {
  switch (key) {
    case "fullName":        return !!profile.fullName
    case "desiredPosition": return !!profile.desiredPosition
    case "phone":           return !!profile.phone
    case "location":        return !!profile.location
    case "aboutMe":         return !!profile.aboutMe
    case "workExperience": {
      const we = profile.workExperience
      return Array.isArray(we) && we.length > 0
    }
    case "skills": {
      const s = profile.skills
      if (!s) return false
      if (Array.isArray(s)) return s.length > 0
      const typed = s as { technical?: string[]; professional?: string[] }
      return (typed.technical?.length ?? 0) > 0 || (typed.professional?.length ?? 0) > 0
    }
  }
}

export function getProfileCompleteness(profile: ProfileDto): ProfileCompletenessResult {
  const filled: FieldKey[] = []
  const missing: MissingField[] = []
  let score = 0

  for (const field of REQUIRED_FIELDS) {
    if (isFieldFilled(profile, field.key)) {
      filled.push(field.key)
      score += field.weight
    } else {
      missing.push({ key: field.key, label: field.label, weight: field.weight, section: field.section })
    }
  }

  return { score, missing, filled }
}
