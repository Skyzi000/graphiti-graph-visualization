from __future__ import annotations

# 環境変数を他のモジュールより先に読み込む
from dotenv import load_dotenv

load_dotenv()

import logging
import os

# ログ設定
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
from datetime import datetime, time, timezone
from typing import Annotated, List, Literal

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .graphiti_client import close_graphiti
from .schemas import GraphQuery, GraphResponse, NodeDetailQuery, NodeDetailResponse
from .service import delete_node, get_graph, get_node_detail


def _normalize_datetime(value: datetime | None, *, is_until: bool = False) -> datetime | None:
  """Ensure datetimes are timezone-aware (UTC) and expand date-only `until` to end-of-day.

  FastAPI parses `YYYY-MM-DD` as naive datetime at 00:00:00. To make comparisons
  against Graphiti's UTC timestamps safe, we:
  - attach UTC tzinfo when missing
  - convert aware datetimes to UTC
  - for `until` with midnight time (common for date-only), shift to end-of-day
  """

  if value is None:
    return None

  if value.tzinfo is None:
    value = value.replace(tzinfo=timezone.utc)
  else:
    value = value.astimezone(timezone.utc)

  if is_until and value.timetz().replace(tzinfo=None) == time(0, 0):
    value = value.replace(hour=23, minute=59, second=59, microsecond=999000)

  return value


def _allowed_origins() -> list[str]:
  config = os.getenv("GRAPHITI_ALLOW_ORIGINS", "*")
  if config.strip() == "*":
    return ["*"]
  return [origin.strip() for origin in config.split(",") if origin.strip()]


app = FastAPI(
  title="Graphiti Graph Service",
  version="0.1.0",
  description="FastAPI-based MVP implementation of the Graphiti Graph Service.",
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=_allowed_origins(),
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health_check():
  return {"status": "ok"}


@app.get(
  "/graph",
  response_model=GraphResponse,
  tags=["graph"],
)
async def get_graph_endpoint(
  group_id: Annotated[str, Query(min_length=1)],
  mode: Annotated[Literal["viewer", "embed"], Query()] = "viewer",
  node_ids: Annotated[List[str] | None, Query()] = None,
  center_uuid: Annotated[str | None, Query()] = None,
  since: Annotated[datetime | None, Query()] = None,
  until: Annotated[datetime | None, Query()] = None,
  search: Annotated[str | None, Query()] = None,
  limit_nodes: Annotated[int | None, Query(le=2000)] = None,
  limit_edges: Annotated[int | None, Query(le=4000)] = None,
  include_episodes: Annotated[bool, Query()] = True,
):
  query = GraphQuery(
    group_id=group_id,
    mode=mode,
    node_ids=node_ids,
    center_uuid=center_uuid,
    since=_normalize_datetime(since),
    until=_normalize_datetime(until, is_until=True),
    search=search,
    limit_nodes=limit_nodes,
    limit_edges=limit_edges,
    include_episodes=include_episodes,
  )
  return await get_graph(query)


@app.get(
  "/node/{uuid}",
  response_model=NodeDetailResponse,
  tags=["graph"],
)
async def get_node_detail_endpoint(
  uuid: str,
  group_id: Annotated[str, Query(min_length=1)],
  mode: Annotated[Literal["viewer", "embed"], Query()] = "viewer",
  depth: Annotated[int, Query(ge=1, le=2)] = 2,
):
  query = NodeDetailQuery(group_id=group_id, mode=mode, depth=depth)
  return await get_node_detail(query, uuid)


@app.delete(
  "/node/{uuid}",
  tags=["graph"],
)
async def delete_node_endpoint(uuid: str):
  await delete_node(uuid)
  return {"success": True}


@app.on_event("shutdown")
async def shutdown_event():
  await close_graphiti()
