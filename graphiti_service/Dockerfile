# syntax=docker/dockerfile:1.7

FROM ghcr.io/astral-sh/uv:python3.11-trixie-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_CACHE_DIR=/root/.cache/uv

WORKDIR /app

# 依存だけ先に解決してキャッシュを効かせる
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:${PATH}"

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "graphiti_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
