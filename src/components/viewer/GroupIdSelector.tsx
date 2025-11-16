"use client";

import { useEffect, useState, useTransition } from "react";
import { useViewerStore } from "@/lib/stores/viewerStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, Loader2, LogIn } from "lucide-react";

interface GroupIdSelectorProps {
  isLoading?: boolean;
}

export function GroupIdSelector({ isLoading }: GroupIdSelectorProps) {
  const selectedGroupId = useViewerStore((state) => state.selectedGroupId);
  const recentGroupIds = useViewerStore((state) => state.recentGroupIds);
  const setSelectedGroupId = useViewerStore(
    (state) => state.setSelectedGroupId
  );

  const [inputValue, setInputValue] = useState(selectedGroupId);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setInputValue(selectedGroupId);
  }, [selectedGroupId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    startTransition(() => {
      setSelectedGroupId(trimmed);
    });
  };

  const handleRecentSelect = (value: string) => {
    setInputValue(value);
    startTransition(() => setSelectedGroupId(value));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-3xl border bg-card/80 p-4 shadow-sm"
    >
      <div className="flex-1 min-w-[220px] space-y-2">
        <label className="text-sm font-medium text-foreground">
          Graphiti group_id
        </label>
        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="例: graphiti-demo-group"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Embed や Open WebUI 側と同じ group_id を指定すると、Graphiti Graph
          Service のスナップショットが表示されます。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2"
              disabled={recentGroupIds.length === 0}
            >
              <History className="h-4 w-4" />
              最近の group_id
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {recentGroupIds.map((groupId) => (
              <DropdownMenuItem
                key={groupId}
                onSelect={() => handleRecentSelect(groupId)}
              >
                {groupId}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="submit"
          size="lg"
          className="gap-2"
          disabled={isPending || isLoading}
        >
          {isPending || isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          グラフを表示
        </Button>
      </div>
    </form>
  );
}
