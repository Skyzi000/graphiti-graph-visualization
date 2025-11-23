import {
  GraphitiEdge,
  GraphitiGraphResponse,
  GraphitiNode,
  GraphitiNodeDetailResponse,
  GraphitiEpisode,
  GraphitiCommunity,
} from "@/lib/types/graph";

const sampleNodes: GraphitiNode[] = [
  {
    uuid: "entity-lena-ortiz",
    type: "entity",
    name: "Lena Ortiz",
    summary:
      "Founder of the biodesign studio FutureForm. Piloting Graphiti to track her rehabilitation journey.",
    score: 0.91,
    community_id: "community-care-hub",
    importance: 0.93,
    metadata: {
      role: "Founder",
      sentiment: "positive",
      location: "San Francisco",
    },
    tags: ["founder", "beta"],
    timestamps: {
      created_at: "2025-01-30T12:25:00.000Z",
      updated_at: "2025-02-04T08:10:00.000Z",
    },
  },
  {
    uuid: "entity-nova-clinic",
    type: "entity",
    name: "Nova Clinic Boston",
    summary: "Partner clinic specializing in regenerative medicine.",
    score: 0.86,
    community_id: "community-care-hub",
    importance: 0.7,
    metadata: {
      city: "Boston",
      tier: "Premium",
    },
    timestamps: {
      created_at: "2025-01-15T16:00:00.000Z",
      updated_at: "2025-02-01T18:00:00.000Z",
    },
  },
  {
    uuid: "entity-simon-reid",
    type: "entity",
    name: "Dr. Simon Reid",
    summary: "Nova Clinic medical lead overseeing Graphiti pilots.",
    score: 0.8,
    importance: 0.66,
    metadata: {
      title: "Medical Lead",
      specialty: "Regenerative Medicine",
    },
    timestamps: {
      created_at: "2024-12-11T10:00:00.000Z",
      updated_at: "2025-02-06T09:00:00.000Z",
    },
  },
  {
    uuid: "fact-rehab-upgrade",
    type: "fact",
    name: "Premium Recovery Plan Eligible",
    summary: "Meets thresholds for Nova Clinic premium recovery upgrade.",
    importance: 0.72,
    metadata: {
      relationship_type: "eligible_for",
      weight: 0.82,
    },
    timestamps: {
      created_at: "2025-02-05T09:45:00.000Z",
      updated_at: "2025-02-05T09:45:00.000Z",
    },
  },
  {
    uuid: "episode-2025-02-05",
    type: "episode",
    name: "Care Team Call",
    summary: "Discussed soreness post-session and scheduled follow-up.",
    importance: 0.77,
    metadata: {
      channel: "voice",
    },
    timestamps: {
      created_at: "2025-02-05T16:45:00.000Z",
      updated_at: "2025-02-05T16:45:00.000Z",
    },
  },
  {
    uuid: "episode-2025-02-10",
    type: "episode",
    name: "My Memory Entry",
    summary: "Lena logged relief after micro-stimulation therapy.",
    importance: 0.62,
    metadata: {
      channel: "my-memory",
    },
    timestamps: {
      created_at: "2025-02-10T14:20:00.000Z",
      updated_at: "2025-02-10T14:20:00.000Z",
    },
  },
  {
    uuid: "community-care-hub",
    type: "community",
    name: "Care Navigation Cohort",
    summary: "Cluster of members exploring concierge recovery programs.",
    metadata: {
      centroid: "regenerative-care",
    },
    timestamps: {
      created_at: "2024-10-01T08:00:00.000Z",
      updated_at: "2025-02-08T09:30:00.000Z",
    },
  },
];

const sampleEdges: GraphitiEdge[] = [
  {
    uuid: "edge-lena-nova",
    source_uuid: "entity-lena-ortiz",
    target_uuid: "entity-nova-clinic",
    relationship_type: "VISITED_CLINIC",
    fact: "Post-op visit recorded Nov 13",
    weight: 0.88,
    timestamps: {
      created_at: "2025-02-05T09:00:00.000Z",
      updated_at: "2025-02-05T09:00:00.000Z",
    },
  },
  {
    uuid: "edge-lena-simon",
    source_uuid: "entity-lena-ortiz",
    target_uuid: "entity-simon-reid",
    relationship_type: "INTERACTED_WITH",
    fact: "Escalated soreness note to medical lead",
    weight: 0.73,
    timestamps: {
      created_at: "2025-02-05T17:00:00.000Z",
    },
  },
  {
    uuid: "edge-lena-episode-call",
    source_uuid: "entity-lena-ortiz",
    target_uuid: "episode-2025-02-05",
    relationship_type: "MENTIONED_IN",
    fact: "Outlined therapy discomfort",
    timestamps: {
      created_at: "2025-02-05T17:10:00.000Z",
    },
  },
  {
    uuid: "edge-lena-episode-memory",
    source_uuid: "entity-lena-ortiz",
    target_uuid: "episode-2025-02-10",
    relationship_type: "CAPTURED_IN",
    fact: "Logged relief sentiment",
    timestamps: {
      created_at: "2025-02-10T14:30:00.000Z",
    },
  },
  {
    uuid: "edge-lena-fact-upgrade",
    source_uuid: "entity-lena-ortiz",
    target_uuid: "fact-rehab-upgrade",
    relationship_type: "QUALIFIES_FOR",
    fact: "Met acceleration criteria",
    weight: 0.82,
    timestamps: {
      created_at: "2025-02-05T09:45:00.000Z",
    },
  },
  {
    uuid: "edge-community-lena",
    source_uuid: "community-care-hub",
    target_uuid: "entity-lena-ortiz",
    relationship_type: "BELONGS_TO",
    timestamps: {
      created_at: "2025-02-07T11:00:00.000Z",
    },
  },
];

const sampleEpisodes: GraphitiEpisode[] = [
  {
    uuid: "episode-2025-02-05",
    summary: "Care team call logged from concierge nurse.",
    content: "Nurse: Good afternoon Lena, this is Sarah from Nova Clinic following up on your session yesterday.\n\nLena: Hi Sarah, thanks for calling. I'm still feeling some soreness in my lower back from the micro-stimulation therapy.\n\nNurse: I understand. That's actually quite common in the first few sessions. How would you rate the discomfort on a scale of 1-10?\n\nLena: Probably a 4 or 5. It's manageable but noticeable.\n\nNurse: That's within the expected range. I'll make a note for Dr. Reid to review before your next appointment. In the meantime, gentle stretching and applying heat can help. Would you like me to schedule a follow-up call in a couple of days?\n\nLena: Yes, that would be great. Thank you for checking in.",
    timestamp: "2025-02-05T16:45:00.000Z",
    importance: 0.77,
    message_ids: ["call-8843", "note-221"],
    tags: ["care-team", "escalation"],
  },
  {
    uuid: "episode-2025-02-10",
    summary: "My Memory mobile entry about pain relief.",
    content: "Feeling much better today after the second micro-stimulation session. The soreness from last week has completely subsided. I noticed improved mobility in my lower back this morning - was able to do my full stretching routine without any discomfort. The therapy seems to be working. Looking forward to discussing progress with Dr. Reid at the next appointment.",
    timestamp: "2025-02-10T14:20:00.000Z",
    importance: 0.62,
    message_ids: ["memory-1033"],
    tags: ["memory", "positive"],
  },
];

const sampleCommunities: GraphitiCommunity[] = [
  {
    community_id: "community-care-hub",
    label: "Care Navigation Cohort",
    score: 0.84,
    size: 18,
  },
  {
    community_id: "community-digital",
    label: "Digital Agent Champions",
    score: 0.71,
    size: 11,
  },
];

const SAMPLE_GRAPH: GraphitiGraphResponse = {
  nodes: sampleNodes,
  edges: sampleEdges,
  episodes: sampleEpisodes,
  communities: sampleCommunities,
  meta: {
    group_id: "graphiti-demo-group",
    filters: {
      include_episodes: "true",
      mode: "viewer",
    },
    generated_at: "2025-02-12T15:00:00.000Z",
    center_uuid: "entity-lena-ortiz",
  },
};

function buildNodeDetailMap(
  graph: GraphitiGraphResponse
): Record<string, GraphitiNodeDetailResponse> {
  const nodeMap = new Map(graph.nodes.map((node) => [node.uuid, node]));

  const adjacency = new Map<string, GraphitiEdge[]>();
  graph.edges.forEach((edge) => {
    const sourceEdges = adjacency.get(edge.source_uuid) ?? [];
    sourceEdges.push(edge);
    adjacency.set(edge.source_uuid, sourceEdges);

    const targetEdges = adjacency.get(edge.target_uuid) ?? [];
    targetEdges.push(edge);
    adjacency.set(edge.target_uuid, targetEdges);
  });

  const result: Record<string, GraphitiNodeDetailResponse> = {};

  graph.nodes.forEach((node) => {
    const connectedEdges = adjacency.get(node.uuid) ?? [];
    const neighborIds = new Set<string>();

    connectedEdges.forEach((edge) => {
      neighborIds.add(edge.source_uuid);
      neighborIds.add(edge.target_uuid);
    });
    neighborIds.delete(node.uuid);

    const neighbors = Array.from(neighborIds)
      .map((id) => nodeMap.get(id))
      .filter((maybeNode): maybeNode is GraphitiNode => Boolean(maybeNode));

    const relatedEpisodes = graph.episodes.filter(
      (episode) =>
        episode.uuid === node.uuid ||
        connectedEdges.some(
          (edge) =>
            edge.source_uuid === episode.uuid || edge.target_uuid === episode.uuid
        )
    );

    result[node.uuid] = {
      node,
      neighbors: {
        nodes: neighbors,
        edges: connectedEdges,
      },
      episodes: relatedEpisodes,
    };
  });

  return result;
}

export const SAMPLE_GRAPH_RESPONSE = SAMPLE_GRAPH;
export const SAMPLE_NODE_DETAILS = buildNodeDetailMap(SAMPLE_GRAPH);
