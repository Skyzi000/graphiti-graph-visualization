"use client";

import { useMemo, useRef } from "react";
import { GraphitiGraphResponse, Node } from "@/lib/types/graph";
import { graphitiResponseToTriplets } from "@/lib/utils/graph";
import { useGraphitiGraphQuery } from "@/hooks/useGraphitiGraph";
import { useViewerStore } from "@/lib/stores/viewerStore";
import { GraphCanvas } from "./GraphCanvas";
import { GraphStats } from "./GraphStats";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { GroupIdSelector } from "./GroupIdSelector";
import { GraphFiltersPanel } from "./GraphFiltersPanel";
import { GraphRef } from "@/components/graph/Graph";

interface GraphitiExperienceProps {
  showSidebar: boolean;
  showGroupSelector: boolean;
}

export function GraphitiExperience({
  showSidebar,
  showGroupSelector,
}: GraphitiExperienceProps) {
  const selectedGroupId = useViewerStore((state) => state.selectedGroupId);
  const filters = useViewerStore((state) => state.filters);
  const filtersRevision = useViewerStore((state) => state.filtersRevision);
  const mode = useViewerStore((state) => state.mode);
  const setSelectedNodeUuid = useViewerStore(
    (state) => state.setSelectedNodeUuid
  );

  const graphQuery = useGraphitiGraphQuery({
    groupId: selectedGroupId,
    filters,
    mode,
    revision: filtersRevision,
  });

  const triplets = useMemo(() => {
    if (!graphQuery.data) return [];
    return graphitiResponseToTriplets(graphQuery.data);
  }, [graphQuery.data]);

  const graphRef = useRef<GraphRef | null>(null);

  const handleNodeSelect = (node: Node) => {
    setSelectedNodeUuid(node.uuid);
  };

  const handleEdgeSelect = () => {
    // No-op for now; reserved for future edge detail panel.
  };

  const graphData: GraphitiGraphResponse | undefined = graphQuery.data;
  const graphError =
    graphQuery.error instanceof Error ? graphQuery.error : undefined;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-12 lg:px-8">
      {showGroupSelector && (
        <div className="space-y-4">
          <GroupIdSelector isLoading={graphQuery.isFetching} />
          <GraphFiltersPanel disabled={!selectedGroupId} />
        </div>
      )}

      <div
        className={
          showSidebar
            ? "grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,0.9fr)]"
            : ""
        }
      >
        <GraphCanvas
          graphRef={graphRef}
          triplets={triplets}
          graphData={graphData}
          groupId={selectedGroupId}
          isLoading={graphQuery.isLoading}
          isFetching={graphQuery.isFetching}
          error={graphError}
          onRetry={() => graphQuery.refetch()}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
        />

        {showSidebar && (
          <div className="space-y-4">
            <GraphStats
              graphData={graphData}
              isLoading={graphQuery.isLoading}
            />
            <NodeDetailPanel graphRef={graphRef} />
          </div>
        )}
      </div>
    </div>
  );
}
