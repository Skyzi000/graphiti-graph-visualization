# AGENTS.md - Graphiti Graph Visualization

## Overview

Web application for visualizing Graphiti knowledge graphs. Next.js (Frontend) + FastAPI (GraphitiService).

## Architecture

```
Browser → Next.js → GraphitiService → Neo4j/FalkorDB
           │
           └─ src/app/api/graphiti/* (API Routes)
```

### Directory Structure

```
src/
├── app/api/graphiti/     # Next.js API Routes (proxy to GraphitiService)
├── components/viewer/    # Graph viewer UI
├── hooks/                # React hooks (useGraphitiGraph, etc.)
├── lib/
│   ├── services/graphiti.ts  # API client (parseGraphQueryParams, fetchGraph)
│   ├── stores/viewerStore.ts # Zustand store
│   └── types/api.ts          # Type definitions
graphiti_service/
└── graphiti_service/
    ├── main.py           # FastAPI endpoints
    ├── service.py        # Core logic (get_graph, _extract_connected_subgraph)
    └── schemas.py        # Pydantic models
```

## Critical Data Flow

### Graph Fetch Processing Order

```
1. Fetch nodes/edges from DB (node_fetch_limit applied)
2. _extract_connected_subgraph() for subgraph extraction (when center_uuids specified)
3. _filter_nodes() for filtering + limit_nodes applied
4. _filter_edges() for filtering + limit_edges applied
```

## Implementation Notes

### limit_nodes/limit_edges Application Timing

**CRITICAL**: `limit_nodes` must be applied **AFTER** subgraph extraction and filtering.

```python
# service.py - _graph_from_graphiti()
# When center_uuids is specified, disable limit at DB fetch stage
should_skip_db_limit = bool(params.since or params.until or center_uuids)
node_fetch_limit = None if should_skip_db_limit else params.limit_nodes
```

**Reason**: Applying limit at DB query stage may exclude nodes required for subgraph extraction.

### Parameter Propagation Path

```
Frontend (GraphFiltersPanel)
  ↓ filtersToQuery()
useGraphitiGraphQuery
  ↓ URL params
Next.js API Route (/api/graphiti/graph)
  ↓ parseGraphQueryParams()
fetchGraph()
  ↓ appendQueryParams()
GraphitiService (/graph)
  ↓ FastAPI Query params
get_graph(params, center_uuids, center_depth)
```

When adding new parameters, update **ALL layers**:
1. `GraphFilters` (api.ts)
2. `filtersToQuery()` (graphiti.ts)
3. `parseGraphQueryParams()` (graphiti.ts)
4. `GraphitiGraphQuery` interface (graphiti.ts)
5. FastAPI endpoint params (main.py)
6. `GraphQuery` schema (schemas.py) - if needed

## Development Commands

```bash
# Local development (Frontend)
yarn dev

# Local development (GraphitiService)
cd graphiti_service && uv run uvicorn graphiti_service.main:app --reload

# Docker startup
docker-compose up --build

# Rebuild GraphitiService only
docker-compose up --build graphiti-service

# Direct API test
# Check docker-compose.yml for port or run locally with uv (default: 8000)
curl "http://localhost:<port>/graph?group_id=<id>&recent_episode_center=true"
```

### OpenAPI Schema Generation

When modifying `schemas.py` or FastAPI endpoints, regenerate TypeScript types:

```bash
# Full sync (export + types + zod)
yarn openapi:sync

# Individual steps:
yarn openapi:export  # Export OpenAPI JSON from FastAPI (requires GraphitiService deps)
yarn openapi:types   # Generate TypeScript types (generated/schema.d.ts)
yarn openapi:zod     # Generate Zod schemas (generated/api-client.ts)
```

**Note**: `openapi:export` runs inside `graphiti_service/` and requires `uv` environment.

## Debugging

### Log Levels

- GraphitiService: Controlled by `LOG_LEVEL` env var (DEBUG/INFO/WARNING)
- Next.js: Use `console.log`

### Common Issues

1. **Parameters not reflected**: Verify parameter propagation through all layers
2. **Too few nodes returned**: Check if `limit_nodes` is being applied at DB query stage
3. **Docker changes not reflected**: Restart with `--build` option
