import { mapParsedToProfile } from "../utils/map-parsed-to-profile"
import { getProfileCompleteness, REQUIRED_FIELDS } from "../utils/profile-completeness"
import type { ParsedProfileDto, ProfileDto } from "../../../shared/api/types"

// ─── mapParsedToProfile ───────────────────────────────────────────────────────

describe("mapParsedToProfile", () => {
  const parsed: ParsedProfileDto = {
    fullName: "Иван Иванов",
    desiredPosition: "Senior Frontend Developer",
    experienceYears: 5,
    aboutMe: "Опытный разработчик",
    careerGoals: "Стать тимлидом",
    skills: ["React", "TypeScript", "Node.js"],
    workExperience: [
      { company: "Яндекс", position: "Frontend Dev", duration: "2 года", description: "Разработка интерфейсов" },
    ],
  }

  const emptyProfile: ProfileDto = {}

  it("заполняет пустой профиль из parsed-данных", () => {
    const result = mapParsedToProfile(parsed, emptyProfile)
    expect(result.fullName).toBe("Иван Иванов")
    expect(result.desiredPosition).toBe("Senior Frontend Developer")
    expect(result.experienceYears).toBe(5)
    expect(result.aboutMe).toBe("Опытный разработчик")
    expect(result.careerGoals).toBe("Стать тимлидом")
    expect(result.skills).toEqual({ technical: ["React", "TypeScript", "Node.js"], professional: [] })
    expect(result.workExperience).toHaveLength(1)
  })

  it("не перезаписывает уже заполненный fullName", () => {
    const existing: ProfileDto = { fullName: "Пётр Петров" }
    const result = mapParsedToProfile(parsed, existing)
    expect(result.fullName).toBeUndefined()
  })

  it("не перезаписывает уже заполненные skills (object format)", () => {
    const existing: ProfileDto = { skills: { technical: ["Vue"], professional: [] } }
    const result = mapParsedToProfile(parsed, existing)
    expect(result.skills).toBeUndefined()
  })

  it("не перезаписывает уже заполненные skills (array format)", () => {
    const existing: ProfileDto = { skills: ["Vue", "Angular"] }
    const result = mapParsedToProfile(parsed, existing)
    expect(result.skills).toBeUndefined()
  })

  it("маппит duration → period в workExperience", () => {
    const result = mapParsedToProfile(parsed, emptyProfile)
    expect(result.workExperience![0].period).toBe("2 года")
    expect(result.workExperience![0].position).toBe("Frontend Dev")
    expect(result.workExperience![0].company).toBe("Яндекс")
    expect(result.workExperience![0].description).toBe("Разработка интерфейсов")
  })

  it("генерирует id для каждой записи workExperience", () => {
    const result = mapParsedToProfile(parsed, emptyProfile)
    expect(typeof result.workExperience![0].id).toBe("string")
    expect(result.workExperience![0].id.length).toBeGreaterThan(0)
  })

  it("возвращает пустой объект если все поля уже заполнены", () => {
    const existing: ProfileDto = {
      fullName: "Пётр",
      desiredPosition: "Lead",
      experienceYears: 10,
      aboutMe: "...",
      careerGoals: "...",
      skills: { technical: ["Go"], professional: [] },
      workExperience: [{ id: "1", position: "CTO", company: "X", period: "5 лет", description: "" }],
    }
    const result = mapParsedToProfile(parsed, existing)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it("не добавляет workExperience если parsed.workExperience пустой", () => {
    const parsedNoWork: ParsedProfileDto = { fullName: "Иван" }
    const result = mapParsedToProfile(parsedNoWork, emptyProfile)
    expect(result.workExperience).toBeUndefined()
  })
})

// ─── getProfileCompleteness ───────────────────────────────────────────────────

describe("getProfileCompleteness", () => {
  it("возвращает score=0 для пустого профиля", () => {
    const { score, missing } = getProfileCompleteness({})
    expect(score).toBe(0)
    expect(missing).toHaveLength(REQUIRED_FIELDS.length)
  })

  it("возвращает score=100 для полного профиля", () => {
    const profile: ProfileDto = {
      fullName: "Иван",
      desiredPosition: "Dev",
      phone: "+7 999 000 00 00",
      location: "Москва",
      workExperience: [{ position: "Dev", company: "X", period: "1 год", description: "" }],
      skills: { technical: ["React"], professional: [] },
      aboutMe: "Разработчик",
    }
    const { score, missing } = getProfileCompleteness(profile)
    expect(score).toBe(100)
    expect(missing).toHaveLength(0)
  })

  it("корректно считает вес: только fullName(20) + desiredPosition(15) → 35", () => {
    const profile: ProfileDto = { fullName: "Иван", desiredPosition: "Dev" }
    const { score } = getProfileCompleteness(profile)
    expect(score).toBe(35)
  })

  it("распознаёт skills в flat array формате", () => {
    const profile: ProfileDto = { skills: ["React", "TypeScript"] }
    const { filled } = getProfileCompleteness(profile)
    expect(filled).toContain("skills")
  })

  it("распознаёт skills в object формате", () => {
    const profile: ProfileDto = { skills: { technical: ["React"], professional: [] } }
    const { filled } = getProfileCompleteness(profile)
    expect(filled).toContain("skills")
  })

  it("пустой workExperience: [] считается незаполненным", () => {
    const profile: ProfileDto = { workExperience: [] }
    const { missing } = getProfileCompleteness(profile)
    expect(missing.map((m) => m.key)).toContain("workExperience")
  })

  it("workExperience с элементами считается заполненным", () => {
    const profile: ProfileDto = {
      workExperience: [{ position: "Dev", company: "X", period: "1 год", description: "" }],
    }
    const { filled } = getProfileCompleteness(profile)
    expect(filled).toContain("workExperience")
  })

  it("missing содержит правильные labels", () => {
    const { missing } = getProfileCompleteness({})
    const labels = missing.map((m) => m.label)
    expect(labels).toContain("ФИО")
    expect(labels).toContain("Опыт работы")
    expect(labels).toContain("Навыки")
  })
})
