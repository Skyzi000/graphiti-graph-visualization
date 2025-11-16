"use client";

import { useQuery } from "@tanstack/react-query";
import {
  GraphitiApiError,
  GraphitiNodeDetailResponse,
  GraphMode,
} from "@/lib/types/graph";

interface UseGraphitiNodeParams {
  groupId?: string;
  nodeUuid?: string | null;
  mode: GraphMode;
  depth?: number;
}

async function requestNodeDetail(
  groupId: string,
  nodeUuid: string,
  mode: GraphMode,
  depth: number
): Promise<GraphitiNodeDetailResponse> {
  const params = new URLSearchParams({
    group_id: groupId,
    mode,
    depth: String(depth),
  });

  const response = await fetch(
    `/api/graphiti/node/${encodeURIComponent(nodeUuid)}?${params.toString()}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | GraphitiApiError
      | null;
    const errorMessage =
      payload?.error || "Graphiti node detail API responded with an error.";
    throw new Error(errorMessage);
  }

  return (await response.json()) as GraphitiNodeDetailResponse;
}

export function useGraphitiNodeDetailsQuery({
  groupId,
  nodeUuid,
  mode,
  depth = 2,
}: UseGraphitiNodeParams) {
  return useQuery({
    queryKey: ["graphiti-node", groupId, nodeUuid, mode, depth],
    queryFn: () => requestNodeDetail(groupId as string, nodeUuid as string, mode, depth),
    enabled: Boolean(groupId && nodeUuid),
    refetchOnWindowFocus: false,
  });
}
