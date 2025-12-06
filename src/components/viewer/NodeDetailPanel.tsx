"use client";

import React, { Component, useState } from "react";
import { useViewerStore } from "@/lib/stores/viewerStore";
import {
  useDeleteNodeMutation,
  useGraphitiNodeDetailsQuery,
} from "@/hooks/useGraphitiNode";
import { GraphRef } from "@/components/graph/Graph";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BadgeCheck, ChevronDown, GitBranch, Loader2, Pin, Trash2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { formatDate } from "@/lib/utils/dates";
import { toast } from "sonner";

const DETAILS_REGEX = /<\/?details|<\/?summary/i;

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className={className}>
        <code {...props}>{children}</code>
      </pre>
    );
  },
  details({ children, ...props }) {
    return (
      <details
        className="my-2 rounded-lg border bg-background/60 p-3 marker:text-muted-foreground open:shadow-sm"
        {...props}
      >
        {children}
      </details>
    );
  },
  summary({ children, ...props }) {
    return (
      <summary
        className="cursor-pointer select-none text-sm font-semibold text-primary outline-none"
        {...props}
      >
        {children}
      </summary>
    );
  },
};

function decodeHtml(html: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

function injectToolResultIntoDetails(markdown: string): string {
  if (!DETAILS_REGEX.test(markdown)) return markdown;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(markdown, "text/html");
    for (const details of Array.from(doc.querySelectorAll("details"))) {
      const resultAttr = details.getAttribute("result");
      const nameAttr = details.getAttribute("name");
      const argsAttr = details.getAttribute("arguments");
      if (!resultAttr && !nameAttr && !argsAttr) continue;

      const summary = details.querySelector("summary");

      const container = doc.createElement("div");
      container.className =
        "mt-2 space-y-2 rounded-md border bg-muted/20 p-2 text-xs";

      if (nameAttr) {
        const nameP = doc.createElement("p");
        nameP.className = "font-semibold text-primary";
        nameP.textContent = decodeHtml(nameAttr);
        container.appendChild(nameP);
      }

      if (argsAttr) {
        const argsPre = doc.createElement("pre");
        argsPre.className =
          "whitespace-pre-wrap break-words rounded bg-muted/40 p-2";
        const decoded = decodeHtml(argsAttr).trim();

        const candidates: string[] = [
          decoded,
          decoded.replace(/^"(.*)"$/, "$1"),
          decoded.replace(/^'(.*)'$/, "$1"),
          decoded.replace(/\\"/g, '"'),
          decoded.replace(/\\\\/g, "\\"),
          decoded.replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
        ].filter(Boolean);

        let parsed: unknown = null;
        for (const candidate of candidates) {
          try {
            parsed = JSON.parse(candidate);
            break;
          } catch {
            continue;
          }
        }

        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            // keep as string
          }
        }

        argsPre.textContent =
          parsed && typeof parsed === "object"
            ? JSON.stringify(parsed, null, 2)
            : decoded;
        container.appendChild(argsPre);
      }

      if (resultAttr) {
        const resultPre = doc.createElement("pre");
        resultPre.className =
          "whitespace-pre-wrap break-words rounded bg-muted/30 p-2";
        resultPre.textContent = decodeHtml(resultAttr);
        container.appendChild(resultPre);
      }

      details.removeAttribute("result");
      details.removeAttribute("arguments");
      details.removeAttribute("name");

      if (summary?.parentElement === details) {
        summary.after(container);
      } else {
        details.prepend(container);
      }
    }
    return doc.body.innerHTML || markdown;
  } catch (error) {
    console.error("injectToolResultIntoDetails failed", error);
    return markdown;
  }
}

interface NodeDetailPanelProps {
  readonly graphRef: React.RefObject<GraphRef | null>;
}

class MarkdownErrorBoundary extends Component<
  { readonly fallback: React.ReactNode; readonly children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { readonly fallback: React.ReactNode; readonly children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Markdown render error", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function NodeDetailPanel({ graphRef }: NodeDetailPanelProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const groupId = useViewerStore((state) => state.selectedGroupId);
  const selectedNodeUuid = useViewerStore((state) => state.selectedNodeUuid);
  const selectedNode = useViewerStore((state) => state.selectedNode);
  const setSelectedNodeUuid = useViewerStore((state) => state.setSelectedNodeUuid);
  const mode = useViewerStore((state) => state.mode);

  const nodeQuery = useGraphitiNodeDetailsQuery({
    groupId,
    nodeUuid: selectedNodeUuid,
    mode,
  });

  const deleteMutation = useDeleteNodeMutation({
    groupId,
    onSuccess: () => {
      setSelectedNodeUuid(null);
      setIsDeleteDialogOpen(false);
      toast.success("ノードを削除しました");
    },
    onError: (error) => {
      toast.error(`削除に失敗しました: ${error.message}`);
    },
  });

  const highlightEdge = (edgeId: string) => {
    graphRef.current?.zoomToLinkById(edgeId);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedNodeUuid) {
      deleteMutation.mutate(selectedNodeUuid);
    }
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
      <div className="space-y-5">
        {selectedNode && (
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
                {selectedNode.type || "entity"}
              </span>
              {selectedNode.community_id && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {selectedNode.community_id}
                </span>
              )}
            </div>
            <h4 className="mt-2 text-lg font-semibold">{selectedNode.name}</h4>
            {selectedNode.summary && (
              <p className="text-sm text-muted-foreground">{selectedNode.summary}</p>
            )}
          </div>
        )}
        <div className="flex flex-col items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">詳細を取得中...</p>
        </div>
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
    const neighborNodes = neighbors.nodes ?? [];
    const neighborEdges = neighbors.edges ?? [];
    const episodeList = episodes ?? [];

    content = (
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-2">
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDeleteClick}
              title="ノードを削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
          {node.timestamps?.created_at && (
            <Metric
              label="作成日"
              value={formatDate(node.timestamps.created_at, "YYYY/MM/DD")}
            />
          )}
          {node.timestamps?.updated_at &&
            node.timestamps?.created_at &&
            node.timestamps.updated_at !== node.timestamps.created_at && (
              <Metric
                label="更新日"
                value={formatDate(node.timestamps.updated_at, "YYYY/MM/DD")}
              />
            )}
        </div>

        {episodeList.length > 0 && (
          <div>
            <h5 className="flex items-center gap-2 text-sm font-semibold">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Episode ({episodeList.length})
            </h5>
            <ul className="mt-2 space-y-2 text-sm">
              {episodeList.map((episode) => {
                const markdown =
                  typeof episode.content === "string" ? episode.content : "";
                const withInjected = injectToolResultIntoDetails(markdown);
                const fallbackPre = (
                  <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                    {withInjected || "(内容なし)"}
                  </pre>
                );

                return (
                  <li key={episode.uuid}>
                    <Collapsible>
                      <CollapsibleTrigger className="group flex w-full items-start gap-2 rounded-2xl border bg-background/40 p-3 text-left hover:bg-background/60 transition-colors">
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{episode.summary}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(episode.timestamp, "YYYY/MM/DD HH:mm")}
                          </p>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-2 rounded-xl border bg-muted/30 p-3">
                          <div className="text-sm leading-relaxed space-y-2 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                            <MarkdownErrorBoundary fallback={fallbackPre}>
                              <ReactMarkdown
                                components={markdownComponents}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                skipHtml={false}
                              >
                                {withInjected}
                              </ReactMarkdown>
                            </MarkdownErrorBoundary>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {neighborEdges.length > 0 && (
          <div>
            <h5 className="flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="h-4 w-4 text-primary" />
              近傍ノード ({neighborNodes.length})
            </h5>
            <ul className="mt-2 space-y-2 text-sm">
              {neighborEdges.map((edge) => {
                const counterpart =
                  neighborNodes.find(
                    (candidate) => candidate.uuid === edge.target_uuid
                  ) ||
                  neighborNodes.find(
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
    <>
      <aside className="rounded-2xl border bg-card/80 p-4 shadow-sm">
        <p className="text-sm font-semibold">Node Detail</p>
        <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto pr-2 text-sm">
          {content}
        </div>
      </aside>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ノードを削除しますか？</DialogTitle>
            <DialogDescription>
              「{nodeQuery.data?.node.name}」を削除します。この操作は取り消せません。
              関連するエッジも削除されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  削除中...
                </>
              ) : (
                "削除"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MetricProps {
  readonly label: string;
  readonly value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border bg-background/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
