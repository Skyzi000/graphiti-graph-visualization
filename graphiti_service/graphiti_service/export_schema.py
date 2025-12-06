"""OpenAPIスキーマをエクスポート（サーバー起動不要）"""

import json
from pathlib import Path


def export():
    """FastAPIアプリからOpenAPIスキーマを生成し、JSONファイルに保存"""
    # FastAPIアプリをインポート
    from graphiti_service.main import app

    # OpenAPIスキーマを生成
    schema = app.openapi()

    # プロジェクトルートの generated/ に保存
    output = Path(__file__).parent.parent.parent / "generated" / "openapi.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(schema, indent=2, ensure_ascii=False))

    print(f"✓ OpenAPI schema exported to {output}")


if __name__ == "__main__":
    export()
