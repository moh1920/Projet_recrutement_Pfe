# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Base image
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base

# System deps needed by sentence-transformers / torch
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        git \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Install Python dependencies (layer-cached separately)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Final runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM deps AS runtime

WORKDIR /app

# Copy only what the API needs at runtime
COPY main.py              ./main.py
COPY calibrator_axe1_v5.pkl ./calibrator_axe1_v5.pkl

# Create writable directories for models & HuggingFace cache
RUN mkdir -p /app/hf_cache /app/models/bge_m3 /app/models/e5

# ── Environment ──────────────────────────────────────────────────────────────
# HuggingFace cache (overrides the Windows path set in main.py at build time)
ENV HF_HOME=/app/hf_cache
ENV HUGGINGFACE_HUB_CACHE=/app/hf_cache
ENV TRANSFORMERS_CACHE=/app/hf_cache

# Model paths (read by main.py via os.environ)
ENV BGE_M3_MODEL_PATH=/app/models/bge_m3
ENV E5_MODEL_PATH=/app/models/e5

# Server port (Azure Container Apps uses WEBSITES_PORT)
ENV WEBSITES_PORT=8000

EXPOSE 8000

# Health check (matches the /health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
