"""User feature extraction from profile + interaction history."""
from __future__ import annotations
from typing import TypedDict


class UserFeatureVector(TypedDict):
    # Preference vector (pre-computed by NestJS UserPreferencesService, passed in request)
    pref_archetype_backend: float
    pref_archetype_frontend: float
    pref_archetype_fullstack: float
    pref_archetype_devops: float
    pref_archetype_ml_data: float
    pref_archetype_mobile: float
    pref_archetype_qa: float
    pref_archetype_manager: float
    pref_salary_low: float
    pref_salary_mid: float
    pref_salary_high: float
    pref_work_remote: float
    pref_work_onsite: float
    pref_seniority_junior: float
    pref_seniority_mid: float
    pref_seniority_senior: float
    pref_seniority_lead: float
    # Activity signals
    total_interactions: float       # normalized log(n+1)/log(500)
    positive_interaction_ratio: float  # (apply+analyze+favorite) / total


def extract(
    profile_features: dict,
    total_interactions: int,
    positive_interactions: int,
) -> UserFeatureVector:
    arch = profile_features.get("archetype", {})
    sal = profile_features.get("salary_band", {})
    fmt = profile_features.get("work_format", {})
    sen = profile_features.get("seniority", {})

    import math
    pos_ratio = positive_interactions / max(total_interactions, 1)

    return UserFeatureVector(
        pref_archetype_backend=arch.get("Backend", 0.0),
        pref_archetype_frontend=arch.get("Frontend", 0.0),
        pref_archetype_fullstack=arch.get("Fullstack", 0.0),
        pref_archetype_devops=arch.get("DevOps", 0.0),
        pref_archetype_ml_data=arch.get("ML/Data", 0.0),
        pref_archetype_mobile=arch.get("Mobile", 0.0),
        pref_archetype_qa=arch.get("QA", 0.0),
        pref_archetype_manager=arch.get("Manager", 0.0),
        pref_salary_low=sal.get("low", 0.0),
        pref_salary_mid=sal.get("mid", 0.0),
        pref_salary_high=sal.get("high", 0.0),
        pref_work_remote=fmt.get("remote", 0.0),
        pref_work_onsite=fmt.get("onsite", 0.0),
        pref_seniority_junior=sen.get("junior", 0.0),
        pref_seniority_mid=sen.get("mid", 0.0),
        pref_seniority_senior=sen.get("senior", 0.0),
        pref_seniority_lead=sen.get("lead", 0.0),
        total_interactions=min(1.0, math.log1p(total_interactions) / math.log1p(500)),
        positive_interaction_ratio=pos_ratio,
    )
