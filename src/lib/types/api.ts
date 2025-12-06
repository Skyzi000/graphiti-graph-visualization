/**
 * 自動生成された型のリエクスポート
 *
 * NOTE: このファイルは手動編集してください。
 * generated/schema.d.ts は自動生成されます。
 */

import type { components, paths } from "../../../generated/schema";

// === スキーマ型のエクスポート ===
export type GraphitiNode = components["schemas"]["GraphitiNode"];
export type GraphitiEdge = components["schemas"]["GraphitiEdge"];
export type GraphitiEpisode = components["schemas"]["GraphitiEpisode"];
export type GraphitiCommunity = components["schemas"]["GraphitiCommunity"];
export type GraphitiTimestamps = components["schemas"]["GraphitiTimestamps"];
export type GraphitiGraphMeta = components["schemas"]["GraphitiGraphMeta"];
export type GraphResponse = components["schemas"]["GraphResponse"];
export type NodeDetailResponse = components["schemas"]["NodeDetailResponse"];
export type NodeNeighbors = components["schemas"]["NodeNeighbors"];

// === リクエストパラメータ型 ===
export type GetGraphParams = paths["/graph"]["get"]["parameters"]["query"];
export type GetNodeDetailParams =
  paths["/node/{uuid}"]["get"]["parameters"]["query"];

// === ユーティリティ型 ===
export type GraphMode = "viewer" | "embed";
export type GraphitiNodeType = GraphitiNode["type"];

// === 後方互換性エイリアス ===
export type GraphitiGraphResponse = GraphResponse;
export type GraphitiNodeDetailResponse = NodeDetailResponse;

// === フロントエンド固有の型（手動管理） ===
// これらは自動生成されないので、ここで定義を保持
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

// === 旧 Node/Edge 型（フロントエンド用） ===
// OpenAPI生成型との互換性のため、nullを許可
export interface Node {
  uuid: string;
  name: string;
  summary?: string | null;
  labels?: string[] | null;
  attributes?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  type?: GraphitiNodeType;
  community_id?: string | null;
  score?: number | null;
  importance?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface Edge {
  uuid: string;
  source_node_uuid: string;
  target_node_uuid: string;
  type: string;
  name: string;
  relationship_type?: string;
  fact?: string | null;
  episodes?: string[];
  created_at: string;
  updated_at: string;
  valid_at?: string | null;
  expired_at?: string | null;
  invalid_at?: string | null;
  weight?: number | null;
  confidence?: number | null;
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
