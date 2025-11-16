"use client";

import {
  defaultGraphFilters,
  useViewerStore,
} from "@/lib/stores/viewerStore";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_LIMIT_NODES } from "@/lib/services/graphiti";

interface GraphFiltersPanelProps {
  disabled?: boolean;
}

export function GraphFiltersPanel({ disabled }: GraphFiltersPanelProps) {
  const filters = useViewerStore((state) => state.filters);
  const applyFilters = useViewerStore((state) => state.applyFilters);
  const resetFilters = useViewerStore((state) => state.resetFilters);

  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [sinceValue, setSinceValue] = useState(filters.since ?? "");
  const [untilValue, setUntilValue] = useState(filters.until ?? "");
  const [includeEpisodes, setIncludeEpisodes] = useState(
    filters.includeEpisodes
  );
  const [limitNodesInput, setLimitNodesInput] = useState(
    (filters.limitNodes ?? DEFAULT_LIMIT_NODES).toString()
  );
  const [limitEdgesInput, setLimitEdgesInput] = useState(
    filters.limitEdges?.toString() ?? ""
  );

  useEffect(() => {
    setSearchValue(filters.search ?? "");
    setSinceValue(filters.since ?? "");
    setUntilValue(filters.until ?? "");
    setIncludeEpisodes(filters.includeEpisodes);
    setLimitNodesInput(
      (filters.limitNodes ?? DEFAULT_LIMIT_NODES).toString()
    );
    setLimitEdgesInput(filters.limitEdges?.toString() ?? "");
  }, [filters]);

  const isResetDisabled = useMemo(() => {
    const defaultLimitNodesString = (
      defaultGraphFilters.limitNodes ?? DEFAULT_LIMIT_NODES
    ).toString();
    return (
      searchValue === "" &&
      sinceValue === "" &&
      untilValue === "" &&
      includeEpisodes === defaultGraphFilters.includeEpisodes &&
      limitNodesInput === defaultLimitNodesString &&
      limitEdgesInput === ""
    );
  }, [searchValue, sinceValue, untilValue, includeEpisodes, limitNodesInput, limitEdgesInput]);

  const handleApply = () => {
    const parsedLimitNodes =
      limitNodesInput.trim() === ""
        ? undefined
        : Number.parseInt(limitNodesInput, 10);
    const parsedLimitEdges =
      limitEdgesInput.trim() === ""
        ? undefined
        : Number.parseInt(limitEdgesInput, 10);

    applyFilters({
      search: searchValue.trim() || undefined,
      since: sinceValue || undefined,
      until: untilValue || undefined,
      includeEpisodes,
      limitNodes: Number.isFinite(parsedLimitNodes)
        ? parsedLimitNodes
        : undefined,
      limitEdges: Number.isFinite(parsedLimitEdges)
        ? parsedLimitEdges
        : undefined,
    });
  };

  const handleReset = () => {
    setSearchValue("");
    setSinceValue("");
    setUntilValue("");
    setIncludeEpisodes(defaultGraphFilters.includeEpisodes);
    setLimitNodesInput(
      (defaultGraphFilters.limitNodes ?? DEFAULT_LIMIT_NODES).toString()
    );
    setLimitEdgesInput("");
    resetFilters();
  };

  return (
    <section className="rounded-3xl border bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div>
          <p className="text-sm font-semibold">Graphiti フィルター</p>
          <p className="text-xs text-muted-foreground">
            クエリパラメーターを変更し、Graphiti Graph Service のレスポンスを制御します。
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isResetDisabled || disabled}
          >
            リセット
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleApply}
            disabled={disabled}
          >
            適用
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Search
          </Label>
          <Input
            disabled={disabled}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="ノード名 / Episode テキストなど"
          />
        </div>
        <div className="grid gap-3 rounded-2xl border px-3 py-2 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">
              Since
            </Label>
            <Input
              type="date"
              disabled={disabled}
              value={sinceValue}
              onChange={(event) => setSinceValue(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">
              Until
            </Label>
            <Input
              type="date"
              disabled={disabled}
              value={untilValue}
              onChange={(event) => setUntilValue(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">
                Episode
              </Label>
              <p className="text-xs text-muted-foreground">
                Episode ノードをグラフに含める
              </p>
            </div>
            <Switch
              checked={includeEpisodes}
              onCheckedChange={(value) => setIncludeEpisodes(value)}
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <Label className="text-[11px] uppercase text-muted-foreground">
                Max Nodes
              </Label>
              <Input
                type="number"
                min={10}
                step={10}
                disabled={disabled}
                value={limitNodesInput}
                onChange={(event) => setLimitNodesInput(event.target.value)}
                placeholder={DEFAULT_LIMIT_NODES.toString()}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase text-muted-foreground">
                Max Edges
              </Label>
              <Input
                type="number"
                min={10}
                step={10}
                disabled={disabled}
                value={limitEdgesInput}
                onChange={(event) => setLimitEdgesInput(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
