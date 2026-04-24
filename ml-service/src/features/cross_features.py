"""Cross (user × vacancy) feature computation."""
from __future__ import annotations
from .user_features import UserFeatureVector
from .vacancy_features import VacancyFeatureVector


def compute(user: UserFeatureVector, vacancy: VacancyFeatureVector) -> dict[str, float]:
    """
    Returns a flat dict of cross features (user × vacancy interactions).
    These capture alignment between what the user prefers and what the vacancy offers.
    """
    # Archetype alignment: dot product of user archetype prefs × vacancy archetype signals
    archetype_alignment = (
        user["pref_archetype_backend"]   * vacancy["archetype_backend"]   +
        user["pref_archetype_frontend"]  * vacancy["archetype_frontend"]  +
        user["pref_archetype_fullstack"] * vacancy["archetype_fullstack"] +
        user["pref_archetype_devops"]    * vacancy["archetype_devops"]    +
        user["pref_archetype_ml_data"]   * vacancy["archetype_ml_data"]   +
        user["pref_archetype_mobile"]    * vacancy["archetype_mobile"]    +
        user["pref_archetype_qa"]        * vacancy["archetype_qa"]        +
        user["pref_archetype_manager"]   * vacancy["archetype_manager"]
    )

    # Salary band alignment
    salary_alignment = (
        user["pref_salary_low"]  * vacancy["salary_band_low"] +
        user["pref_salary_mid"]  * vacancy["salary_band_mid"] +
        user["pref_salary_high"] * vacancy["salary_band_high"]
    )

    # Work format alignment
    format_alignment = (
        user["pref_work_remote"] * vacancy["work_format_remote"] +
        user["pref_work_onsite"] * vacancy["work_format_onsite"]
    )

    # Seniority alignment
    seniority_alignment = (
        user["pref_seniority_junior"]  * vacancy["seniority_junior"]  +
        user["pref_seniority_mid"]     * vacancy["seniority_mid"]     +
        user["pref_seniority_senior"]  * vacancy["seniority_senior"]  +
        user["pref_seniority_lead"]    * vacancy["seniority_lead"]
    )

    # Combined preference alignment (weighted average across dimensions)
    combined_pref = (
        0.40 * archetype_alignment +
        0.25 * salary_alignment +
        0.20 * format_alignment +
        0.15 * seniority_alignment
    )

    return {
        "archetype_alignment": archetype_alignment,
        "salary_alignment": salary_alignment,
        "format_alignment": format_alignment,
        "seniority_alignment": seniority_alignment,
        "combined_preference_alignment": combined_pref,
    }
