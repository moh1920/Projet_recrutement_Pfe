# =============================================================================
# Dockerfile — API FastAPI Extraction de CV
# Image de base : Python 3.11 slim (Debian Bookworm)
# =============================================================================

FROM python:3.11-slim

# --- Métadonnées ---
LABEL maintainer="PFE Recrutement"
LABEL description="API FastAPI d'extraction et évaluation de CV avec SpaCy + LLM"

# --- Variables d'environnement ---
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# --- Répertoire de travail ---
WORKDIR /app

# --- Installation des dépendances système ---
# tesseract-ocr       : moteur OCR
# tesseract-ocr-fra   : pack de langue française pour Tesseract
# libgl1              : requis par OpenCV (cv2)
# libglib2.0-0        : requis par OpenCV
# wget curl           : pour télécharger le modèle SpaCy si besoin
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# --- Installation des dépendances Python ---
# uv est utilisé à la place de pip : résolveur SAT ultra-rapide,
# ne souffre pas du problème "resolution-too-deep" de pip 26.
COPY requirements.txt .

RUN pip install --no-cache-dir --quiet uv \
    && uv pip install --system --no-cache -r requirements.txt

# --- Téléchargement du modèle SpaCy de base ---
# fr_core_news_lg est le modèle de fallback si model_ner_cv est absent
RUN python -m spacy download fr_core_news_lg

# --- Copie des fichiers de l'application ---
COPY app.py .
COPY utils.py .
COPY utils_image.py .

# --- Copie du modèle NER personnalisé ---
# Le dossier models/ est copié depuis votre machine locale
# (retirez models/ du .gitignore avant de faire docker build, ou utilisez un volume)
COPY models/ ./models/

# --- Port exposé ---
EXPOSE 8000

# --- Commande de démarrage ---
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
