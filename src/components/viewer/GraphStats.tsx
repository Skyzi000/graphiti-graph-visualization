"use client";

import { GraphitiGraphResponse } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/dates";

interface GraphStatsProps {
  graphData?: GraphitiGraphResponse;
  isLoading: boolean;
}

export function GraphStats({ graphData, isLoading }: GraphStatsProps) {
  if (isLoading) {
    return (
      <aside className="rounded-2xl border bg-card/70 p-4 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-16 animate-pulse rounded-xl bg-muted/70" />
          <div className="h-16 animate-pulse rounded-xl bg-muted/70" />
          <div className="h-16 animate-pulse rounded-xl bg-muted/70" />
          <div className="h-16 animate-pulse rounded-xl bg-muted/70" />
        </div>
      </aside>
    );
  }

  if (!graphData) {
    return (
      <aside className="rounded-2xl border bg-card/70 p-4 text-sm text-muted-foreground">
        グラフを読み込むとノード・エッジの概要が表示されます。
      </aside>
    );
  }

  const metrics = [
    { label: "ノード", value: graphData.nodes.length },
    { label: "エッジ", value: graphData.edges.length },
    { label: "Episode", value: graphData.episodes.length },
    { label: "コミュニティ", value: graphData.communities.length },
  ];

  const topCommunities = graphData.communities.slice(0, 3);

  return (
    <aside className="rounded-2xl border bg-card/80 p-5 shadow-sm">
      <div>
        <p className="text-sm text-muted-foreground">Graphiti Snapshot</p>
        <h3 className="text-lg font-semibold">
          {graphData.meta.group_id || "―"}
        </h3>
        <p className="text-xs text-muted-foreground">
          生成日時: {formatDate(graphData.meta.generated_at, "YYYY/MM/DD HH:mm")}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border bg-background/50 p-3 text-center"
          >
            <dt className="text-xs text-muted-foreground">{metric.label}</dt>
            <dd className="text-xl font-semibold">{metric.value}</dd>
          </div>
        ))}
      </dl>

      {topCommunities.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-muted-foreground">
            主要コミュニティ
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {topCommunities.map((community) => (
              <li
                key={community.community_id}
                className="flex items-center justify-between rounded-xl border bg-background/40 px-3 py-2"
              >
                <span className="font-medium">{community.label}</span>
                {community.score != null && (
                  <span className="text-xs text-muted-foreground">
                    Score {Math.round(community.score * 100) / 100}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
