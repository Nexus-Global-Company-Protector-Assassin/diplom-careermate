"""
Phase 3: Graph-based features from Neo4j Knowledge Graph.

4 features per (profile, vacancy) pair:
  avg_skill_distance     — mean shortest CO_OCCURS_WITH path (lower = closer; 5.0 = not connected)
  cluster_overlap        — fraction of vacancy skills in same Louvain community as profile skills
  expanded_profile_size  — unique skills within 2 CO_OCCURS_WITH hops of the profile
  cooccurrence_strength  — total decay-adjusted co-occurrence weight between profile & vacancy

Returns GRAPH_ZERO on any failure (graceful degradation).
"""
from __future__ import annotations
import logging
import os

logger = logging.getLogger(__name__)

NEO4J_URI      = os.getenv("NEO4J_URI", "")
NEO4J_USER     = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

# Half-life 90 days → λ = ln(2)/90
_DECAY_LAMBDA = 0.00770
_MS_PER_DAY   = 86_400_000.0

GRAPH_ZERO: dict[str, float] = {
    "avg_skill_distance":    5.0,
    "cluster_overlap":       0.0,
    "expanded_profile_size": 0.0,
    "cooccurrence_strength": 0.0,
}


class GraphFeaturesExtractor:
    """Singleton wrapper around the Neo4j driver for graph feature extraction."""

    def __init__(self) -> None:
        self._driver = None
        if not NEO4J_URI:
            logger.info("NEO4J_URI not set — graph features disabled (zeros)")
            return
        try:
            from neo4j import GraphDatabase
            self._driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
            self._driver.verify_connectivity()
            logger.info(f"GraphFeaturesExtractor connected to Neo4j at {NEO4J_URI}")
        except Exception as exc:
            logger.warning(f"Neo4j unavailable for graph features: {exc}")
            self._driver = None

    def extract(
        self,
        profile_skill_ids: list[str],
        vacancy_skill_ids: list[str],
    ) -> dict[str, float]:
        if not self._driver or not profile_skill_ids or not vacancy_skill_ids:
            return GRAPH_ZERO.copy()
        try:
            with self._driver.session() as session:
                return {
                    "avg_skill_distance":    self._avg_distance(session, profile_skill_ids, vacancy_skill_ids),
                    "cluster_overlap":       self._cluster_overlap(session, profile_skill_ids, vacancy_skill_ids),
                    "expanded_profile_size": float(self._expanded_profile_size(session, profile_skill_ids)),
                    "cooccurrence_strength": self._cooccurrence_strength(session, profile_skill_ids, vacancy_skill_ids),
                }
        except Exception as exc:
            logger.warning(f"Graph feature extraction failed: {exc}")
            return GRAPH_ZERO.copy()

    def close(self) -> None:
        if self._driver:
            self._driver.close()

    # ── Feature queries ──────────────────────────────────────────────────────

    def _avg_distance(
        self,
        session,
        profile_ids: list[str],
        vacancy_ids: list[str],
    ) -> float:
        """
        Average shortest CO_OCCURS_WITH path between profile skills and
        vacancy skills not already in the profile.
        Caps Cartesian pairs at 50 to keep query latency bounded.
        Returns 5.0 when no path exists.
        """
        result = session.run(
            """
            MATCH (p:Skill), (v:Skill)
            WHERE p.id IN $profile_ids
              AND v.id IN $vacancy_ids
              AND NOT v.id IN $profile_ids
            WITH p, v LIMIT 50
            MATCH path = shortestPath((p)-[:CO_OCCURS_WITH*..6]-(v))
            RETURN avg(length(path)) AS avg_dist
            """,
            profile_ids=profile_ids,
            vacancy_ids=vacancy_ids,
        )
        rec = result.single()
        val = rec["avg_dist"] if rec else None
        return float(val) if val is not None else 5.0

    def _cluster_overlap(
        self,
        session,
        profile_ids: list[str],
        vacancy_ids: list[str],
    ) -> float:
        """Fraction of vacancy skills in the same Louvain communities as profile skills."""
        result = session.run(
            """
            MATCH (p:Skill)
            WHERE p.id IN $profile_ids AND p.communityId IS NOT NULL
            WITH collect(DISTINCT p.communityId) AS prof_communities
            MATCH (v:Skill)
            WHERE v.id IN $vacancy_ids
            WITH prof_communities,
                 count(v) AS total,
                 count(CASE WHEN v.communityId IN prof_communities THEN 1 END) AS overlap
            RETURN CASE WHEN total > 0
                        THEN toFloat(overlap) / toFloat(total)
                        ELSE 0.0
                   END AS ratio
            """,
            profile_ids=profile_ids,
            vacancy_ids=vacancy_ids,
        )
        rec = result.single()
        return float(rec["ratio"]) if rec else 0.0

    def _expanded_profile_size(self, session, profile_ids: list[str]) -> int:
        """Unique skills reachable within 2 CO_OCCURS_WITH hops from profile skills."""
        result = session.run(
            """
            MATCH (p:Skill)-[:CO_OCCURS_WITH*1..2]-(neighbor:Skill)
            WHERE p.id IN $profile_ids
            RETURN count(DISTINCT neighbor) AS size
            """,
            profile_ids=profile_ids,
        )
        rec = result.single()
        return int(rec["size"]) if rec else 0

    def _cooccurrence_strength(
        self,
        session,
        profile_ids: list[str],
        vacancy_ids: list[str],
    ) -> float:
        """
        Total decay-adjusted CO_OCCURS_WITH weight between profile and vacancy skills.

        NOTE: 'lambda' is a Python reserved keyword — use 'decay_lambda' as the
        parameter name so it maps correctly to the $decay_lambda Cypher variable.
        """
        result = session.run(
            """
            MATCH (p:Skill)-[r:CO_OCCURS_WITH]-(v:Skill)
            WHERE p.id IN $profile_ids AND v.id IN $vacancy_ids
            RETURN sum(
                CASE WHEN r.lastSeenMs IS NOT NULL
                     THEN toFloat(r.count) * exp($decay_lambda * toFloat(timestamp() - r.lastSeenMs) / $ms_per_day)
                     ELSE toFloat(r.count)
                END
            ) AS strength
            """,
            profile_ids=profile_ids,
            vacancy_ids=vacancy_ids,
            decay_lambda=-_DECAY_LAMBDA,  # negative: decay reduces weight over time
            ms_per_day=_MS_PER_DAY,
        )
        rec = result.single()
        val = rec["strength"] if rec else None
        return float(val) if val is not None else 0.0


_extractor: GraphFeaturesExtractor | None = None


def get_extractor() -> GraphFeaturesExtractor:
    global _extractor
    if _extractor is None:
        _extractor = GraphFeaturesExtractor()
    return _extractor
