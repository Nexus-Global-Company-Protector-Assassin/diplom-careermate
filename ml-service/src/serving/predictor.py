"""
Model loading and prediction.

When a trained model exists in models_dir, loads and uses it.
Falls back to a heuristic stub scorer based on cross-features when no model is available.
This allows the service to be deployed and called immediately before any training data exists.
"""
from __future__ import annotations
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

from ..features import user_features, vacancy_features, cross_features

logger = logging.getLogger(__name__)

_FEATURE_ORDER = [
    # user features
    "pref_archetype_backend", "pref_archetype_frontend", "pref_archetype_fullstack",
    "pref_archetype_devops", "pref_archetype_ml_data", "pref_archetype_mobile",
    "pref_archetype_qa", "pref_archetype_manager",
    "pref_salary_low", "pref_salary_mid", "pref_salary_high",
    "pref_work_remote", "pref_work_onsite",
    "pref_seniority_junior", "pref_seniority_mid", "pref_seniority_senior", "pref_seniority_lead",
    "total_interactions", "positive_interaction_ratio",
    # vacancy features
    "archetype_backend", "archetype_frontend", "archetype_fullstack",
    "archetype_devops", "archetype_ml_data", "archetype_mobile",
    "archetype_qa", "archetype_manager",
    "salary_band_low", "salary_band_mid", "salary_band_high",
    "salary_normalized", "work_format_remote", "work_format_onsite",
    "seniority_junior", "seniority_mid", "seniority_senior", "seniority_lead",
    "has_salary", "freshness_score", "skill_count",
    # cross features
    "archetype_alignment", "salary_alignment", "format_alignment",
    "seniority_alignment", "combined_preference_alignment",
]


class Predictor:
    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self._model = None
        self._model_version = "stub-v0"
        self._load_latest()

    def _load_latest(self) -> None:
        """Try to load the most recently saved model."""
        if not self.models_dir.exists():
            return
        candidates = sorted(self.models_dir.glob("ranker_v*.pkl"), reverse=True)
        if not candidates:
            logger.info("[Predictor] No trained model found — using stub heuristic scorer")
            return
        path = candidates[0]
        try:
            self._model = joblib.load(path)
            self._model_version = path.stem  # e.g. "ranker_v20260501_120000"
            logger.info(f"[Predictor] Loaded model: {path.name}")
        except Exception as e:
            logger.warning(f"[Predictor] Failed to load {path}: {e}")

    def predict(
        self,
        profile_features: dict,
        vacancies: list[dict],
        total_interactions: int = 0,
        positive_interactions: int = 0,
    ) -> list[dict]:
        """
        Returns vacancies ranked by predicted P(positive_interaction).
        Each item: { vacancy_id, score }.
        """
        if not vacancies:
            return []

        user_vec = user_features.extract(
            profile_features, total_interactions, positive_interactions
        )

        scores: list[tuple[str, float]] = []

        for v in vacancies:
            vac_vec = vacancy_features.extract(
                title=v.get("title", ""),
                description=v.get("description", ""),
                salary_from=v.get("salary_from"),
                salary_to=v.get("salary_to"),
                schedule=v.get("schedule"),
                location=v.get("location"),
                skill_count=v.get("skill_count", 0),
                days_old=v.get("days_old", 0),
            )
            cross_vec = cross_features.compute(user_vec, vac_vec)

            if self._model is not None:
                feature_row = [
                    *[user_vec.get(k, 0.0) for k in _FEATURE_ORDER if k in user_vec],  # type: ignore[arg-type]
                    *[vac_vec.get(k, 0.0) for k in _FEATURE_ORDER if k in vac_vec],    # type: ignore[arg-type]
                    *[cross_vec.get(k, 0.0) for k in _FEATURE_ORDER if k in cross_vec],
                ]
                score = float(self._model.predict_proba([feature_row])[0][1])
            else:
                # Stub: use combined_preference_alignment + freshness as proxy score
                score = (
                    0.6 * cross_vec["combined_preference_alignment"] +
                    0.4 * vac_vec["freshness_score"]
                )

            scores.append((v["id"], score))

        scores.sort(key=lambda x: x[1], reverse=True)
        return [{"vacancy_id": vid, "score": round(s, 6)} for vid, s in scores]

    @property
    def model_version(self) -> str:
        return self._model_version

    def reload(self) -> None:
        """Hot-reload latest model without restarting the service."""
        self._model = None
        self._model_version = "stub-v0"
        self._load_latest()
