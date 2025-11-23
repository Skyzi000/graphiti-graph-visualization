import {
  GraphFilters,
  GraphitiApiError,
  GraphitiGraphResponse,
  GraphitiNodeDetailResponse,
  GraphMode,
} from "@/lib/types/graph";
import {
  SAMPLE_GRAPH_RESPONSE,
  SAMPLE_NODE_DETAILS,
} from "@/lib/mocks/sampleGraph";

export interface GraphitiGraphQuery {
  group_id: string;
  mode: GraphMode;
  node_ids?: string[];
  center_uuid?: string;
  since?: string;
  until?: string;
  search?: string;
  limit_nodes?: number;
  limit_edges?: number;
  include_episodes?: boolean;
}

export interface GraphitiNodeDetailQuery {
  group_id: string;
  mode: GraphMode;
  depth?: number;
}

const SERVICE_URL = process.env.GRAPHITI_SERVICE_URL;
const SERVICE_API_KEY = process.env.GRAPHITI_SERVICE_API_KEY;
const FORCE_SAMPLE =
  process.env.GRAPHITI_USE_SAMPLE_DATA === "true" || !SERVICE_URL;

const DEFAULT_MODE: GraphMode = "viewer";
const DEFAULT_INCLUDE_EPISODES = true;
export const DEFAULT_LIMIT_NODES = 100;

const normalizeBaseUrl = (url: string) =>
  url.endsWith("/") ? url.slice(0, -1) : url;

const baseUrl = SERVICE_URL ? normalizeBaseUrl(SERVICE_URL) : "";

function parseBoolean(value: string | null | undefined, fallback: boolean) {
  if (value === null || value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parseInteger(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateFilter(value: string | undefined, options?: { isUntil?: boolean }) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!DATE_ONLY_REGEX.test(trimmed)) return trimmed;

  // Build start/end of the selected local day, then send as UTC ISO string.
  const [year, month, day] = trimmed.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0); // local midnight
  const end = new Date(year, month - 1, day, 23, 59, 59, 999); // local end-of-day

  const chosen = options?.isUntil ? end : start;
  return chosen.toISOString();
}

export function parseGraphQueryParams(
  searchParams: URLSearchParams
): GraphitiGraphQuery {
  const groupId = searchParams.get("group_id");
  if (!groupId) {
    throw createGraphitiError(
      400,
      "group_id is required to load Graphiti data."
    );
  }

  const mode =
    searchParams.get("mode") === "embed" ? ("embed" as GraphMode) : DEFAULT_MODE;
  const includeEpisodes = parseBoolean(
    searchParams.get("include_episodes"),
    DEFAULT_INCLUDE_EPISODES
  );

  const nodeIds = searchParams.getAll("node_ids").filter(Boolean);
  const limitNodes = parseInteger(searchParams.get("limit_nodes")) ?? DEFAULT_LIMIT_NODES;

  return {
    group_id: groupId,
    mode,
    node_ids: nodeIds.length ? nodeIds : undefined,
    center_uuid: searchParams.get("center_uuid") ?? undefined,
    since: searchParams.get("since") ?? undefined,
    until: searchParams.get("until") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    limit_nodes: limitNodes,
    limit_edges: parseInteger(searchParams.get("limit_edges")),
    include_episodes: includeEpisodes,
  };
}

export function parseNodeDetailQueryParams(
  searchParams: URLSearchParams
): GraphitiNodeDetailQuery {
  const groupId = searchParams.get("group_id");
  if (!groupId) {
    throw createGraphitiError(
      400,
      "group_id is required to load node details."
    );
  }

  const mode =
    searchParams.get("mode") === "embed" ? ("embed" as GraphMode) : DEFAULT_MODE;

  const depth = searchParams.get("depth");

  return {
    group_id: groupId,
    mode,
    depth: parseInteger(depth) ?? 2,
  };
}

export function filtersToQuery(filters: GraphFilters): Partial<GraphitiGraphQuery> {
  return {
    search: filters.search,
    since: normalizeDateFilter(filters.since),
    until: normalizeDateFilter(filters.until, { isUntil: true }),
    include_episodes: filters.includeEpisodes,
    limit_nodes: filters.limitNodes,
    limit_edges: filters.limitEdges,
    center_uuid: filters.centerUuid,
  };
}

export async function fetchGraph(
  params: GraphitiGraphQuery
): Promise<GraphitiGraphResponse> {
  if (FORCE_SAMPLE) {
    return buildSampleGraphResponse(params);
  }

  if (!baseUrl) {
    throw createGraphitiError(
      500,
      "GRAPHITI_SERVICE_URL is not configured and sample data is disabled."
    );
  }

  const url = new URL(`${baseUrl}/graph`);
  appendQueryParams(url, params);

  const response = await fetch(url, {
    method: "GET",
    headers: createHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorPayload = await safeParseError(response);
    throw createGraphitiError(response.status, errorPayload.error, {
      details: errorPayload.details,
    });
  }

  return (await response.json()) as GraphitiGraphResponse;
}

export async function fetchNodeDetail(
  uuid: string,
  params: GraphitiNodeDetailQuery
): Promise<GraphitiNodeDetailResponse> {
  if (FORCE_SAMPLE) {
    return buildSampleNodeDetail(uuid);
  }

  if (!baseUrl) {
    throw createGraphitiError(
      500,
      "GRAPHITI_SERVICE_URL is not configured and sample data is disabled."
    );
  }

  const url = new URL(`${baseUrl}/node/${encodeURIComponent(uuid)}`);
  appendQueryParams(url, params);

  const response = await fetch(url, {
    method: "GET",
    headers: createHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorPayload = await safeParseError(response);
    throw createGraphitiError(response.status, errorPayload.error, {
      details: errorPayload.details,
    });
  }

  return (await response.json()) as GraphitiNodeDetailResponse;
}

export async function deleteNode(uuid: string): Promise<void> {
  if (FORCE_SAMPLE) {
    return;
  }

  if (!baseUrl) {
    throw createGraphitiError(
      500,
      "GRAPHITI_SERVICE_URL is not configured and sample data is disabled."
    );
  }

  const url = new URL(`${baseUrl}/node/${encodeURIComponent(uuid)}`);

  const response = await fetch(url, {
    method: "DELETE",
    headers: createHeaders(),
  });

  if (!response.ok) {
    const errorPayload = await safeParseError(response);
    throw createGraphitiError(response.status, errorPayload.error, {
      details: errorPayload.details,
    });
  }
}

function appendQueryParams(url: URL, params: object): void {
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          url.searchParams.append(key, String(item));
        }
      });
      return;
    }

    url.searchParams.set(key, String(value));
  });
}

function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (SERVICE_API_KEY) {
    headers.Authorization = `Bearer ${SERVICE_API_KEY}`;
  }

  return headers;
}

async function safeParseError(response: Response) {
  try {
    return (await response.json()) as GraphitiApiError;
  } catch {
    return {
      error: `Graphiti service responded with status ${response.status}`,
    } satisfies GraphitiApiError;
  }
}

function createGraphitiError(
  status: number,
  message: string,
  options?: { details?: string }
): GraphitiApiError {
  return {
    status,
    error: message,
    details: options?.details,
  };
}

function cloneGraphResponse(
  graph: GraphitiGraphResponse
): GraphitiGraphResponse {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      labels: node.labels ? [...node.labels] : undefined,
      tags: node.tags ? [...node.tags] : undefined,
      metadata: node.metadata ? { ...node.metadata } : undefined,
      timestamps: node.timestamps ? { ...node.timestamps } : undefined,
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      timestamps: edge.timestamps ? { ...edge.timestamps } : undefined,
    })),
    episodes: graph.episodes.map((episode) => ({
      ...episode,
      message_ids: episode.message_ids
        ? [...episode.message_ids]
        : undefined,
      tags: episode.tags ? [...episode.tags] : undefined,
    })),
    communities: graph.communities.map((community) => ({ ...community })),
    meta: {
      ...graph.meta,
      filters: { ...graph.meta.filters },
    },
  };
}

function buildSampleGraphResponse(
  params: GraphitiGraphQuery
): GraphitiGraphResponse {
  const cloned = cloneGraphResponse(SAMPLE_GRAPH_RESPONSE);

  cloned.meta = {
    ...cloned.meta,
    group_id: params.group_id,
    generated_at: new Date().toISOString(),
    center_uuid: params.center_uuid ?? cloned.meta.center_uuid,
    filters: {
      ...cloned.meta.filters,
      include_episodes: String(
        params.include_episodes ?? DEFAULT_INCLUDE_EPISODES
      ),
      search: params.search ?? "",
      mode: params.mode,
    },
  };

  return cloned;
}

function buildSampleNodeDetail(uuid: string): GraphitiNodeDetailResponse {
  const detail = SAMPLE_NODE_DETAILS[uuid];
  if (!detail) {
    throw createGraphitiError(404, "Sample node detail not found.");
  }

  return {
    node: {
      ...detail.node,
      labels: detail.node.labels ? [...detail.node.labels] : undefined,
      tags: detail.node.tags ? [...detail.node.tags] : undefined,
      metadata: detail.node.metadata ? { ...detail.node.metadata } : undefined,
      timestamps: detail.node.timestamps
        ? { ...detail.node.timestamps }
        : undefined,
    },
    neighbors: {
      nodes: detail.neighbors.nodes.map((node) => ({
        ...node,
        labels: node.labels ? [...node.labels] : undefined,
        tags: node.tags ? [...node.tags] : undefined,
        metadata: node.metadata ? { ...node.metadata } : undefined,
        timestamps: node.timestamps ? { ...node.timestamps } : undefined,
      })),
      edges: detail.neighbors.edges.map((edge) => ({
        ...edge,
        timestamps: edge.timestamps ? { ...edge.timestamps } : undefined,
      })),
    },
    episodes: detail.episodes.map((episode) => ({
      ...episode,
      message_ids: episode.message_ids
        ? [...episode.message_ids]
        : undefined,
      tags: episode.tags ? [...episode.tags] : undefined,
    })),
  };
}
