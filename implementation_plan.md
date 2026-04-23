# Migration vers BAAI/bge-m3 et Amélioration du Système de Matching

Ce plan détaille les étapes techniques requises pour implémenter les recommandations de l'analyse précédente, en donnant la priorité à la migration vers le modèle `BAAI/bge-m3` pour améliorer considérablement les performances de récupération et d'analyse des CV.

## User Review Required

> [!IMPORTANT]
> Le modèle `bge-m3` est environ deux fois plus volumineux que `e5-base` (~567 millions de paramètres). Assurez-vous que l'environnement d'exécution (serveur ou machine locale) dispose de suffisamment de RAM (et de VRAM si un GPU est utilisé) pour charger et exécuter ce modèle. Le téléchargement initial prendra également plus de temps.
>
> Une fois le plan approuvé, vous devrez supprimer le dossier `./trained_model` existant s'il a été compilé avec `e5-base`, car il ne sera plus compatible.

## Proposed Changes

---

### Core Matching Logic & Model Migration

#### [MODIFY] [main.py](file:///c:/Users/Adminn/Desktop/pfe/ai-matching-service/main.py)
- Mettre à jour la variable `BASE_MODEL` pour utiliser `"BAAI/bge-m3"`.
- Supprimer la fonction `encode_for_e5` (les préfixes `query:` et `passage:` ne sont plus nécessaires avec BGE-M3).
- Mettre à jour `calculate_semantic_similarity` pour utiliser `normalize_embeddings=True` lors du calcul des vecteurs.
- **Enrichissement du texte candidat** : Modifier la création de `cand_text` dans `process_match` pour inclure les années d'expérience et les informations sur les diplômes, fournissant ainsi plus de contexte au nouveau modèle capable d'analyser jusqu'à 8192 tokens.
- **Amélioration du Matching de Compétences** : Rendre la comparaison des compétences moins rigide dans `process_match`. Au lieu d'une intersection stricte exacte, implémenter une vérification basée sur les sous-chaînes (ex. faire correspondre "react" avec "react.js").

#### [MODIFY] [train_model.py](file:///c:/Users/Adminn/Desktop/pfe/ai-matching-service/train_model.py)
- Mettre à jour la variable `BASE_MODEL` pour utiliser `"BAAI/bge-m3"`.

## Open Questions

> [!WARNING]
> Le jeu de données synthétiques actuel (`SYNTHETIC_EXAMPLES` dans `train_model.py`) ne compte que ~28 exemples. Souhaitez-vous que je modifie le code pour augmenter artificiellement ce volume ou prévoyez-vous de fournir un fichier `hr_dataset.json` plus complet par la suite pour l'entraînement ?

## Verification Plan

### Automated Tests
- Exécuter la suite d'évaluation intégrée : `python train_model.py --eval`
- Le système tentera de charger le nouveau modèle de base et d'évaluer les exemples synthétiques. Les scores de log s'afficheront et ne devront générer aucune erreur liée au format d'embedding (dimension ou shape mismatch).

### Manual Verification
- Démarrer l'API : `uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
- Envoyer une requête `POST /api/match` avec un long profil de candidat et vérifier que le `semanticScore` est généré correctement et de manière cohérente, sans erreur de limite de tokens.
- Vérifier que les compétences telles que "node" s'apparient correctement avec "Node.js".
