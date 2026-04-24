"""
LightGBM trainer.

Trains on dataset from dataset_builder, saves model to models_dir,
and records MLModelVersion in the database.

Run:
    python -m src.training.trainer
    python -m src.training.trainer --min-samples 200
"""
from __future__ import annotations
import argparse
import json
import logging
import math
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import psycopg2
from sklearn.metrics import roc_auc_score, ndcg_score
from sklearn.model_selection import GroupShuffleSplit

try:
    import lightgbm as lgb
    _HAS_LGB = True
except ImportError:
    _HAS_LGB = False

from ..config import settings
from ..features import user_features, vacancy_features, cross_features
from .dataset_builder import build as build_dataset

logger = logging.getLogger(__name__)

MIN_SAMPLES_DEFAULT = 500


def _build_feature_matrix(df: pd.DataFrame) -> np.ndarray:
    """Build feature matrix from a raw dataset DataFrame."""
    rows = []
    for _, row in df.iterrows():
        profile_feats: dict = json.loads(row.get("profile_features", "{}") or "{}")
        u = user_features.extract(
            profile_feats,
            int(row.get("total_interactions", 0)),
            int(row.get("positive_interactions", 0)),
        )
        v = vacancy_features.extract(
            title=row.get("title", ""),
            description=row.get("description", ""),
            salary_from=row.get("salary_from"),
            salary_to=row.get("salary_to"),
            schedule=row.get("schedule"),
            location=row.get("location"),
            skill_count=int(row.get("skill_count", 0)),
            days_old=int(row.get("days_old", 0)),
        )
        c = cross_features.compute(u, v)
        feature_row = list(u.values()) + list(v.values()) + list(c.values())
        rows.append(feature_row)
    return np.array(rows, dtype=np.float32)


def _precision_at_k(y_true: np.ndarray, y_score: np.ndarray, k: int = 10) -> float:
    top_k = np.argsort(y_score)[::-1][:k]
    return float(y_true[top_k].mean())


def train(min_samples: int = MIN_SAMPLES_DEFAULT) -> str | None:
    """
    Train and save a new model. Returns version string, or None if not enough data.
    """
    df = build_dataset()
    if df.empty or len(df) < min_samples:
        logger.warning(
            f"[Trainer] Only {len(df)} samples — need {min_samples}. Skipping training."
        )
        return None

    logger.info(f"[Trainer] Building feature matrix for {len(df)} samples...")
    X = _build_feature_matrix(df)
    y = df["label"].values.astype(np.int32)

    # Group-aware split: same profile never in both train and test
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=df["profile_id"]))
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]

    if not _HAS_LGB:
        # Fallback to LogisticRegression when lightgbm is not installed
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import StandardScaler
        logger.warning("[Trainer] lightgbm not found, using LogisticRegression fallback")
        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s = scaler.transform(X_test)
        model = LogisticRegression(max_iter=1000, C=1.0)
        model.fit(X_train_s, y_train)
        y_prob = model.predict_proba(X_test_s)[:, 1]
        # Wrap scaler + model together
        from sklearn.pipeline import Pipeline
        model = Pipeline([("scaler", scaler), ("clf", model)])
        algorithm = "logreg"
    else:
        params = {
            "objective": "binary",
            "metric": ["binary_logloss", "auc"],
            "num_leaves": 31,
            "learning_rate": 0.05,
            "n_estimators": 200,
            "min_child_samples": 10,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "verbose": -1,
        }
        model = lgb.LGBMClassifier(**params)
        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            callbacks=[lgb.early_stopping(20, verbose=False)],
        )
        y_prob = model.predict_proba(X_test)[:, 1]
        algorithm = "lgbm"

    # Metrics
    auc = roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.0
    p10 = _precision_at_k(y_test, y_prob, k=10)
    # NDCG@10: group by profile for fair evaluation
    ndcg_scores = []
    for pid in df.iloc[test_idx]["profile_id"].unique():
        mask = df.iloc[test_idx]["profile_id"].values == pid
        if mask.sum() < 2:
            continue
        ndcg_scores.append(ndcg_score([y_test[mask]], [y_prob[mask]], k=10))
    ndcg10 = float(np.mean(ndcg_scores)) if ndcg_scores else 0.0

    logger.info(f"[Trainer] AUC={auc:.4f}  Precision@10={p10:.4f}  NDCG@10={ndcg10:.4f}")

    # Save model
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    version = f"ranker_v{timestamp}"
    models_dir = settings.models_dir
    models_dir.mkdir(parents=True, exist_ok=True)
    artefact_path = str(models_dir / f"{version}.pkl")
    joblib.dump(model, artefact_path)
    logger.info(f"[Trainer] Model saved to {artefact_path}")

    # Record in DB
    _record_version(version, algorithm, artefact_path, len(df), p10, ndcg10, auc)

    return version


def _record_version(
    version: str,
    algorithm: str,
    artefact_path: str,
    train_samples: int,
    precision10: float,
    ndcg10: float,
    auc: float,
) -> None:
    url = settings.database_url
    if not url:
        logger.warning("[Trainer] DATABASE_URL not set — skipping MLModelVersion insert")
        return
    try:
        conn = psycopg2.connect(url)
        with conn:
            with conn.cursor() as cur:
                # Deactivate previous active model
                cur.execute('UPDATE "MLModelVersion" SET "isActive" = false WHERE "isActive" = true')
                cur.execute(
                    '''INSERT INTO "MLModelVersion"
                       ("id", "version", "algorithm", "trainedAt", "precision10",
                        "ndcg10", "auc", "isActive", "artefactPath", "trainSamples", "createdAt")
                       VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, true, %s, %s, NOW())
                       ON CONFLICT ("version") DO NOTHING''',
                    (version, algorithm, datetime.now(timezone.utc),
                     precision10, ndcg10, auc, artefact_path, train_samples),
                )
        conn.close()
        logger.info(f"[Trainer] Recorded MLModelVersion: {version}")
    except Exception as e:
        logger.warning(f"[Trainer] Failed to record model version: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument("--min-samples", type=int, default=MIN_SAMPLES_DEFAULT)
    args = parser.parse_args()
    result = train(min_samples=args.min_samples)
    print(f"Training result: {result or 'skipped (not enough data)'}")
