# Rapport d'Analyse Globale : Projet d'Extraction Automatique de CV

Ce document fournit une analyse complète du projet d'extraction intelligente de CV. Il aborde l'architecture du système, la comparaison des performances suite au changement de modèle LLM, et les choix stratégiques concernant le moteur OCR.

## 1. Vue d'Ensemble du Projet
Le projet consiste en une API REST robuste (FastAPI) conçue pour extraire, analyser et structurer automatiquement les données de CVs (format texte, PDF, DOCX, ou image). Bien qu'initialement pensée pour le domaine IT, l'application a été spécifiquement entraînée pour le milieu académique (recrutement de professeurs, chercheurs). L'API génère un profil JSON standardisé incluant l'identification, la formation, l'expérience, les compétences, les publications, et calcule des indicateurs d'IA pertinents.

## 2. Architecture et Pipelines d'Extraction
L'application propose trois niveaux de traitement pour équilibrer vitesse et précision :
- **V1 (Classique / NER spaCy)** : Repose sur un modèle spaCy enrichi par des règles manuelles (`EntityRuler`) via le script `train_model.py`. Cette approche est très rapide mais sa précision est moyenne ; elle se limite à la détection d'entités spécifiques (diplômes, universités tunisiennes, langages).
- **V2 (Génératif / LLM)** : Délègue l'extraction et la structuration à un Grand Modèle de Langage (LLM) via LangChain. Permet une compréhension sémantique profonde du document, mais au prix d'une latence plus élevée.
- **V3 (Hybride)** : La solution optimale. Elle pré-analyse d'abord le texte avec spaCy pour extraire de manière fiable les entités de base, et transmet ce "contexte pré-mâché" au LLM. Cela réduit l'effort cognitif du LLM et maximise la précision globale.

## 3. Comparaison et Performance du LLM
L'intégration initiale du LLM a posé des défis de stabilité, conduisant à une refonte de cette couche.
- **Modèle Initial (`zephyr-7b-beta`)** : Ce modèle générait de fréquentes hallucinations. Il avait tendance à ajouter du texte conversationnel autour du JSON, à utiliser des commentaires JavaScript (`//`) invalides dans le JSON pour s'expliquer, ou à produire des structures mal fermées. Ces erreurs causaient des échecs systématiques de parsing (erreurs 400/500).
- **Nouveau Modèle (`Qwen2.5-7B-Instruct` / `Qwen3-8B`)** : La transition vers la famille Qwen a drastiquement amélioré la fiabilité. Qwen est nativement optimisé pour suivre des consignes strictes de formatage et écrire du code/JSON. Les échecs de structure ont été quasiment éliminés.
- **Mécanismes de Sécurité Ajoutés** : Pour obtenir un taux de succès de 100%, l'architecture V2/V3 inclut désormais :
  1. **Few-Shot Prompting** (`ChatPromptTemplate`) pour guider le modèle par l'exemple.
  2. Une fonction Python `clean_llm_json` utilisant des expressions régulières (Regex) pour tronquer les commentaires et isoler le bloc JSON.
  3. La librairie `json-repair` comme filet de sécurité final, tolérant les erreurs syntaxiques résiduelles, avant la validation stricte via Pydantic.

## 4. Stratégie et Choix de l'OCR
Pour le traitement des images et des PDF scannés, le choix s'est porté sur **Tesseract OCR**, combiné à un puissant pipeline de prétraitement visuel (OpenCV).
- **Prétraitement d'Image (`utils_image.py`)** : Avant de soumettre l'image à Tesseract, OpenCV effectue plusieurs opérations : Upscaling dynamique pour atteindre au moins 300 DPI, passage en niveaux de gris, augmentation du contraste local (CLAHE), débruitage (`fastNlMeansDenoising`), binarisation adaptative robuste aux fonds complexes, et redressement automatique de l'inclinaison (Deskew).
- **Exécution Multi-Configuration** : La fonction `ocr_with_best_config` interroge Tesseract avec trois configurations différentes de Page Segmentation Mode (PSM 6, 3, et 4). Le système conserve la sortie contenant le plus de texte pertinent. En cas d'échec de la binarisation (fonds très sombres ou très clairs), un fallback sur l'image en niveaux de gris brut est déclenché.

## 5. Évaluation et Notation Académique
L'API dispose également d'une route d'évaluation (`evaluate_cv_against_offer`) qui utilise le LLM pour comparer le JSON du candidat à une offre d'emploi JSON. Ce module attribue un score détaillé sur 100 basé sur le niveau d'études, l'adéquation des compétences, les années d'expérience, et l'expérience académique (recherche, enseignement de modules spécifiques).

## 6. Conclusion
L'architecture actuelle du projet est hautement résiliente. Le choix d'un LLM spécialisé dans le code (Qwen), combiné à des processus de nettoyage regex et à json-repair, garantit l'extraction de données sans faille. De plus, le pipeline OCR avancé permet au système de surmonter les limitations des documents mal scannés ou formatés comme des images, offrant ainsi une solution de recrutement automatisée complète et fiable.
