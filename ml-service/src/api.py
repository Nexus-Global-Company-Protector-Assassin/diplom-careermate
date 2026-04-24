"""FastAPI entry point for the ml-service."""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .config import settings
from .serving.predictor import Predictor

logger = logging.getLogger(__name__)

predictor: Predictor


@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor
    predictor = Predictor(settings.models_dir)
    logger.info(f"[API] ml-service started. model_version={predictor.model_version}")
    yield
    logger.info("[API] ml-service shutting down")


app = FastAPI(
    title="CareerMate ML Ranking Service",
    version="0.1.0",
    lifespan=lifespan,
)


# ── Request / Response schemas ──────────────────────────────────────────────

class VacancyCandidate(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    salary_from: int | None = None
    salary_to: int | None = None
    schedule: str | None = None
    location: str | None = None
    skill_count: int = 0
    days_old: int = 0


class RankRequest(BaseModel):
    profile_id: str
    candidate_ids: list[str] = Field(default_factory=list)
    # Full vacancy details — send from NestJS to avoid a round-trip DB call.
    # If omitted, the service ranks by candidate_ids only using stub scores.
    candidates: list[VacancyCandidate] = Field(default_factory=list)
    # Pre-computed preference vector from UserPreferencesService
    profile_features: dict[str, Any] = Field(default_factory=dict)
    total_interactions: int = 0
    positive_interactions: int = 0


class RankedVacancy(BaseModel):
    vacancy_id: str
    score: float


class RankResponse(BaseModel):
    ranked: list[RankedVacancy]
    model_version: str
    is_shadow: bool
    ranked_at: str


# ── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_version": predictor.model_version,
        "shadow_mode": settings.shadow_mode,
    }


@app.post("/ml/rank", response_model=RankResponse)
def rank(req: RankRequest):
    if not req.candidate_ids and not req.candidates:
        raise HTTPException(status_code=422, detail="Provide candidate_ids or candidates")

    # Build candidate list with details
    candidates_with_details: list[dict] = []
    if req.candidates:
        for c in req.candidates:
            candidates_with_details.append(c.model_dump())
    else:
        # No vacancy details provided — create stub entries with just the id
        for cid in req.candidate_ids:
            candidates_with_details.append({"id": cid})

    ranked = predictor.predict(
        profile_features=req.profile_features,
        vacancies=candidates_with_details,
        total_interactions=req.total_interactions,
        positive_interactions=req.positive_interactions,
    )

    return RankResponse(
        ranked=[RankedVacancy(**r) for r in ranked],
        model_version=predictor.model_version,
        is_shadow=settings.shadow_mode,
        ranked_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/ml/reload")
def reload_model():
    """Hot-reload the latest model without restarting the service."""
    predictor.reload()
    return {"model_version": predictor.model_version}


@app.post("/ml/train")
def trigger_training(min_samples: int = 500):
    """Trigger a training run (for manual use / cron). Returns immediately."""
    import asyncio
    from .training.trainer import train

    async def _train():
        version = train(min_samples=min_samples)
        if version:
            predictor.reload()

    asyncio.create_task(_train())
    return {"status": "training started", "min_samples": min_samples}
