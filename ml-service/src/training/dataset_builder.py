"""
Dataset builder: PostgreSQL → pandas DataFrame.

Positive examples:  VacancyInteraction WHERE type IN ('analyze', 'apply', 'favorite')
Negative examples:  RecommendationImpression shown but no interaction after 2 days

Run directly:
    python -m src.training.dataset_builder --output data/dataset.csv
"""
from __future__ import annotations
import argparse
import logging
from datetime import datetime, timezone

import pandas as pd
import psycopg2
import psycopg2.extras

from ..config import settings

logger = logging.getLogger(__name__)


_POSITIVE_SQL = """
SELECT
    vi.profile_id,
    vi.vacancy_id,
    1                           AS label,
    vi.type                     AS interaction_type,
    vi.created_at,
    v.title,
    v.description_preview       AS description,
    v.salary_from,
    v.salary_to,
    v.schedule,
    v.location,
    v.published_at,
    v.created_at                AS vacancy_created_at,
    COALESCE(json_array_length(v.skills::json), 0) AS skill_count,
    ARRAY(SELECT ps."skillId" FROM "ProfileSkill" ps WHERE ps."profileId" = vi.profile_id) AS profile_skill_ids,
    ARRAY(SELECT vs."skillId" FROM "VacancySkill"  vs WHERE vs."vacancyId" = vi.vacancy_id) AS vacancy_skill_ids
FROM "VacancyInteraction" vi
JOIN "Vacancy" v ON v.id = vi.vacancy_id
WHERE vi.type IN ('analyze', 'apply', 'favorite')
"""

_NEGATIVE_SQL = """
SELECT
    ri.profile_id,
    ri.vacancy_id,
    0                           AS label,
    'ignored'                   AS interaction_type,
    ri.created_at,
    v.title,
    v.description_preview       AS description,
    v.salary_from,
    v.salary_to,
    v.schedule,
    v.location,
    v.published_at,
    v.created_at                AS vacancy_created_at,
    COALESCE(json_array_length(v.skills::json), 0) AS skill_count,
    ARRAY(SELECT ps."skillId" FROM "ProfileSkill" ps WHERE ps."profileId" = ri.profile_id) AS profile_skill_ids,
    ARRAY(SELECT vs."skillId" FROM "VacancySkill"  vs WHERE vs."vacancyId" = ri.vacancy_id) AS vacancy_skill_ids
FROM "RecommendationImpression" ri
JOIN "Vacancy" v ON v.id = ri.vacancy_id
LEFT JOIN "VacancyInteraction" vi
    ON vi.profile_id = ri.profile_id
    AND vi.vacancy_id = ri.vacancy_id
WHERE vi.id IS NULL
    AND ri.created_at < NOW() - INTERVAL '2 days'
"""

_INTERACTION_COUNTS_SQL = """
SELECT
    profile_id,
    COUNT(*)                                                   AS total_interactions,
    COUNT(*) FILTER (WHERE type IN ('analyze','apply','favorite')) AS positive_interactions
FROM "VacancyInteraction"
GROUP BY profile_id
"""


def build(database_url: str | None = None) -> pd.DataFrame:
    url = database_url or settings.database_url
    if not url:
        raise ValueError("DATABASE_URL is not configured")

    logger.info("[DatasetBuilder] Connecting to database...")
    conn = psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        with conn.cursor() as cur:
            cur.execute(_POSITIVE_SQL)
            positives = cur.fetchall()
            logger.info(f"[DatasetBuilder] Positive examples: {len(positives)}")

            cur.execute(_NEGATIVE_SQL)
            negatives = cur.fetchall()
            logger.info(f"[DatasetBuilder] Negative examples: {len(negatives)}")

            cur.execute(_INTERACTION_COUNTS_SQL)
            counts_rows = cur.fetchall()
    finally:
        conn.close()

    counts = {row["profile_id"]: row for row in counts_rows}

    rows = list(positives) + list(negatives)
    if not rows:
        logger.warning("[DatasetBuilder] No training data found. Need at least 500 interactions.")
        return pd.DataFrame()

    df = pd.DataFrame(rows)

    # Enrich with per-profile interaction counts
    df["total_interactions"] = df["profile_id"].map(
        lambda pid: counts.get(pid, {}).get("total_interactions", 0)
    )
    df["positive_interactions"] = df["profile_id"].map(
        lambda pid: counts.get(pid, {}).get("positive_interactions", 0)
    )

    # Days old at interaction time
    now = datetime.now(timezone.utc)
    df["days_old"] = df.apply(
        lambda r: max(0, (now - (r["published_at"] or r["vacancy_created_at"]).replace(tzinfo=timezone.utc)).days)
        if (r["published_at"] or r["vacancy_created_at"]) else 0,
        axis=1,
    )

    logger.info(f"[DatasetBuilder] Total dataset size: {len(df)} rows, "
                f"label balance: {df['label'].mean():.2%} positive")
    return df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="data/dataset.csv")
    args = parser.parse_args()

    df = build()
    if not df.empty:
        df.to_csv(args.output, index=False)
        print(f"Saved {len(df)} rows to {args.output}")
    else:
        print("No data to save.")
