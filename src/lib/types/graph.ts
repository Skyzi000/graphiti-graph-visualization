export type GraphitiNodeType = "entity" | "fact" | "episode" | "community";

export interface GraphitiTimestamps {
  created_at?: string;
  updated_at?: string;
  seen_at?: string;
  last_interacted_at?: string;
}

export interface GraphitiNode {
  uuid: string;
  type: GraphitiNodeType;
  name: string;
  summary?: string;
  description?: string;
  score?: number;
  community_id?: string | null;
  importance?: number;
  metadata?: Record<string, unknown>;
  labels?: string[];
  timestamps?: GraphitiTimestamps;
  tags?: string[];
}

export interface GraphitiEdge {
  uuid: string;
  source_uuid: string;
  target_uuid: string;
  relationship_type: string;
  fact?: string;
  weight?: number;
  confidence?: number;
  timestamps?: GraphitiTimestamps;
  valid_at?: string;
  invalid_at?: string;
  expired_at?: string;
}

export interface GraphitiEpisode {
  uuid: string;
  summary: string;
  timestamp: string;
  importance?: number;
  message_ids?: string[];
  tags?: string[];
}

export interface GraphitiCommunity {
  community_id: string;
  label: string;
  score?: number;
  size?: number;
}

export interface GraphitiGraphMeta {
  group_id: string;
  user_id?: string;
  filters: Record<string, string>;
  generated_at: string;
  center_uuid?: string;
}

export interface GraphitiGraphResponse {
  nodes: GraphitiNode[];
  edges: GraphitiEdge[];
  episodes: GraphitiEpisode[];
  communities: GraphitiCommunity[];
  meta: GraphitiGraphMeta;
}

export interface GraphitiNodeDetailResponse {
  node: GraphitiNode;
  neighbors: {
    nodes: GraphitiNode[];
    edges: GraphitiEdge[];
  };
  episodes: GraphitiEpisode[];
}

export type GraphMode = "viewer" | "embed";

export interface GraphFilters {
  search?: string;
  since?: string;
  until?: string;
  includeEpisodes: boolean;
  limitNodes?: number;
  limitEdges?: number;
  centerUuid?: string;
}

export interface GraphitiApiError {
  error: string;
  details?: string;
  status?: number;
}

export interface Node {
  uuid: string;
  name: string;
  summary?: string;
  labels?: string[];
  attributes?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  type?: GraphitiNodeType;
  community_id?: string | null;
  score?: number;
  importance?: number;
  metadata?: Record<string, unknown>;
}

export interface Edge {
  uuid: string;
  source_node_uuid: string;
  target_node_uuid: string;
  type: string;
  name: string;
  relationship_type?: string;
  fact?: string;
  episodes?: string[];
  created_at: string;
  updated_at: string;
  valid_at?: string;
  expired_at?: string;
  invalid_at?: string;
  weight?: number;
  confidence?: number;
}

export interface RawTriplet {
  sourceNode: Node;
  edge: Edge;
  targetNode: Node;
}

export interface GraphNode extends Node {
  id: string;
  value: string;
  primaryLabel?: string;
}

export interface GraphEdge extends Edge {
  id: string;
  value: string;
}

export interface GraphTriplet {
  source: GraphNode;
  relation: GraphEdge;
  target: GraphNode;
}

export interface IdValue {
  id: string;
  value: string;
}

export interface NodePopupContent {
  id: string;
  node: Node;
}

export interface EdgePopupContent {
  id: string;
  source: Node;
  relation: Edge;
  target: Node;
}
