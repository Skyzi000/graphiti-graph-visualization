from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from graphiti_core.cross_encoder.client import CrossEncoderClient
from graphiti_core.embedder.client import EmbedderClient, EMBEDDING_DIM
from graphiti_core.llm_client import LLMClient, LLMConfig
from graphiti_core.prompts.models import Message
from graphiti_core.llm_client.config import ModelSize


class NullLLMClient(LLMClient):
  def __init__(self):
    super().__init__(LLMConfig(model="graphiti-null", small_model="graphiti-null"), cache=False)

  async def _generate_response(
    self,
    messages: list[Message],
    response_model: type | None = None,
    max_tokens: int = 0,
    model_size: ModelSize = ModelSize.small,
  ) -> dict[str, Any]:
    raise RuntimeError("LLM operations are not available in this deployment.")


class NullEmbedder(EmbedderClient):
  async def create(
    self, input_data: str | list[str] | Iterable[int] | Iterable[Iterable[int]]
  ) -> list[float]:
    return [0.0] * EMBEDDING_DIM

  async def create_batch(self, input_data_list: list[str]) -> list[list[float]]:
    return [[0.0] * EMBEDDING_DIM for _ in input_data_list]


class NullCrossEncoder(CrossEncoderClient):
  async def rank(self, _query: str, passages: list[str]) -> list[tuple[str, float]]:
    return [(passage, 0.0) for passage in passages]
