"use client";

import { GraphFilters, GraphMode } from "@/lib/types/graph";
import { DEFAULT_LIMIT_NODES } from "@/lib/services/graphiti";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const defaultGraphFilters: GraphFilters = {
  search: undefined,
  since: undefined,
  until: undefined,
  includeEpisodes: true,
  limitNodes: DEFAULT_LIMIT_NODES,
  limitEdges: undefined,
  centerUuid: undefined,
};

interface ViewerState {
  selectedGroupId: string;
  recentGroupIds: string[];
  filters: GraphFilters;
  filtersRevision: number;
  selectedNodeUuid: string | null;
  mode: GraphMode;
  setSelectedGroupId: (
    groupId: string,
    options?: { persistRecent?: boolean }
  ) => void;
  addRecentGroupId: (groupId: string) => void;
  applyFilters: (nextFilters: GraphFilters) => void;
  resetFilters: () => void;
  setSelectedNodeUuid: (uuid: string | null) => void;
  setMode: (mode: GraphMode) => void;
}

const upsertRecentIds = (current: string[], groupId: string) => {
  const next = [groupId, ...current.filter((id) => id !== groupId)];
  return next.slice(0, 5);
};

export const useViewerStore = create<ViewerState>()(
  persist(
    (set) => ({
      selectedGroupId: "",
      recentGroupIds: [],
      filters: { ...defaultGraphFilters },
      filtersRevision: 0,
      selectedNodeUuid: null,
      mode: "viewer",
      setSelectedGroupId: (groupId, options) => {
        const trimmed = groupId.trim();
        set((state) => {
          if (!trimmed) {
            return {
              selectedGroupId: "",
              selectedNodeUuid: null,
            };
          }

          const shouldPersist = options?.persistRecent ?? true;
          const recentGroupIds = shouldPersist
            ? upsertRecentIds(state.recentGroupIds, trimmed)
            : state.recentGroupIds;

          return {
            selectedGroupId: trimmed,
            recentGroupIds,
            selectedNodeUuid: null,
          };
        });
      },
      addRecentGroupId: (groupId) =>
        set((state) => ({
          recentGroupIds: upsertRecentIds(state.recentGroupIds, groupId),
        })),
      applyFilters: (next) =>
        set((state) => ({
          filters: {
            search: next.search,
            since: next.since,
            until: next.until,
            includeEpisodes:
              next.includeEpisodes ?? defaultGraphFilters.includeEpisodes,
            limitNodes: next.limitNodes ?? defaultGraphFilters.limitNodes,
            limitEdges: next.limitEdges,
            centerUuid: next.centerUuid,
          },
          filtersRevision: state.filtersRevision + 1,
        })),
      resetFilters: () =>
        set((state) => ({
          filters: { ...defaultGraphFilters },
          filtersRevision: state.filtersRevision + 1,
        })),
      setSelectedNodeUuid: (uuid) => set({ selectedNodeUuid: uuid }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "graphiti-viewer-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedGroupId: state.selectedGroupId,
        recentGroupIds: state.recentGroupIds,
        filters: state.filters,
        filtersRevision: state.filtersRevision,
      }),
    }
  )
);
