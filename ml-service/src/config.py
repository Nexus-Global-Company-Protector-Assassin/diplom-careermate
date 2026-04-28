from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    database_url: str = ""
    ml_service_port: int = 3003
    models_dir: Path = Path("/app/models")
    shadow_mode: bool = True  # when True: predict but don't expose to ranking

    # Neo4j Knowledge Graph (Phase 3 graph features)
    neo4j_uri: str = ""
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
