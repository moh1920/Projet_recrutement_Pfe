FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-ara \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir \
    https://github.com/explosion/spacy-models/releases/download/fr_core_news_lg-3.7.0/fr_core_news_lg-3.7.0-py3-none-any.whl && \
    find /usr/local/lib/python3.11 -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11 -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true && \
    pip cache purge

COPY . .

# ✅ Télécharger le modèle NER une seule fois au BUILD
ARG AZURE_STORAGE_KEY
ENV AZURE_STORAGE_KEY=$AZURE_STORAGE_KEY

RUN python -c "from utils_azure import download_model_from_blob; download_model_from_blob('./models/model_ner_cv')"

# ✅ Supprimer la clé après usage — sécurité
RUN unset AZURE_STORAGE_KEY

EXPOSE 8000

CMD ["uvicorn", "app:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--timeout-keep-alive", "180"]