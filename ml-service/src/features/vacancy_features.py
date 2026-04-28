"""Vacancy feature extraction for ML ranking."""
from __future__ import annotations
import re
from typing import TypedDict


class VacancyFeatureVector(TypedDict):
    archetype_backend: float
    archetype_frontend: float
    archetype_fullstack: float
    archetype_devops: float
    archetype_ml_data: float
    archetype_mobile: float
    archetype_qa: float
    archetype_manager: float
    salary_band_low: float
    salary_band_mid: float
    salary_band_high: float
    salary_normalized: float  # 0-1 relative to market avg (80k GBP)
    work_format_remote: float
    work_format_onsite: float
    seniority_junior: float
    seniority_mid: float
    seniority_senior: float
    seniority_lead: float
    has_salary: float
    freshness_score: float  # 0-1, 1 = very fresh
    skill_count: float  # normalized log(skill_count+1)/log(50)


_ARCHETYPES = {
    "ml_data": ["machine learning", "ml ", "data science", "data scientist", "nlp",
                "deep learning", "pytorch", "tensorflow", "sklearn", "data analyst",
                "data engineer", "etl", "spark", "hadoop", "airflow", "bigquery"],
    "devops": ["devops", "sre", "site reliability", "kubernetes", "k8s", "docker",
               "terraform", "ansible", "ci/cd", "jenkins", "gitlab ci", "infrastructure",
               "platform engineer"],
    "mobile": ["android", "ios", "swift", "kotlin", "react native", "flutter", "mobile"],
    "frontend": ["frontend", "front-end", "react", "vue", "angular", "svelte",
                 "next.js", "nuxt", "ui developer", "web developer"],
    "backend": ["backend", "back-end", "node.js", "python developer", "java developer",
                "golang", "go developer", "php", "ruby", "spring", "django",
                "fastapi", "nestjs"],
    "fullstack": ["fullstack", "full stack", "full-stack"],
    "qa": ["qa ", "quality assurance", "tester", "automation qa", "manual qa",
           "sdet", "selenium", "cypress", "playwright"],
    "manager": ["product manager", "project manager", "engineering manager",
                "team lead", "tech lead", "scrum master", "cto"],
}

_MARKET_AVG_GBP = 80_000.0


def _detect_archetypes(title: str, desc: str) -> dict[str, float]:
    text = f"{title} {desc}".lower()
    scores: dict[str, float] = {}
    for arch, kws in _ARCHETYPES.items():
        hit = sum(1 for kw in kws if kw in text)
        if hit > 0:
            scores[arch] = min(1.0, hit / 3)
    # Fullstack if both frontend + backend strong
    if scores.get("frontend", 0) >= 0.5 and scores.get("backend", 0) >= 0.5:
        scores["fullstack"] = max(scores.get("fullstack", 0), 0.8)
    return scores


def _detect_seniority(title: str) -> dict[str, float]:
    t = title.lower()
    if re.search(r"junior|intern|trainee|стажер", t):
        return {"junior": 1.0}
    if re.search(r"middle|мидл", t):
        return {"mid": 1.0}
    if re.search(r"senior|сеньор|старший", t):
        return {"senior": 1.0}
    if re.search(r"lead|лид|principal|director", t):
        return {"lead": 1.0}
    return {}


def extract(
    title: str,
    description: str,
    salary_from: int | None,
    salary_to: int | None,
    schedule: str | None,
    location: str | None,
    skill_count: int,
    days_old: int,
) -> VacancyFeatureVector:
    arch = _detect_archetypes(title, description)
    sen = _detect_seniority(title)

    avg_salary = None
    if salary_from is not None and salary_to is not None:
        avg_salary = (salary_from + salary_to) / 2
    elif salary_from is not None:
        avg_salary = float(salary_from)
    elif salary_to is not None:
        avg_salary = float(salary_to)

    salary_normalized = min(1.0, avg_salary / (_MARKET_AVG_GBP * 2)) if avg_salary else 0.5
    if avg_salary is not None:
        if avg_salary < 30_000:
            salary_band = {"low": 1.0}
        elif avg_salary <= 70_000:
            salary_band = {"mid": 1.0}
        else:
            salary_band = {"high": 1.0}
    else:
        salary_band = {}

    sched = (schedule or "").lower()
    loc = (location or "").lower()
    if sched or loc:
        is_remote = "удал" in sched or "remote" in sched or "удал" in loc or "remote" in loc
        work_format = {"remote": 1.0} if is_remote else {"onsite": 1.0}
    else:
        work_format = {}

    freshness = max(0.0, 1.0 - days_old / 60.0)

    return VacancyFeatureVector(
        archetype_backend=arch.get("backend", 0.0),
        archetype_frontend=arch.get("frontend", 0.0),
        archetype_fullstack=arch.get("fullstack", 0.0),
        archetype_devops=arch.get("devops", 0.0),
        archetype_ml_data=arch.get("ml_data", 0.0),
        archetype_mobile=arch.get("mobile", 0.0),
        archetype_qa=arch.get("qa", 0.0),
        archetype_manager=arch.get("manager", 0.0),
        salary_band_low=salary_band.get("low", 0.0),
        salary_band_mid=salary_band.get("mid", 0.0),
        salary_band_high=salary_band.get("high", 0.0),
        salary_normalized=salary_normalized,
        work_format_remote=work_format.get("remote", 0.0),
        work_format_onsite=work_format.get("onsite", 0.0),
        seniority_junior=sen.get("junior", 0.0),
        seniority_mid=sen.get("mid", 0.0),
        seniority_senior=sen.get("senior", 0.0),
        seniority_lead=sen.get("lead", 0.0),
        has_salary=1.0 if avg_salary is not None else 0.0,
        freshness_score=freshness,
        skill_count=min(1.0, __import__("math").log1p(skill_count) / __import__("math").log1p(50)),
    )
