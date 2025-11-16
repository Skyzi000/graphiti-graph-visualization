from __future__ import annotations

import os
from typing import Optional

from graphiti_core.graphiti import Graphiti

from .stubs import NullCrossEncoder, NullEmbedder, NullLLMClient

GRAPHITI_NE04J_URI_KEYS = ("GRAPHITI_NEO4J_URI", "NEO4J_URI")
GRAPHITI_NE04J_USER_KEYS = ("GRAPHITI_NEO4J_USER", "NEO4J_USER")
GRAPHITI_NE04J_PASSWORD_KEYS = ("GRAPHITI_NEO4J_PASSWORD", "NEO4J_PASSWORD")


def _get_env(keys: tuple[str, ...]) -> str | None:
  for key in keys:
    value = os.getenv(key)
    if value:
      return value
  return None


GRAPHITI_URI = _get_env(GRAPHITI_NE04J_URI_KEYS)
GRAPHITI_USER = _get_env(GRAPHITI_NE04J_USER_KEYS)
GRAPHITI_PASSWORD = _get_env(GRAPHITI_NE04J_PASSWORD_KEYS)

_graphiti: Optional[Graphiti] = None


def is_graphiti_configured() -> bool:
  return all([GRAPHITI_URI, GRAPHITI_USER, GRAPHITI_PASSWORD])


async def get_graphiti() -> Graphiti:
  global _graphiti
  if _graphiti is None:
    if not is_graphiti_configured():
      raise RuntimeError(
        "Graphiti/Neo4j connection is not configured. "
        "Set GRAPHITI_NEO4J_URI, GRAPHITI_NEO4J_USER, and GRAPHITI_NEO4J_PASSWORD."
      )
    _graphiti = Graphiti(
      GRAPHITI_URI,
      GRAPHITI_USER,
      GRAPHITI_PASSWORD,
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
