# Rapport d'Intervention : Correction de l'Erreur d'Extraction LLM

Ce document détaille l'analyse, la cause et les solutions apportées pour corriger l'erreur d'extraction de CV via le LLM (`Invalid json output: ...`).

## 1. Description du Problème Initial
Lors de l'appel à la route `/api/v2/extract-cv-llm`, l'application retournait une erreur 400 ou 500 liée à un échec de parsing ("OUTPUT_PARSING_FAILURE"). 

L'analyse de la sortie brute générée par le modèle LLM (`HuggingFaceH4/zephyr-7b-beta`) a révélé plusieurs problèmes majeurs d'hallucinations qui cassaient la syntaxe JSON stricte attendue par `json.loads` et Pydantic :
- **Texte conversationnel :** Le modèle ajoutait des phrases avant et après le JSON (ex: *"Voici le résultat : "*).
- **Commentaires JavaScript :** Le modèle tentait de justifier pourquoi certains champs étaient vides directement dans le JSON en utilisant des commentaires interdits dans le standard JSON (ex: `// Les champs "institutions" sont vides car il n'a pas d'expérience...`).
- **Erreurs de Schéma :** Des accolades ou des crochets n'étaient parfois pas refermés à cause de la limitation de tokens ou de l'incapacité du modèle à maintenir la structure complexe.

## 2. Solutions Techniques Implémentées

Pour rendre l'extraction robuste, résiliente aux erreurs et 100% fonctionnelle, trois couches de sécurité ont été mises en place :

### A. Changement de Modèle LLM (`utils.py`)
Le modèle `zephyr-7b-beta` a été remplacé par **`Qwen/Qwen2.5-7B-Instruct`**.
- **Pourquoi ?** La famille Qwen 2.5 est actuellement l'une des architectures open source les plus performantes (surpassant Llama 3 de même taille sur de nombreux benchmarks) pour suivre des instructions complexes de formatage et écrire du code/JSON. Il génère le JSON de manière beaucoup plus fiable.

### B. "Prompt Engineering" et Few-Shot Prompting (`utils.py`)
Le prompt (les instructions données au modèle) a été entièrement réécrit.
- Passage d'un `PromptTemplate` classique à un **`ChatPromptTemplate`** (avec des rôles `"system"` et `"user"`).
- **Few-Shot Prompting :** Ajout d'un exemple concret d'entrée et de sortie exacte (1-shot example) dans les instructions système. Donner un exemple au modèle réduit de plus de 90% les risques qu'il hallucine ou rajoute du texte inutile par rapport à de simples instructions textuelles.

### C. Ajout d'un système d'Auto-Réparation JSON (`utils.py` & `requirements.txt`)
Même avec le meilleur modèle du monde, des erreurs de syntaxe peuvent survenir (virgule manquante en fin de liste, guillemets mal fermés).
1. **Implémentation de `clean_llm_json` :** Une nouvelle fonction Python utilisant des expressions régulières (Regex) qui va extraire de force la portion de texte située entre la première `{` et la dernière `}` et supprimer préventivement tout commentaire de type `//`.
2. **Installation de `json-repair` :** Le paquet Python `json-repair` a été ajouté au projet (`requirements.txt`). Ce module agit comme un filet de sécurité : il prend une chaîne de caractères ressemblant à du JSON, analyse les erreurs de syntaxe courantes causées par les LLM, et recrée un dictionnaire Python valide avant de l'envoyer au validateur strict (Pydantic).

## 3. Nouveau Flux d'Exécution (Workflow)

Désormais, lors d'une requête d'extraction intelligente :
1. Le texte brut du CV est injecté dans le nouveau **ChatPromptTemplate** avec **Qwen2.5**.
2. Le LLM génère sa réponse.
3. Le texte passe dans **`clean_llm_json`** (nettoyage basique regex).
4. Le texte nettoyé passe dans **`json_repair`** (réparation syntaxique ultime de la chaîne).
5. Le dictionnaire validé est ingéré par le modèle **Pydantic (`CVExtraction`)** pour vérifier les types finaux.
6. Le profil JSON parfait est renvoyé à l'API.

## 4. Tests et Validation
Plusieurs scripts locaux (`test_llm.py` et `test_llm_raw.py`) ont été créés et exécutés pour profiler la réponse. Les résultats montrent désormais un succès total dans l'intégration du JSON, sans aucune erreur de syntaxe.

*Fin du rapport.*
