import type { ParsedProfileDto, ProfileDto } from "@/shared/api/types"

export interface MappedWorkExperience {
  id: string
  position: string
  company: string
  period: string
  description: string
}

export interface MappedSkills {
  technical: string[]
  professional: string[]
}

export interface MappedProfileData {
  fullName?: string
  desiredPosition?: string
  experienceYears?: number
  workExperience?: MappedWorkExperience[]
  skills?: MappedSkills
  aboutMe?: string
  careerGoals?: string
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isSkillsFilled(skills: ProfileDto["skills"]): boolean {
  if (!skills) return false
  if (Array.isArray(skills)) return skills.length > 0
  const s = skills as { technical?: string[]; professional?: string[] }
  return (s.technical?.length ?? 0) > 0 || (s.professional?.length ?? 0) > 0
}

// Maps ParsedProfileDto from the agent to ProfileDto fields.
// Smart-merge: only fills fields that are empty in the existing profile.
export function mapParsedToProfile(
  parsed: ParsedProfileDto,
  existing: ProfileDto
): MappedProfileData {
  const result: MappedProfileData = {}

  if (parsed.fullName && !existing.fullName) {
    result.fullName = parsed.fullName
  }

  if (parsed.desiredPosition && !existing.desiredPosition) {
    result.desiredPosition = parsed.desiredPosition
  }

  if (parsed.experienceYears != null && !existing.experienceYears) {
    result.experienceYears = parsed.experienceYears
  }

  if (parsed.aboutMe && !existing.aboutMe) {
    result.aboutMe = parsed.aboutMe
  }

  if (parsed.careerGoals && !existing.careerGoals) {
    result.careerGoals = parsed.careerGoals
  }

  const existingWork = existing.workExperience as MappedWorkExperience[] | undefined
  if (
    Array.isArray(parsed.workExperience) &&
    parsed.workExperience.length > 0 &&
    (!existingWork || existingWork.length === 0)
  ) {
    result.workExperience = parsed.workExperience.map((w) => ({
      id: newId(),
      position: w.position,
      company: w.company,
      period: w.duration,
      description: w.description ?? "",
    }))
  }

  if (Array.isArray(parsed.skills) && parsed.skills.length > 0 && !isSkillsFilled(existing.skills)) {
    result.skills = { technical: parsed.skills, professional: [] }
  }

  return result
}
