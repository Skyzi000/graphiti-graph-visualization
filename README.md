# Graphiti Graph Visualization

Graphiti（Entity / Fact / Episode / Community）を Next.js 15 + D3.js で可視化するビューアです。  
My Memory Viewer 風のフル UI と、`/embed` で提供する iframe 向けの軽量 UI を同一コードベースで提供します。  
データは Graphiti Graph Service（FastAPI + graphiti-core）経由で取得します。

## 主な機能

- React Query + Zustand による `group_id` ベースのフェッチ／フィルタリング（検索・期間・Episode ON/OFF 等）
- Graphiti の Entity / Fact / Episode / Community を D3 force-directed グラフとして描画
- Node / Edge ポップオーバーと `/node/:uuid` 連携による詳細パネル（近傍・Episode を表示）
- `/embed?group_id=...` で利用できるシンプルな埋め込みモード
- Next.js API Route で Graphiti Graph Service をプロキシ。`GRAPHITI_USE_SAMPLE_DATA=true` に設定すると FastAPI が落ちている環境でもローカルのモックデータで UI を確認可能

## セットアップ

### 1. 依存パッケージ

```bash
corepack yarn install
```

### 2. 環境変数（`.env.local`）

```env
GRAPHITI_SERVICE_URL=http://localhost:8000
GRAPHITI_SERVICE_API_KEY=
GRAPHITI_USE_SAMPLE_DATA=false

# Graphiti Graph Service (FastAPI) に渡す Neo4j 情報
GRAPHITI_NEO4J_URI=bolt://localhost:7687
GRAPHITI_NEO4J_USER=neo4j
GRAPHITI_NEO4J_PASSWORD=secret
```

`GRAPHITI_USE_SAMPLE_DATA=true` にすると Next.js 側が `src/lib/mocks/sampleGraph.ts` を利用します。開発初期の UI 確認などでのみ使用し、本番運用では `false` にしてください。

### 3. 開発サーバー

```bash
corepack yarn dev
```

- Viewer: http://localhost:3000  
- Embed デモ: http://localhost:3000/embed?group_id=graphiti-demo-group

## Graphiti API Proxy

Next.js 側では以下の API Route が Graphiti Graph Service（FastAPI）をプロキシします。

| Route | 内容 |
| --- | --- |
| `GET /api/graphiti/graph` | `group_id`, `mode`, `search`, `since`, `until`, `include_episodes`, `limit_nodes`, `limit_edges` などを受け取り Graphiti `/graph` を呼び出します。 |
| `GET /api/graphiti/node/:uuid` | `group_id`, `mode`, `depth` を付与して FastAPI の `/node/:uuid` を呼び出し、NodeDetailPanel に表示します。 |

詳細なパラメータは `docs/graphiti-plan.md` を参照してください。

## Graphiti Graph Service (FastAPI)

- 配置: `graphiti_service/`
- 主要依存: FastAPI 0.115, Pydantic 2, graphiti-core 0.11+
- 起動方法（Python 3.11〜3.13 推奨）:

```bash
cd graphiti_service
python -m venv .venv
.venv\Scripts\activate        # Windows の場合
pip install -e .
uvicorn graphiti_service.main:app --port 8000 --reload
```

Graphiti-core を利用するため、`GRAPHITI_NEO4J_URI` / `GRAPHITI_NEO4J_USER` / `GRAPHITI_NEO4J_PASSWORD`を設定して Neo4j に格納された Graphiti データへ接続してください。デモデータやモックは一切ありません。

## Docker Compose で一括起動

Viewer と Graphiti Graph Service をまとめて起動したい場合はリポジトリルートで以下を実行します。

```bash
docker compose up --build
```

- Viewer: http://localhost:3000  
- Graphiti Graph Service: http://graphiti-service:8000（コンテナ内部で解決）

`docker-compose.yml` では `GRAPHITI_NEO4J_*` をそのまま FastAPI コンテナに渡す構成なので、`.env` もしくはシェル環境で Neo4j の資格情報を設定してから起動してください。

## 埋め込み例

```html
<iframe
  src="https://viewer.example/embed?group_id=graphiti-demo-group"
  width="100%"
  height="720"
  style="border:0"
  allow="clipboard-write"
></iframe>
```

## ライセンス

[MIT](LICENSE)

