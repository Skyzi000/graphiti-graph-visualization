import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const node_ids = z.union([z.array(z.string()), z.null()]).optional();
const center_uuid = z.union([z.string(), z.null()]).optional();
const limit_nodes = z.union([z.number(), z.null()]).optional();
const GraphitiTimestamps = z
  .object({
    created_at: z.union([z.string(), z.null()]),
    updated_at: z.union([z.string(), z.null()]),
    seen_at: z.union([z.string(), z.null()]),
    last_interacted_at: z.union([z.string(), z.null()]),
  })
  .partial()
  .passthrough();
const GraphitiNode = z
  .object({
    uuid: z.string(),
    type: z.enum(["entity", "fact", "episode", "community"]),
    name: z.string(),
    summary: z.union([z.string(), z.null()]).optional(),
    description: z.union([z.string(), z.null()]).optional(),
    score: z.union([z.number(), z.null()]).optional(),
    community_id: z.union([z.string(), z.null()]).optional(),
    importance: z.union([z.number(), z.null()]).optional(),
    metadata: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
    labels: z.union([z.array(z.string()), z.null()]).optional(),
    timestamps: z.union([GraphitiTimestamps, z.null()]).optional(),
    tags: z.union([z.array(z.string()), z.null()]).optional(),
  })
  .passthrough();
const GraphitiEdge = z
  .object({
    uuid: z.string(),
    source_uuid: z.string(),
    target_uuid: z.string(),
    relationship_type: z.string(),
    fact: z.union([z.string(), z.null()]).optional(),
    weight: z.union([z.number(), z.null()]).optional(),
    confidence: z.union([z.number(), z.null()]).optional(),
    timestamps: z.union([GraphitiTimestamps, z.null()]).optional(),
    valid_at: z.union([z.string(), z.null()]).optional(),
    invalid_at: z.union([z.string(), z.null()]).optional(),
    expired_at: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const GraphitiEpisode = z
  .object({
    uuid: z.string(),
    name: z.string(),
    summary: z.union([z.string(), z.null()]).optional(),
    content: z.string(),
    timestamp: z.string(),
    importance: z.union([z.number(), z.null()]).optional(),
    message_ids: z.union([z.array(z.string()), z.null()]).optional(),
    tags: z.union([z.array(z.string()), z.null()]).optional(),
  })
  .passthrough();
const GraphitiCommunity = z
  .object({
    community_id: z.string(),
    label: z.string(),
    score: z.union([z.number(), z.null()]).optional(),
    size: z.union([z.number(), z.null()]).optional(),
  })
  .passthrough();
const GraphitiGraphMeta = z
  .object({
    group_id: z.string(),
    user_id: z.union([z.string(), z.null()]).optional(),
    filters: z.record(z.string()).optional(),
    generated_at: z.string(),
    center_uuid: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const GraphResponse = z
  .object({
    nodes: z.array(GraphitiNode),
    edges: z.array(GraphitiEdge),
    episodes: z.array(GraphitiEpisode),
    communities: z.array(GraphitiCommunity),
    meta: GraphitiGraphMeta,
  })
  .passthrough();
const ValidationError = z
  .object({
    loc: z.array(z.union([z.string(), z.number()])),
    msg: z.string(),
    type: z.string(),
  })
  .passthrough();
const HTTPValidationError = z
  .object({ detail: z.array(ValidationError) })
  .partial()
  .passthrough();
const NodeNeighbors = z
  .object({ nodes: z.array(GraphitiNode), edges: z.array(GraphitiEdge) })
  .partial()
  .passthrough();
const NodeDetailResponse = z
  .object({
    node: GraphitiNode,
    neighbors: NodeNeighbors,
    episodes: z.array(GraphitiEpisode).optional(),
  })
  .passthrough();

export const schemas = {
  node_ids,
  center_uuid,
  limit_nodes,
  GraphitiTimestamps,
  GraphitiNode,
  GraphitiEdge,
  GraphitiEpisode,
  GraphitiCommunity,
  GraphitiGraphMeta,
  GraphResponse,
  ValidationError,
  HTTPValidationError,
  NodeNeighbors,
  NodeDetailResponse,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/graph",
    alias: "get_graph_endpoint_graph_get",
    requestFormat: "json",
    parameters: [
      {
        name: "group_id",
        type: "Query",
        schema: z.string().min(1),
      },
      {
        name: "mode",
        type: "Query",
        schema: z.enum(["viewer", "embed"]).optional().default("viewer"),
      },
      {
        name: "node_ids",
        type: "Query",
        schema: node_ids,
      },
      {
        name: "center_uuid",
        type: "Query",
        schema: center_uuid,
      },
      {
        name: "since",
        type: "Query",
        schema: center_uuid,
      },
      {
        name: "until",
        type: "Query",
        schema: center_uuid,
      },
      {
        name: "search",
        type: "Query",
        schema: center_uuid,
      },
      {
        name: "limit_nodes",
        type: "Query",
        schema: limit_nodes,
      },
      {
        name: "limit_edges",
        type: "Query",
        schema: limit_nodes,
      },
      {
        name: "include_episodes",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
      {
        name: "recent_episode_center",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
      {
        name: "recent_episode_count",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(10),
      },
      {
        name: "center_depth",
        type: "Query",
        schema: z.number().int().gte(1).lte(5).optional().default(1),
      },
    ],
    response: GraphResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "get",
    path: "/health",
    alias: "health_check_health_get",
    requestFormat: "json",
    response: z.unknown(),
  },
  {
    method: "get",
    path: "/node/:uuid",
    alias: "get_node_detail_endpoint_node__uuid__get",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "group_id",
        type: "Query",
        schema: z.string().min(1),
      },
      {
        name: "mode",
        type: "Query",
        schema: z.enum(["viewer", "embed"]).optional().default("viewer"),
      },
      {
        name: "depth",
        type: "Query",
        schema: z.number().int().gte(1).lte(2).optional().default(2),
      },
    ],
    response: NodeDetailResponse,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
  {
    method: "delete",
    path: "/node/:uuid",
    alias: "delete_node_endpoint_node__uuid__delete",
    requestFormat: "json",
    parameters: [
      {
        name: "uuid",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.unknown(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError,
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
