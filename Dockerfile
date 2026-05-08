# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Base image
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base

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

COPY main.py                 ./main.py
COPY calibrator_axe1_v5.pkl  ./calibrator_axe1_v5.pkl

# Writable directories for models & HuggingFace cache
# e5 supprimé — seul bge-m3 est utilisé
RUN mkdir -p /app/hf_cache /app/models/bge_m3

# ── Environment ──────────────────────────────────────────────────────────────
ENV HF_HOME=/app/hf_cache
ENV HUGGINGFACE_HUB_CACHE=/app/hf_cache
# TRANSFORMERS_CACHE est déprécié mais conservé pour compatibilité
ENV TRANSFORMERS_CACHE=/app/hf_cache

# Chemin du modèle bge-m3 (monté via volume au docker run)
ENV BGE_M3_SAVE_PATH=/app/models/bge_m3

# Port unifié — EXPOSE, HEALTHCHECK et CMD utilisent tous 8001
ENV WEBSITES_PORT=8001
EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# workers=1 obligatoire : sentence-transformers n'est pas fork-safe
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1", "--no-access-log"]