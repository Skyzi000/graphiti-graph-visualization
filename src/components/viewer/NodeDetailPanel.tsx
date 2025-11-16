"use client";

import { useViewerStore } from "@/lib/stores/viewerStore";
import { useGraphitiNodeDetailsQuery } from "@/hooks/useGraphitiNode";
import { GraphRef } from "@/components/graph/Graph";
import { Button } from "@/components/ui/button";
import { BadgeCheck, GitBranch, Loader2, Pin } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

interface NodeDetailPanelProps {
  graphRef: React.RefObject<GraphRef | null>;
}

export function NodeDetailPanel({ graphRef }: NodeDetailPanelProps) {
  const groupId = useViewerStore((state) => state.selectedGroupId);
  const selectedNodeUuid = useViewerStore((state) => state.selectedNodeUuid);
  const mode = useViewerStore((state) => state.mode);

  const nodeQuery = useGraphitiNodeDetailsQuery({
    groupId,
    nodeUuid: selectedNodeUuid,
    mode,
  });

  const highlightEdge = (edgeId: string) => {
    graphRef.current?.zoomToLinkById(edgeId);
  };

  let content = (
    <p className="text-sm text-muted-foreground">
      ノードを選択すると Graphiti の詳細をここに表示します。
    </p>
  );

  if (!groupId) {
    content = (
      <p className="text-sm text-muted-foreground">
        まずは group_id を入力してグラフを読み込み、ノードをクリックしてください。
      </p>
    );
  } else if (selectedNodeUuid && nodeQuery.isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">ノードの近傍を取得しています...</p>
      </div>
    );
  } else if (nodeQuery.error) {
    content = (
      <div className="space-y-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
        <p className="font-semibold text-destructive">
          ノード詳細を取得できませんでした
        </p>
        <p className="text-destructive/80">{nodeQuery.error.message}</p>
      </div>
    );
  } else if (nodeQuery.data) {
    const { node, neighbors, episodes } = nodeQuery.data;

    content = (
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              {node.type}
            </span>
            {node.community_id && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {node.community_id}
              </span>
            )}
          </div>
          <h4 className="mt-2 text-lg font-semibold">{node.name}</h4>
          {node.summary && (
            <p className="text-sm text-muted-foreground">{node.summary}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {node.score != null && (
            <Metric label="Score" value={node.score.toFixed(2)} />
          )}
          {node.importance != null && (
            <Metric label="Importance" value={node.importance.toFixed(2)} />
          )}
          {node.timestamps?.updated_at && (
            <Metric
              label="Updated"
              value={formatDate(node.timestamps.updated_at, "YYYY/MM/DD")}
            />
          )}
          {node.timestamps?.created_at && (
            <Metric
              label="Created"
              value={formatDate(node.timestamps.created_at, "YYYY/MM/DD")}
            />
          )}
        </div>

        {episodes.length > 0 && (
          <div>
            <h5 className="flex items-center gap-2 text-sm font-semibold">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Episode
            </h5>
            <ul className="mt-2 space-y-2 rounded-2xl border bg-background/40 p-3 text-sm">
              {episodes.map((episode) => (
                <li key={episode.uuid} className="space-y-1">
                  <p className="font-medium">{episode.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(episode.timestamp, "YYYY/MM/DD HH:mm")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {neighbors.edges.length > 0 && (
          <div>
            <h5 className="flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="h-4 w-4 text-primary" />
              近傍ノード ({neighbors.nodes.length})
            </h5>
            <ul className="mt-2 space-y-2 text-sm">
              {neighbors.edges.map((edge) => {
                const counterpart =
                  neighbors.nodes.find(
                    (candidate) => candidate.uuid === edge.target_uuid
                  ) ||
                  neighbors.nodes.find(
                    (candidate) => candidate.uuid === edge.source_uuid
                  );
                return (
                  <li
                    key={edge.uuid}
                    className="rounded-2xl border bg-background/40 p-3"
                  >
                    <p className="font-medium">
                      {(edge.relationship_type ||
                        edge.fact ||
                        "relation") + " "}
                      {counterpart ? `→ ${counterpart.name}` : ""}
                    </p>
                    {edge.fact && (
                      <p className="text-xs text-muted-foreground">
                        {edge.fact}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => highlightEdge(edge.uuid)}
                      >
                        <Pin className="h-4 w-4" />
                        グラフで強調表示
                      </Button>
                      {edge.weight != null && (
                        <span className="text-xs text-muted-foreground">
                          weight {edge.weight.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="rounded-2xl border bg-card/80 p-4 shadow-sm">
      <p className="text-sm font-semibold">Node Detail</p>
      <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto pr-2 text-sm">
        {content}
      </div>
    </aside>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border bg-background/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
