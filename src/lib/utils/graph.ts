import type {
  Node,
  Edge,
  GraphNode,
  GraphEdge,
  RawTriplet,
  GraphTriplet,
  GraphitiNode,
  GraphitiEdge,
  GraphitiGraphResponse,
  GraphitiNodeType,
} from "@/lib/types/api";

const labelByNodeType: Record<GraphitiNodeType, string> = {
  entity: "Entity",
  fact: "Fact",
  episode: "Episode",
  community: "Community",
};

export function toGraphNode(node: Node): GraphNode {
  const primaryLabel =
    node.labels?.find((label) => label !== "Entity") ||
    labelByNodeType[node.type ?? "entity"] ||
    "Entity";

  return {
    id: node.uuid,
    value: node.name,
    uuid: node.uuid,
    name: node.name,
    created_at: node.created_at,
    updated_at: node.updated_at,
    attributes: node.attributes,
    summary: node.summary,
    labels: node.labels,
    primaryLabel,
  };
}

export function toGraphEdge(edge: Edge): GraphEdge {
  return {
    id: edge.uuid,
    value: edge.name,
    ...edge,
  };
}

export function toGraphTriplet(triplet: RawTriplet): GraphTriplet {
  return {
    source: toGraphNode(triplet.sourceNode),
    relation: toGraphEdge(triplet.edge),
    target: toGraphNode(triplet.targetNode),
  };
}

export function toGraphTriplets(triplets: RawTriplet[]): GraphTriplet[] {
  return triplets.map(toGraphTriplet);
}

export function createTriplets(edges: Edge[], nodes: Node[]): RawTriplet[] {
  // Create a Set of node UUIDs that are connected by edges
  const connectedNodeIds = new Set<string>();

  // Create triplets from edges
  const edgeTriplets = edges
    .map((edge) => {
      const sourceNode = nodes.find(
        (node) => node.uuid === edge.source_node_uuid
      );
      const targetNode = nodes.find(
        (node) => node.uuid === edge.target_node_uuid
      );

      if (!sourceNode || !targetNode) return null;

      // Add source and target node IDs to connected set
      connectedNodeIds.add(sourceNode.uuid);
      connectedNodeIds.add(targetNode.uuid);

      return {
        sourceNode,
        edge,
        targetNode,
      };
    })
    .filter(
      (t): t is RawTriplet =>
        t !== null && t.sourceNode !== undefined && t.targetNode !== undefined
    );

  // Find isolated nodes (nodes that don't appear in any edge)
  const isolatedNodes = nodes.filter((node) => !connectedNodeIds.has(node.uuid));

  // For isolated nodes, create special triplets
  const isolatedTriplets: RawTriplet[] = isolatedNodes.map((node) => {
    // Create a special marker edge for isolated nodes
    const virtualEdge: Edge = {
      uuid: `isolated-node-${node.uuid}`,
      source_node_uuid: node.uuid,
      target_node_uuid: node.uuid,
      // Use a special type that we can filter out in the Graph component
      type: "_isolated_node_",
      name: "", // Empty name so it doesn't show a label
      created_at: node.created_at,
      updated_at: node.updated_at,
    };

    return {
      sourceNode: node,
      edge: virtualEdge,
      targetNode: node,
    };
  });

  // Combine edge triplets with isolated node triplets
  return [...edgeTriplets, ...isolatedTriplets];
}

const fallbackTimestamp = () => new Date().toISOString();

export function graphitiNodeToNode(node: GraphitiNode): Node {
  const createdAt = node.timestamps?.created_at ?? fallbackTimestamp();
  const updatedAt = node.timestamps?.updated_at ?? createdAt;
  const label = labelByNodeType[node.type] ?? "Entity";

  const attributes: Record<string, unknown> = {
    ...node.metadata,
    score: node.score,
    community_id: node.community_id,
    importance: node.importance,
    tags: node.tags,
  };

  if (node.labels?.length) {
    attributes.labels = node.labels;
  }

  return {
    uuid: node.uuid,
    name: node.name,
    summary: node.summary ?? node.description,
    labels: node.labels?.length ? node.labels : [label],
    attributes,
    created_at: createdAt,
    updated_at: updatedAt,
    type: node.type,
    community_id: node.community_id,
    score: node.score,
    importance: node.importance,
    metadata: node.metadata,
  };
}

export function graphitiEdgeToEdge(edge: GraphitiEdge): Edge {
  const createdAt = edge.timestamps?.created_at ?? fallbackTimestamp();
  const updatedAt = edge.timestamps?.updated_at ?? createdAt;
  const relationName = edge.relationship_type || edge.fact || "related_to";

  return {
    uuid: edge.uuid,
    source_node_uuid: edge.source_uuid,
    target_node_uuid: edge.target_uuid,
    type: edge.relationship_type,
    name: relationName,
    relationship_type: edge.relationship_type,
    fact: edge.fact,
    created_at: createdAt,
    updated_at: updatedAt,
    valid_at: edge.valid_at,
    expired_at: edge.expired_at,
    invalid_at: edge.invalid_at,
    weight: edge.weight,
    confidence: edge.confidence,
  };
}

export function graphitiResponseToTriplets(
  response: GraphitiGraphResponse
): RawTriplet[] {
  const nodes = response.nodes.map(graphitiNodeToNode);
  const edges = response.edges.map(graphitiEdgeToEdge);
  return createTriplets(edges, nodes);
}
