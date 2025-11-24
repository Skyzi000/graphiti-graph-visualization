from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING, Literal, Optional

from graphiti_core.graphiti import Graphiti

from .stubs import NullCrossEncoder, NullEmbedder, NullLLMClient

if TYPE_CHECKING:
  from graphiti_core.driver.falkordb_driver import FalkorDriver

logger = logging.getLogger(__name__)

# ドライバー選択: neo4j または falkordb
_driver_env = os.getenv("GRAPHITI_DRIVER", "neo4j").lower()
if _driver_env not in ("neo4j", "falkordb"):
  raise ValueError(f"Invalid GRAPHITI_DRIVER: {_driver_env}. Must be 'neo4j' or 'falkordb'.")
GRAPHITI_DRIVER: Literal["neo4j", "falkordb"] = _driver_env  # type: ignore[assignment]
logger.info(f"GRAPHITI_DRIVER selected: {GRAPHITI_DRIVER}")

# Neo4j 接続情報
GRAPHITI_NEO4J_URI_KEYS = ("GRAPHITI_NEO4J_URI", "NEO4J_URI")
GRAPHITI_NEO4J_USER_KEYS = ("GRAPHITI_NEO4J_USER", "NEO4J_USER")
GRAPHITI_NEO4J_PASSWORD_KEYS = ("GRAPHITI_NEO4J_PASSWORD", "NEO4J_PASSWORD")

# FalkorDB 接続情報
GRAPHITI_FALKORDB_HOST_KEYS = ("GRAPHITI_FALKORDB_HOST", "FALKORDB_HOST")
GRAPHITI_FALKORDB_PORT_KEYS = ("GRAPHITI_FALKORDB_PORT", "FALKORDB_PORT")
GRAPHITI_FALKORDB_USER_KEYS = ("GRAPHITI_FALKORDB_USER", "FALKORDB_USER")
GRAPHITI_FALKORDB_PASSWORD_KEYS = ("GRAPHITI_FALKORDB_PASSWORD", "FALKORDB_PASSWORD")
GRAPHITI_FALKORDB_DATABASE_KEYS = ("GRAPHITI_FALKORDB_DATABASE", "FALKORDB_DATABASE")


def _get_env(keys: tuple[str, ...], default: str | None = None) -> str | None:
  for key in keys:
    value = os.getenv(key)
    if value:
      return value
  return default


# Neo4j 接続設定
GRAPHITI_NEO4J_URI = _get_env(GRAPHITI_NEO4J_URI_KEYS)
GRAPHITI_NEO4J_USER = _get_env(GRAPHITI_NEO4J_USER_KEYS)
GRAPHITI_NEO4J_PASSWORD = _get_env(GRAPHITI_NEO4J_PASSWORD_KEYS)

# FalkorDB 接続設定
GRAPHITI_FALKORDB_HOST = _get_env(GRAPHITI_FALKORDB_HOST_KEYS, "localhost")
GRAPHITI_FALKORDB_PORT = int(_get_env(GRAPHITI_FALKORDB_PORT_KEYS, "6379") or "6379")
GRAPHITI_FALKORDB_USER = _get_env(GRAPHITI_FALKORDB_USER_KEYS)
GRAPHITI_FALKORDB_PASSWORD = _get_env(GRAPHITI_FALKORDB_PASSWORD_KEYS)
GRAPHITI_FALKORDB_DATABASE = _get_env(GRAPHITI_FALKORDB_DATABASE_KEYS)

_graphiti: Optional[Graphiti] = None


def is_graphiti_configured() -> bool:
  if GRAPHITI_DRIVER == "falkordb":
    # FalkorDBはホストがあればOK（デフォルト値があるので常にTrue）
    return True
  return all([GRAPHITI_NEO4J_URI, GRAPHITI_NEO4J_USER, GRAPHITI_NEO4J_PASSWORD])


def _create_falkordb_driver() -> FalkorDriver:
  """FalkorDriverを作成する"""
  from graphiti_core.driver.falkordb_driver import FalkorDriver

  kwargs = {
    "host": GRAPHITI_FALKORDB_HOST or "localhost",
    "port": GRAPHITI_FALKORDB_PORT,
    "username": GRAPHITI_FALKORDB_USER,
    "password": GRAPHITI_FALKORDB_PASSWORD,
  }
  if GRAPHITI_FALKORDB_DATABASE:
    kwargs["database"] = GRAPHITI_FALKORDB_DATABASE
  return FalkorDriver(**kwargs)


async def get_graphiti() -> Graphiti:
  global _graphiti
  if _graphiti is None:
    if not is_graphiti_configured():
      if GRAPHITI_DRIVER == "falkordb":
        raise RuntimeError(
          "Graphiti/FalkorDB connection is not configured. "
          "Set GRAPHITI_FALKORDB_HOST and GRAPHITI_FALKORDB_PORT."
        )
      else:
        raise RuntimeError(
          "Graphiti/Neo4j connection is not configured. "
          "Set GRAPHITI_NEO4J_URI, GRAPHITI_NEO4J_USER, and GRAPHITI_NEO4J_PASSWORD."
        )

    if GRAPHITI_DRIVER == "falkordb":
      logger.info(
        f"Initializing Graphiti with FalkorDB: "
        f"{GRAPHITI_FALKORDB_HOST}:{GRAPHITI_FALKORDB_PORT}, "
        f"database={GRAPHITI_FALKORDB_DATABASE}"
      )
      graph_driver = _create_falkordb_driver()
      _graphiti = Graphiti(
        graph_driver=graph_driver,
        llm_client=NullLLMClient(),
        embedder=NullEmbedder(),
        cross_encoder=NullCrossEncoder(),
      )
    else:
      logger.info(f"Initializing Graphiti with Neo4j: {GRAPHITI_NEO4J_URI}")
      _graphiti = Graphiti(
        uri=GRAPHITI_NEO4J_URI,
        user=GRAPHITI_NEO4J_USER or "",
        password=GRAPHITI_NEO4J_PASSWORD or "",
        llm_client=NullLLMClient(),
        embedder=NullEmbedder(),
        cross_encoder=NullCrossEncoder(),
      )
  return _graphiti


async def close_graphiti():
  global _graphiti
  if _graphiti is not None:
    await _graphiti.close()
    _graphiti = None
