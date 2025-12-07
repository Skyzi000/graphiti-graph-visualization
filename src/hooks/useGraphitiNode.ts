"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraphitiApiError,
  GraphitiNodeDetailResponse,
  GraphMode,
} from "@/lib/types/api";

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
  depth = 1,
}: UseGraphitiNodeParams) {
  return useQuery({
    queryKey: ["graphiti-node", groupId, nodeUuid, mode, depth],
    queryFn: () => requestNodeDetail(groupId as string, nodeUuid as string, mode, depth),
    enabled: Boolean(groupId && nodeUuid),
    refetchOnWindowFocus: false,
  });
}

async function requestDeleteNode(nodeUuid: string): Promise<void> {
  const response = await fetch(
    `/api/graphiti/node/${encodeURIComponent(nodeUuid)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | GraphitiApiError
      | null;
    const errorMessage =
      payload?.error || "Failed to delete node.";
    throw new Error(errorMessage);
  }
}

interface UseDeleteNodeParams {
  groupId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteNodeMutation({ groupId, onSuccess, onError }: UseDeleteNodeParams = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestDeleteNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graphiti-graph", groupId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
