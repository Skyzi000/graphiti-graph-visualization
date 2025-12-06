"use client";

import { GraphVisualization } from "@/components/graph/GraphVisualization";
import { GraphRef } from "@/components/graph/Graph";
import {
  GraphitiGraphResponse,
  Node,
  RawTriplet,
  Edge,
} from "@/lib/types/api";
import { formatDate } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { ReactNode } from "react";

interface GraphCanvasProps {
  graphRef: React.RefObject<GraphRef | null>;
  triplets: RawTriplet[];
  graphData?: GraphitiGraphResponse;
  groupId?: string;
  isLoading: boolean;
  isFetching: boolean;
  error?: Error;
  onRetry: () => void;
  onNodeSelect: (node: Node) => void;
  onEdgeSelect?: (edgeId: string) => void;
}

export function GraphCanvas({
  graphRef,
  triplets,
  graphData,
  groupId,
  isLoading,
  isFetching,
  error,
  onRetry,
  onNodeSelect,
  onEdgeSelect,
}: GraphCanvasProps) {
  const statusLabel =
    graphData?.meta.generated_at &&
    `最終同期: ${formatDate(graphData.meta.generated_at, "YYYY/MM/DD HH:mm")}`;

  const includeEpisodesEnabled =
    graphData?.meta.filters?.include_episodes?.toString().toLowerCase() ===
    "true";

  const handleGraphEdgeSelect = (edge: Edge) => {
    if (!onEdgeSelect) return;
    onEdgeSelect(edge.uuid);
  };

  return (
    <section className="rounded-3xl border bg-card/80 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm font-semibold">Graph Snapshot</p>
          {statusLabel && (
            <p className="text-xs text-muted-foreground">{statusLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {includeEpisodesEnabled && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Episode 表示中
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isFetching || !groupId}
            className="gap-2"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            再取得
          </Button>
        </div>
      </div>

      <div className="relative mt-4 aspect-[4/3] max-h-[70vh] w-full rounded-2xl border bg-background/70">
        {!groupId && (
          <CanvasState
            icon={<AlertCircle className="h-8 w-8 text-muted-foreground" />}
            title="group_id を入力してください"
            description="Graphiti で払い出された group_id を設定するとグラフが描画されます。"
          />
        )}

        {groupId && isLoading && (
          <CanvasState
            icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
            title="グラフを構築しています"
            description="Graphiti Graph Service からノードとエピソードを同期中です。"
          />
        )}

        {groupId && error && !isLoading && (
          <CanvasState
            icon={<AlertCircle className="h-8 w-8 text-destructive" />}
            title="グラフの取得に失敗しました"
            description={error.message}
          >
            <Button variant="secondary" size="sm" onClick={onRetry}>
              リトライ
            </Button>
          </CanvasState>
        )}

        {groupId && !error && !isLoading && triplets.length === 0 && (
          <CanvasState
            icon={<AlertCircle className="h-8 w-8 text-muted-foreground" />}
            title="ノードが見つかりません"
            description="クエリ条件に一致する Graphiti データがありませんでした。フィルターを見直してください。"
          />
        )}

        {groupId && !error && !isLoading && triplets.length > 0 && (
          <GraphVisualization
            ref={graphRef}
            triplets={triplets}
            className="h-full w-full rounded-2xl"
            onNodeSelect={onNodeSelect}
            onEdgeSelect={handleGraphEdgeSelect}
          />
        )}

        {isFetching && !isLoading && (
          <div className="pointer-events-none absolute right-4 top-4 rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
            同期中...
          </div>
        )}
      </div>
    </section>
  );
}

interface CanvasStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

function CanvasState({
  icon,
  title,
  description,
  children,
}: CanvasStateProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
      {icon}
      <div>
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
