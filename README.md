# 🎓 API d'Extraction Intelligente de CV (NER & LLM)
**Système automatisé pour le recrutement d'enseignants universitaires et chercheurs.**

---

## 📖 À Propos du Projet
Ce projet est une API REST de traitement du langage naturel (NLP) conçue pour extraire, analyser et structurer automatiquement les données contenues dans des Curriculum Vitae (CV) français (formats `.txt`, `.pdf` ou `.docx`). 

Initialement conçu pour le secteur IT, le modèle a été étendu et spécifiquement entraîné pour **comprendre le vocabulaire du milieu académique** (Candidats Professeurs, Maîtres de Conférences, Chercheurs, Pédagogie, Publications, Institutions Universitaires).

## 🚀 Les 3 Pipelines d'Extraction

L'application offre trois niveaux d'intelligence pour transformer un CV brut en un profil JSON normalisé :

| Pipeline | Technologie | Vitesse | Précision | Recommandé pour |
| :--- | :--- | :--- | :--- | :--- |
| **V1 (Classique)** | spaCy (Custom NER) | ⚡ Très Rapide | ⭐ Moyenne | Traitement hors-ligne, détection basique. |
| **V2 (Génératif)** | LLM (Qwen2.5) | 🐢 Lente | ⭐⭐⭐ Élevée | Compréhension sémantique profonde. |
| **V3 (Hybride)** | **spaCy + LLM** | ⏱️ Modérée | ⭐⭐⭐⭐ **Maximale** | **La solution ultime.** Allie la certitude du dictionnaire spaCy à l'intelligence de déduction du LLM. |

---

## 🛠️ Stack Technique
* **Backend :** FastAPI, Python 3.9+, Pydantic
* **NLP Local :** spaCy (`fr_core_news_sm`) + `EntityRuler`
* **IA Générative :** LangChain, API HuggingFace (`Qwen/Qwen2.5-7B-Instruct`)
* **Traitement de Fichiers :** PyMuPDF (`fitz`), `python-docx`
* **Fiabilité :** `json-repair` (Garde-fou contre les hallucinations LLM)

---

## ⚙️ Installation & Lancement

### 1. Préparation de l'environnement
Installez les dépendances requises :
```bash
pip install -r requirements.txt
```

### 2. Configuration API (Obligatoire pour V2 / V3)
Créez un fichier `.env` à la racine du projet et ajoutez votre clé HuggingFace :
```ini
HUGGINGFACEHUB_API_TOKEN=votre_token_huggingface_ici
```

### 3. Entraînement du Modèle Académique (spaCy)
Générez le dictionnaire métier (compétences IT, pédagogie, diplômes universitaires) :
```bash
python train_model.py
```

### 4. Démarrage du Serveur
Lancez l'API en local (avec rechargement à chaud) :
```bash
uvicorn app:app --reload
```
📍 **Lien API :** `http://127.0.0.1:8000`  
📚 **Swagger UI (Documentation interactive) :** `http://127.0.0.1:8000/docs`

---

## 📡 Endpoints API (Routes)

Toutes les requêtes renvoient un objet JSON standardisé contenant : `Identification`, `Formation`, `Experience`, `Competences`, `Langues`, `Publications`, `IndicateursIA`.

### 🌟 Routes Hybrides (V3) - *Recommandées*
* **`POST /api/v3/extract-cv-hybrid`** 
  *(Corps JSON : `{"texte_brut": "..."}`)*
  Pré-analyse le texte avec spaCy pour extraire les entités sûres, puis délègue la structuration complexe au LLM.
* **`POST /api/v3/extract-cv-file-hybrid`** 
  *(Form-Data : `file` uploads `.pdf` ou `.docx`)*

### 🧠 Routes LLM (V2)
* **`POST /api/v2/extract-cv-llm`** (Texte brut)
* **`POST /api/v2/extract-cv-file-llm`** (Fichiers)

### ⚡ Routes spaCy (V1)
* **`POST /api/v1/extract-cv`** (Texte brut)
* **`POST /api/v1/extract-cv-file`** (Fichiers)

### 🩺 Santé
* **`GET /health`** : Vérifie l'état du serveur et si les modèles sont bien chargés en mémoire.

---

## 📂 Architecture du Projet
```text
📦 extraction_automatique_de_CV
 ┣ 📂 models/                 # Modèle spaCy compilé (généré par train_model.py)
 ┣ 📜 app.py                  # Contrôleurs FastAPI et définition des routes
 ┣ 📜 utils.py                # Cœur métier : Heuristiques, LangChain, et nettoyage JSON
 ┣ 📜 train_model.py          # Script d'apprentissage du dictionnaire métier (Fac/IT)
 ┣ 📜 requirements.txt        # Dépendances du projet
 ┣ 📜 .env                    # Variables privées (Clés API)
 ┗ 📜 README.md               # Ce fichier
```
