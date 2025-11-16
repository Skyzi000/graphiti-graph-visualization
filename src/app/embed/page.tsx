import { GraphitiAppShell } from "@/components/viewer/GraphitiAppShell";

type EmbedPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const resolved = await searchParams;
  const queryValue = resolved?.group_id;
  const groupId = Array.isArray(queryValue)
    ? queryValue[0]
    : queryValue ?? "";

  return <GraphitiAppShell mode="embed" initialGroupId={groupId} />;
}
