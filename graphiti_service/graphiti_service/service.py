from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from typing import Dict, Iterable, List, Set, Tuple

from fastapi import HTTPException
from graphiti_core.edges import CommunityEdge, EntityEdge, EpisodicEdge
from graphiti_core.nodes import CommunityNode, EntityNode, EpisodicNode

from .graphiti_client import get_graphiti, is_graphiti_configured
from .schemas import (
  GraphQuery,
  GraphResponse,
  GraphitiCommunity,
  GraphitiEdge,
  GraphitiEpisode,
  GraphitiGraphMeta,
  GraphitiNode,
  GraphitiTimestamps,
  NodeDetailQuery,
  NodeDetailResponse,
  NodeNeighbors,
)

logger = logging.getLogger(__name__)


def _parse_timestamp(value: str | None) -> datetime | None:
  if not value:
    return None
  ts = value.replace("Z", "+00:00")
  try:
    return datetime.fromisoformat(ts)
  except ValueError:
    return None


def _within_window(node: GraphitiNode, since: datetime | None, until: datetime | None) -> bool:
  if since is None and until is None:
    return True

  created = _parse_timestamp(node.timestamps.created_at if node.timestamps else None)
  updated = _parse_timestamp(node.timestamps.updated_at if node.timestamps else None)
  candidate = updated or created
  if candidate is None:
    return True

  if since and candidate < since:
    return False
  if until and candidate > until:
    return False
  return True


def _match_search(value: str | None, needle: str) -> bool:
  if not value:
    return False
  return needle in value.lower()


def _filter_nodes(nodes: List[GraphitiNode], params: GraphQuery) -> List[GraphitiNode]:
  filtered = nodes

  if params.node_ids:
    allowed = set(params.node_ids)
    filtered = [node for node in filtered if node.uuid in allowed]

  if params.search:
    needle = params.search.lower()
    filtered = [
      node
      for node in filtered
      if _match_search(node.name.lower(), needle)
      or _match_search(node.summary.lower() if node.summary else None, needle)
      or any(_match_search(str(value).lower(), needle) for value in (node.tags or []))
    ]

  filtered = [
    node
    for node in filtered
    if _within_window(node, params.since, params.until)
  ]

  if params.limit_nodes:
    filtered = filtered[: params.limit_nodes]

  return filtered


def _filter_edges(
  edges: List[GraphitiEdge],
  nodes: Iterable[GraphitiNode],
  params: GraphQuery,
) -> Tuple[List[GraphitiEdge], Set[str]]:
  allowed_node_ids = {node.uuid for node in nodes}
  filtered = [
    edge
    for edge in edges
    if edge.source_uuid in allowed_node_ids and edge.target_uuid in allowed_node_ids
  ]

  if params.search:
    needle = params.search.lower()
    filtered = [
      edge
      for edge in filtered
      if _match_search(edge.relationship_type.lower(), needle)
      or _match_search(edge.fact.lower() if edge.fact else None, needle)
    ]

  if params.limit_edges:
    filtered = filtered[: params.limit_edges]

  referenced_episode_ids = {
    edge.target_uuid
    for edge in filtered
  } | {
    edge.source_uuid for edge in filtered
  }

  return filtered, referenced_episode_ids


def _filter_episodes(
  episodes: List[GraphitiEpisode],
  params: GraphQuery,
  referenced_ids: Set[str],
) -> List[GraphitiEpisode]:
  if not params.include_episodes:
    return []

  result = episodes
  if referenced_ids:
    result = [episode for episode in result if episode.uuid in referenced_ids]

  if params.search:
    needle = params.search.lower()
    result = [
      episode
      for episode in result
      if _match_search(episode.summary.lower(), needle)
      or any(_match_search(tag.lower(), needle) for tag in (episode.tags or []))
    ]

  return result


def _filter_communities(
  communities: List[GraphitiCommunity],
  nodes: Iterable[GraphitiNode],
) -> List[GraphitiCommunity]:
  referenced_ids = {node.community_id for node in nodes if node.community_id}
  if not referenced_ids:
    return communities

  return [
    community for community in communities if community.community_id in referenced_ids
  ]


def _coerce_value(value):
  if isinstance(value, datetime):
    return value.astimezone(UTC).isoformat()
  if isinstance(value, (bytes, bytearray)):
    return value.decode("utf-8", errors="ignore")
  if isinstance(value, list):
    return [_coerce_value(item) for item in value]
  if isinstance(value, dict):
    return {key: _coerce_value(val) for key, val in value.items()}
  return value


def _sanitize_metadata(metadata: Dict[str, object] | None) -> Dict[str, object] | None:
  if metadata is None:
    return None
  return {key: _coerce_value(val) for key, val in metadata.items()}


def _isoformat(value) -> str | None:
  if value is None:
    return None
  if isinstance(value, datetime):
    if value.tzinfo is None:
      value = value.replace(tzinfo=UTC)
    else:
      value = value.astimezone(UTC)
    return value.isoformat()
  if isinstance(value, (int, float)):
    return datetime.fromtimestamp(value, tz=UTC).isoformat()
  return str(value)


def _timestamps(created_at, updated_at=None) -> GraphitiTimestamps | None:
  created = _isoformat(created_at)
  updated = _isoformat(updated_at) or created
  if not created and not updated:
    return None
  return GraphitiTimestamps(created_at=created, updated_at=updated)


def _entity_node_to_graphiti(node: EntityNode) -> GraphitiNode:
  metadata = _sanitize_metadata(node.attributes)
  community_id = None
  if metadata:
    community_id = metadata.get("community_id") or metadata.get("communityId")
  return GraphitiNode(
    uuid=node.uuid,
    type="entity",
    name=node.name,
    summary=node.summary,
    metadata=metadata,
    community_id=community_id if isinstance(community_id, str) else None,
    labels=node.labels or ["Entity"],
    timestamps=_timestamps(node.created_at),
  )


def _community_node_to_graphiti(node: CommunityNode) -> GraphitiNode:
  return GraphitiNode(
    uuid=node.uuid,
    type="community",
    name=node.name,
    summary=node.summary,
    labels=["Community"],
    timestamps=_timestamps(node.created_at),
  )


def _episodic_node_to_graphiti(node: EpisodicNode) -> GraphitiNode:
  summary = node.source_description or node.content[:240]
  if node.source_description and node.content:
    summary = f"{node.source_description}: {node.content[:200]}"
  return GraphitiNode(
    uuid=node.uuid,
    type="episode",
    name=node.name or node.source_description or "Episode",
    summary=summary,
    description=node.content,
    metadata={"entity_edges": node.entity_edges},
    labels=["Episode"],
    tags=[node.source.value],
    timestamps=_timestamps(node.created_at),
  )


def _episodic_node_to_episode(node: EpisodicNode) -> GraphitiEpisode:
  timestamp = _isoformat(node.valid_at) or _isoformat(node.created_at)
  summary = node.source_description or node.name or node.content[:280]
  return GraphitiEpisode(
    uuid=node.uuid,
    summary=summary,
    timestamp=timestamp or datetime.now(tz=UTC).isoformat(),
    tags=[node.source.value],
    message_ids=node.entity_edges,
  )


def _entity_edge_to_graphiti(edge: EntityEdge) -> GraphitiEdge:
  return GraphitiEdge(
    uuid=edge.uuid,
    source_uuid=edge.source_node_uuid,
    target_uuid=edge.target_node_uuid,
    relationship_type=edge.name or "related_to",
    fact=edge.fact,
    timestamps=_timestamps(edge.created_at),
    valid_at=_isoformat(edge.valid_at),
    invalid_at=_isoformat(edge.invalid_at),
    expired_at=_isoformat(edge.expired_at),
  )


def _community_edge_to_graphiti(edge: CommunityEdge) -> GraphitiEdge:
  return GraphitiEdge(
    uuid=edge.uuid,
    source_uuid=edge.source_node_uuid,
    target_uuid=edge.target_node_uuid,
    relationship_type="HAS_MEMBER",
    timestamps=_timestamps(edge.created_at),
  )


def _episodic_edge_to_graphiti(edge: EpisodicEdge) -> GraphitiEdge:
  return GraphitiEdge(
    uuid=edge.uuid,
    source_uuid=edge.source_node_uuid,
    target_uuid=edge.target_node_uuid,
    relationship_type="MENTIONS",
    timestamps=_timestamps(edge.created_at),
  )


def _community_to_graphiti_community(node: CommunityNode) -> GraphitiCommunity:
  return GraphitiCommunity(
    community_id=node.uuid,
    label=node.name,
  )


def _build_meta(
  params: GraphQuery,
  center_uuid: str | None = None,
) -> GraphitiGraphMeta:
  filters = {
    "mode": params.mode,
    "include_episodes": str(params.include_episodes).lower(),
  }
  optional_fields = {
    "search": params.search,
    "since": params.since.isoformat() if params.since else None,
    "until": params.until.isoformat() if params.until else None,
    "limit_nodes": str(params.limit_nodes) if params.limit_nodes else None,
    "limit_edges": str(params.limit_edges) if params.limit_edges else None,
    "node_ids": ",".join(params.node_ids) if params.node_ids else None,
  }
  filters.update({k: v for k, v in optional_fields.items() if v})

  return GraphitiGraphMeta(
    group_id=params.group_id,
    center_uuid=params.center_uuid or center_uuid,
    generated_at=datetime.now(tz=UTC).isoformat(),
    filters=filters,
  )


def _build_graph_response_from_lists(
  params: GraphQuery,
  nodes: List[GraphitiNode],
  edges: List[GraphitiEdge],
  episodes: List[GraphitiEpisode],
  communities: List[GraphitiCommunity],
  center_uuid: str | None = None,
) -> GraphResponse:
  filtered_nodes = _filter_nodes(list(nodes), params)
  if not filtered_nodes:
    return GraphResponse(
      nodes=[],
      edges=[],
      episodes=[],
      communities=[],
      meta=_build_meta(params, center_uuid=center_uuid),
    )

  filtered_edges, referenced_episode_ids = _filter_edges(edges, filtered_nodes, params)
  filtered_episodes = _filter_episodes(episodes, params, referenced_episode_ids)
  filtered_communities = _filter_communities(communities, filtered_nodes)

  return GraphResponse(
    nodes=filtered_nodes,
    edges=filtered_edges,
    episodes=filtered_episodes,
    communities=filtered_communities,
    meta=_build_meta(params, center_uuid=center_uuid),
  )


async def _graph_from_graphiti(params: GraphQuery) -> GraphResponse:
  if not is_graphiti_configured():
    raise HTTPException(
      status_code=500,
      detail="Graphiti/Neo4j connection is not configured. "
      "Set GRAPHITI_NEO4J_URI, GRAPHITI_NEO4J_USER, and GRAPHITI_NEO4J_PASSWORD.",
    )

  graphiti = await get_graphiti()
  driver = graphiti.driver
  group_ids = [params.group_id]

  async def _empty():
    return []

  include_episodes = params.include_episodes

  (
    entity_nodes,
    community_nodes,
    episodic_nodes,
    entity_edges,
    community_edges,
    episodic_edges,
  ) = await asyncio.gather(
    EntityNode.get_by_group_ids(driver, group_ids, limit=params.limit_nodes),
    CommunityNode.get_by_group_ids(driver, group_ids),
    EpisodicNode.get_by_group_ids(driver, group_ids) if include_episodes else _empty(),
    EntityEdge.get_by_group_ids(driver, group_ids, limit=params.limit_edges),
    CommunityEdge.get_by_group_ids(driver, group_ids),
    EpisodicEdge.get_by_group_ids(driver, group_ids) if include_episodes else _empty(),
  )

  node_lookup: Dict[str, GraphitiNode] = {}
  for node in entity_nodes:
    node_lookup[node.uuid] = _entity_node_to_graphiti(node)
  for node in community_nodes:
    node_lookup[node.uuid] = _community_node_to_graphiti(node)
  if include_episodes:
    for node in episodic_nodes:
      node_lookup[node.uuid] = _episodic_node_to_graphiti(node)

  node_list = list(node_lookup.values())

  edge_list: List[GraphitiEdge] = []
  edge_list.extend(_entity_edge_to_graphiti(edge) for edge in entity_edges)
  edge_list.extend(_community_edge_to_graphiti(edge) for edge in community_edges)
  if include_episodes:
    edge_list.extend(_episodic_edge_to_graphiti(edge) for edge in episodic_edges)

  community_list = [_community_to_graphiti_community(node) for node in community_nodes]
  episode_list = (
    [_episodic_node_to_episode(node) for node in episodic_nodes] if include_episodes else []
  )

  return _build_graph_response_from_lists(
    params,
    node_list,
    edge_list,
    episode_list,
    community_list,
  )


async def get_graph(params: GraphQuery) -> GraphResponse:
  return await _graph_from_graphiti(params)


def _build_node_detail_from_graph(
  graph: GraphResponse, node_uuid: str, depth: int
) -> NodeDetailResponse:
  nodes_map: Dict[str, GraphitiNode] = {node.uuid: node for node in graph.nodes}

  node = nodes_map.get(node_uuid)
  if not node:
    raise HTTPException(
      status_code=404,
      detail=f"Node '{node_uuid}' not found in group '{graph.meta.group_id}'",
    )

  depth = max(1, min(depth, 2))
  collected_edges: Dict[str, GraphitiEdge] = {}
  neighbor_ids: Set[str] = set()
  frontier = {node_uuid}
  visited = {node_uuid}

  for _ in range(depth):
    next_frontier: Set[str] = set()
    for current in frontier:
      for edge in graph.edges:
        if edge.source_uuid == current or edge.target_uuid == current:
          collected_edges.setdefault(edge.uuid, edge)
          other = edge.target_uuid if edge.source_uuid == current else edge.source_uuid
          if other not in visited and other in nodes_map:
            visited.add(other)
            neighbor_ids.add(other)
            next_frontier.add(other)
    frontier = next_frontier
    if not frontier:
      break

  neighbor_nodes = [nodes_map[nid] for nid in neighbor_ids if nid in nodes_map]
  related_episodes = _episodes_for_node(graph.episodes, node, collected_edges)

  return NodeDetailResponse(
    node=node,
    neighbors=NodeNeighbors(nodes=neighbor_nodes, edges=list(collected_edges.values())),
    episodes=related_episodes,
  )


def _episodes_for_node(
  episodes: List[GraphitiEpisode],
  node: GraphitiNode,
  connected_edges: Dict[str, GraphitiEdge],
) -> List[GraphitiEpisode]:
  if not episodes:
    return []
  if node.type == "episode":
    return [episode for episode in episodes if episode.uuid == node.uuid]

  edge_ids = set(connected_edges.keys())
  related: List[GraphitiEpisode] = []
  for episode in episodes:
    message_ids = episode.message_ids or []
    if any(edge_id in edge_ids for edge_id in message_ids):
      related.append(episode)
  return related


async def get_node_detail(params: NodeDetailQuery, node_uuid: str) -> NodeDetailResponse:
  detail_query = GraphQuery(
    group_id=params.group_id,
    mode=params.mode,
    include_episodes=True,
    limit_nodes=None,
    limit_edges=None,
  )
  graph = await _graph_from_graphiti(detail_query)
  return _build_node_detail_from_graph(graph, node_uuid, params.depth)
