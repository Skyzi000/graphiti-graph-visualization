"use client";

import { useEffect } from "react";
import { GraphMode } from "@/lib/types/api";
import { GraphitiExperience } from "./GraphitiExperience";
import { useViewerStore } from "@/lib/stores/viewerStore";
import { cn } from "@/lib/utils";

interface GraphitiAppShellProps {
  mode: GraphMode;
  initialGroupId?: string;
}

export function GraphitiAppShell({
  mode,
  initialGroupId,
}: GraphitiAppShellProps) {
  const setMode = useViewerStore((state) => state.setMode);
  const setSelectedGroupId = useViewerStore(
    (state) => state.setSelectedGroupId
  );

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId, {
        persistRecent: mode === "viewer",
      });
    }
  }, [initialGroupId, setSelectedGroupId, mode]);

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-background to-muted/30",
        mode === "viewer" ? "pt-8" : "pt-4"
      )}
    >
      {mode === "viewer" && (
        <header className="mx-auto mb-6 flex w-full max-w-[1100px] flex-col items-center gap-4 px-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Graphiti Graph Visualization
          </h1>
          <p className="text-sm text-muted-foreground">
            Graphiti Graph Service のスナップショットを分析するためのツールです。
          </p>
        </header>
      )}

      <GraphitiExperience
        showSidebar={mode === "viewer"}
        showGroupSelector={mode === "viewer"}
      />
    </div>
  );
}
