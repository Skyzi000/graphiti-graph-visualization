"use client";

import { useQuery } from "@tanstack/react-query";
import {
  GraphFilters,
  GraphitiGraphResponse,
  GraphMode,
  GraphitiApiError,
} from "@/lib/types/api";
import { filtersToQuery } from "@/lib/services/graphiti";

interface UseGraphitiGraphParams {
  groupId?: string;
  filters: GraphFilters;
  mode: GraphMode;
  revision: number;
}

const appendParams = (
  searchParams: URLSearchParams,
  payload: Record<string, unknown>
) => {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.set(key, String(value));
  });
};

async function requestGraph(
  groupId: string,
  mode: GraphMode,
  filters: GraphFilters
): Promise<GraphitiGraphResponse> {
  const params = new URLSearchParams({ group_id: groupId, mode });
  appendParams(params, filtersToQuery(filters));

  const response = await fetch(`/api/graphiti/graph?${params.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | GraphitiApiError
      | null;
    const errorMessage =
      payload?.error || "Graphiti graph API responded with an error.";
    throw new Error(errorMessage);
  }

  return (await response.json()) as GraphitiGraphResponse;
}

export function useGraphitiGraphQuery({
  groupId,
  filters,
  mode,
  revision,
}: UseGraphitiGraphParams) {
  return useQuery({
    queryKey: ["graphiti-graph", groupId, mode, revision, JSON.stringify(filters)],
    queryFn: () => requestGraph(groupId as string, mode, filters),
    enabled: Boolean(groupId),
    refetchOnMount: false,
  });
}
