from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

GraphMode = Literal["viewer", "embed"]
GraphitiNodeType = Literal["entity", "fact", "episode", "community"]


class GraphitiTimestamps(BaseModel):
  created_at: Optional[str] = None
  updated_at: Optional[str] = None
  seen_at: Optional[str] = None
  last_interacted_at: Optional[str] = None


class GraphitiNode(BaseModel):
  uuid: str
  type: GraphitiNodeType
  name: str
  summary: Optional[str] = None
  description: Optional[str] = None
  score: Optional[float] = None
  community_id: Optional[str] = None
  importance: Optional[float] = None
  metadata: Optional[Dict[str, object]] = None
  labels: Optional[List[str]] = None
  timestamps: Optional[GraphitiTimestamps] = None
  tags: Optional[List[str]] = None


class GraphitiEdge(BaseModel):
  uuid: str
  source_uuid: str
  target_uuid: str
  relationship_type: str
  fact: Optional[str] = None
  weight: Optional[float] = None
  confidence: Optional[float] = None
  timestamps: Optional[GraphitiTimestamps] = None
  valid_at: Optional[str] = None
  invalid_at: Optional[str] = None
  expired_at: Optional[str] = None


class GraphitiEpisode(BaseModel):
  uuid: str
  summary: str
  content: str
  timestamp: str
  importance: Optional[float] = None
  message_ids: Optional[List[str]] = None
  tags: Optional[List[str]] = None


class GraphitiCommunity(BaseModel):
  community_id: str
  label: str
  score: Optional[float] = None
  size: Optional[int] = None


class GraphitiGraphMeta(BaseModel):
  group_id: str
  user_id: Optional[str] = None
  filters: Dict[str, str] = Field(default_factory=dict)
  generated_at: str
  center_uuid: Optional[str] = None


class GraphResponse(BaseModel):
  nodes: List[GraphitiNode]
  edges: List[GraphitiEdge]
  episodes: List[GraphitiEpisode]
  communities: List[GraphitiCommunity]
  meta: GraphitiGraphMeta


class NodeNeighbors(BaseModel):
  nodes: List[GraphitiNode] = Field(default_factory=list)
  edges: List[GraphitiEdge] = Field(default_factory=list)


class NodeDetailResponse(BaseModel):
  node: GraphitiNode
  neighbors: NodeNeighbors
  episodes: List[GraphitiEpisode] = Field(default_factory=list)


class GraphQuery(BaseModel):
  group_id: str
  mode: GraphMode = "viewer"
  node_ids: Optional[List[str]] = None
  center_uuid: Optional[str] = None
  since: Optional[datetime] = None
  until: Optional[datetime] = None
  search: Optional[str] = None
  limit_nodes: Optional[int] = None
  limit_edges: Optional[int] = None
  include_episodes: bool = True


class NodeDetailQuery(BaseModel):
  group_id: str
  mode: GraphMode = "viewer"
  depth: int = 2
