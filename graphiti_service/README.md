# Graphiti Graph Service (FastAPI)

Graphiti Graph Visualization (Next.js) から呼び出される BFF です。FastAPI で `GET /graph` と `GET /node/{uuid}` を公開し、Graphiti-core 経由で Neo4j のデータを返します。デモやモックデータはありません。

## セットアップ

```bash
cd graphiti_service
python -m venv .venv           # あるいは uv venv .venv
.venv/Scripts/activate.ps1     # PowerShell の場合
pip install -e .
```

### 必須環境変数

| 変数 | 説明 |
| --- | --- |
| `GRAPHITI_NEO4J_URI` | 例: `bolt://localhost:7687` |
| `GRAPHITI_NEO4J_USER` | Neo4j ユーザー名 |
| `GRAPHITI_NEO4J_PASSWORD` | Neo4j パスワード |
| `GRAPHITI_ALLOW_ORIGINS` | CORS を許可するオリジン。デフォルトは `*` |

これらが設定されていない場合、Graphiti サービスは起動時にエラーを返します。

## 実行

```bash
uvicorn graphiti_service.main:app --reload --port 8000
```

Graphiti-core の Entity/Edge/Episode/Community モデルをそのまま読み出し、Graphiti Plan (docs/graphiti-plan.md) に準拠した JSON を返します。Next.js Viewer からは `GRAPHITI_SERVICE_URL=http://localhost:8000` を指定してください。

## エンドポイント

### `GET /graph`

- Query: `group_id`(必須), `mode`, `node_ids`, `center_uuid`, `since`, `until`, `search`, `limit_nodes`, `limit_edges`, `include_episodes`
- Response: Graphiti nodes / edges / episodes / communities + meta

### `GET /node/{uuid}`

- Query: `group_id`(必須), `mode`, `depth=1|2`
- Response: 対象ノード + 近傍ノード/エッジ + 関連 Episode

## Docker / Compose

- サービス単体を Docker で起動:

```bash
docker build -t graphiti-graph-service ./graphiti_service
docker run -p 8000:8000 \
  -e GRAPHITI_NEO4J_URI=bolt://host.docker.internal:7687 \
  -e GRAPHITI_NEO4J_USER=neo4j \
  -e GRAPHITI_NEO4J_PASSWORD=secret \
  graphiti-graph-service
```

- Viewer とまとめて起動する場合 (リポジトリルート):

```bash
docker compose up --build
```

`docker-compose.yml` では `GRAPHITI_NEO4J_*` をそのまま `graphiti-service` に渡すため、`.env` 等で Neo4j 資格情報を設定してから実行してください。Viewer は `http://graphiti-service:8000` に対して Graphiti API を呼び出します。

## テスト

```bash
pytest
```
