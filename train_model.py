"""
Script d'entraînement du modèle local de matching RH.
Utilise intfloat/multilingual-e5-base comme modèle de base.

Usage:
    python train_model.py                        # Entraînement avec données synthétiques
    python train_model.py --data ./my_data.json  # Entraînement avec vos données
    python train_model.py --eval                 # Évaluation seulement
"""

import os
import json
import argparse
import logging
from typing import List, Tuple

from sentence_transformers import (
    SentenceTransformer,
    InputExample,
    losses,
    evaluation,
)
from torch.utils.data import DataLoader

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
BASE_MODEL      = "intfloat/multilingual-e5-base"   # Remplace MiniLM
MODEL_SAVE_PATH = "./trained_model"
EVAL_SAVE_PATH  = "./eval_results"
BATCH_SIZE      = 2
EPOCHS          = 3
WARMUP_STEPS    = 100

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# DONNÉES SYNTHÉTIQUES (si pas de fichier JSON)
# ─────────────────────────────────────────────
SYNTHETIC_EXAMPLES: List[Tuple[str, str, float]] = [

    # ── Développement Web ──────────────────────────────────────────────────────
    (
        "Développeur Full Stack React Node.js 3 ans expérience Paris",
        "5 ans développeur React, Node.js, PostgreSQL, Docker. Missions e-commerce.",
        0.95,
    ),
    (
        "Développeur Full Stack React Node.js 3 ans expérience Paris",
        "Comptable 10 ans expérience Excel, bilan financier, fiscalité.",
        0.02,
    ),
    (
        "Ingénieur Backend Python Django REST API microservices",
        "Développeur Python 4 ans Django, FastAPI, Kubernetes, CI/CD GitHub Actions.",
        0.90,
    ),
    (
        "Ingénieur Backend Python Django REST API microservices",
        "Chef de projet marketing digital SEO/SEA campagnes Google Ads.",
        0.03,
    ),

    # ── Data Science ───────────────────────────────────────────────────────────
    (
        "Data Scientist Machine Learning NLP Python TensorFlow 2 ans",
        "Data Scientist 3 ans Python scikit-learn TensorFlow NLP classification texte.",
        0.93,
    ),
    (
        "Data Scientist Machine Learning NLP Python TensorFlow 2 ans",
        "Infirmier urgences 8 ans soins intensifs bloc opératoire.",
        0.01,
    ),
    (
        "Ingénieur Data Pipeline Spark Kafka AWS",
        "Data Engineer 5 ans Spark, Kafka, AWS S3 Glue, orchestration Airflow.",
        0.91,
    ),
    (
        "Ingénieur Data Pipeline Spark Kafka AWS",
        "Professeur mathématiques lycée algèbre géométrie.",
        0.04,
    ),

    # ── DevOps / Cloud ─────────────────────────────────────────────────────────
    (
        "DevOps Engineer CI/CD Kubernetes AWS Terraform 4 ans",
        "DevOps 6 ans AWS EKS Terraform Helm Jenkins pipeline CI/CD.",
        0.92,
    ),
    (
        "DevOps Engineer CI/CD Kubernetes AWS Terraform 4 ans",
        "Designer UX/UI Figma prototypage maquettes responsive.",
        0.02,
    ),

    # ── Mobile ────────────────────────────────────────────────────────────────
    (
        "Développeur Mobile iOS Swift SwiftUI 3 ans",
        "Développeur iOS 4 ans Swift SwiftUI Combine App Store publication.",
        0.94,
    ),
    (
        "Développeur Mobile Android Kotlin Jetpack Compose",
        "Développeur Android 3 ans Kotlin Jetpack Compose Room Retrofit.",
        0.92,
    ),
    (
        "Développeur Mobile Android Kotlin Jetpack Compose",
        "Analyste financier audit interne contrôle gestion.",
        0.02,
    ),

    # ── Cybersécurité ─────────────────────────────────────────────────────────
    (
        "Expert Cybersécurité pentest SIEM SOC certifié CISSP",
        "Ingénieur sécu 5 ans pentest Metasploit SIEM Splunk certif OSCP.",
        0.91,
    ),
    (
        "Expert Cybersécurité pentest SIEM SOC certifié CISSP",
        "Commercial grands comptes télécoms négociation contrats B2B.",
        0.01,
    ),

    # ── Management / RH ───────────────────────────────────────────────────────
    (
        "Chef de projet IT Agile Scrum gestion équipe 5 ans",
        "Chef de projet 6 ans Agile Scrum Jira roadmap équipe 10 personnes.",
        0.90,
    ),
    (
        "Chef de projet IT Agile Scrum gestion équipe 5 ans",
        "Développeur frontend Angular TypeScript RxJS.",
        0.20,
    ),
    (
        "Responsable RH recrutement SIRH 5 ans",
        "RH généraliste 7 ans recrutement cadres SIRH Workday paie ADP.",
        0.91,
    ),
    (
        "Responsable RH recrutement SIRH 5 ans",
        "Ingénieur réseau Cisco CCNA VPN MPLS.",
        0.03,
    ),

    # ── Finance / Comptabilité ────────────────────────────────────────────────
    (
        "Contrôleur de gestion reporting finance Excel Power BI",
        "Contrôleur de gestion 4 ans budgets reporting mensuel Power BI SAP.",
        0.92,
    ),
    (
        "Contrôleur de gestion reporting finance Excel Power BI",
        "Développeur Symfony PHP MySQL API REST.",
        0.02,
    ),

    # ── Enseignement / Académique ─────────────────────────────────────────────
    (
        "Enseignant informatique université Java POO algorithmique",
        "Enseignant chercheur 8 ans Java Python algorithmique publi IEEE.",
        0.89,
    ),
    (
        "Enseignant informatique université Java POO algorithmique",
        "Logisticien supply chain entrepôt gestion stocks.",
        0.02,
    ),

    # ── Cas frontières (scores intermédiaires) ────────────────────────────────
    (
        "Développeur Full Stack React Node.js 3 ans expérience Paris",
        "Développeur frontend React 1 an stage e-commerce, notions Node.",
        0.60,
    ),
    (
        "Data Scientist Machine Learning NLP Python TensorFlow 2 ans",
        "Étudiant Master IA Python pandas scikit-learn projet NLP universitaire.",
        0.55,
    ),
    (
        "DevOps Engineer CI/CD Kubernetes AWS Terraform 4 ans",
        "Administrateur système Linux 3 ans scripts Bash, notions Docker.",
        0.50,
    ),
    (
        "Chef de projet IT Agile Scrum gestion équipe 5 ans",
        "Développeur senior 8 ans, lead tech, notions gestion projet Kanban.",
        0.45,
    ),

    # ── Langue arabe / Tunisien ───────────────────────────────────────────────
    (
        "مطور ويب متكامل React Node.js خبرة 3 سنوات",
        "مطور 5 سنوات React Node.js PostgreSQL Docker مشاريع تجارة إلكترونية.",
        0.93,
    ),
    (
        "عالم بيانات تعلم آلي Python TensorFlow سنتان",
        "خبير بيانات 3 سنوات Python scikit-learn TensorFlow معالجة لغات طبيعية.",
        0.91,
    ),
]


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def load_examples_from_json(path: str) -> List[Tuple[str, str, float]]:
    """
    Charge les exemples depuis un fichier JSON.

    Format attendu :
    [
      {"offer_text": "...", "candidate_text": "...", "score": 0.9},
      ...
    ]
    """
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    examples = []
    for item in raw:
        examples.append((
            item["offer_text"],
            item["candidate_text"],
            float(item["score"]),
        ))
    logger.info(f"Loaded {len(examples)} examples from {path}")
    return examples


def build_input_examples(
    data: List[Tuple[str, str, float]]
) -> List[InputExample]:
    """Convertit les tuples en InputExample pour SentenceTransformers."""
    return [
        InputExample(
            texts=[offer, candidate],
            label=float(max(0.0, min(1.0, score))),
        )
        for offer, candidate, score in data
    ]


def split_train_eval(
    examples: List[InputExample],
    eval_ratio: float = 0.15,
):
    """Découpe train / eval."""
    cut = max(1, int(len(examples) * (1 - eval_ratio)))
    return examples[:cut], examples[cut:]


# ─────────────────────────────────────────────
# ENTRAÎNEMENT
# ─────────────────────────────────────────────
def train(data_path: str | None = None, epochs: int = EPOCHS) -> None:
    # 1. Choix des données
    raw_data = (
        load_examples_from_json(data_path)
        if data_path and os.path.exists(data_path)
        else SYNTHETIC_EXAMPLES
    )

    if not raw_data:
        raise ValueError("Aucune donnée d'entraînement disponible.")

    logger.info(f"Total examples: {len(raw_data)}")

    # 2. Chargement du modèle de base
    logger.info(f"Loading base model: {BASE_MODEL}")
    model = SentenceTransformer(BASE_MODEL)

    # 3. Préparation des données
    all_examples   = build_input_examples(raw_data)
    train_examples, eval_examples = split_train_eval(all_examples)

    logger.info(f"Train: {len(train_examples)} | Eval: {len(eval_examples)}")

    train_dataloader = DataLoader(
        train_examples, shuffle=True, batch_size=BATCH_SIZE
    )

    # 4. Loss (CosineSimilarityLoss adapté au fine-tuning)
    train_loss = losses.CosineSimilarityLoss(model)

    # 5. Évaluateur de similarité cosinus
    os.makedirs(EVAL_SAVE_PATH, exist_ok=True)

    if eval_examples:
        sentences1 = [e.texts[0] for e in eval_examples]
        sentences2 = [e.texts[1] for e in eval_examples]
        scores     = [e.label   for e in eval_examples]

        evaluator = evaluation.EmbeddingSimilarityEvaluator(
            sentences1, sentences2, scores,
            name="hr-matching-eval",
        )
    else:
        evaluator = None

    # 6. Fine-tuning
    logger.info(f"Starting fine-tuning for {epochs} epoch(s)...")
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        evaluator=evaluator,
        epochs=epochs,
        warmup_steps=WARMUP_STEPS,
        output_path=EVAL_SAVE_PATH,
        show_progress_bar=True,
        save_best_model=True,
    )

    # 7. Sauvegarde du modèle final
    os.makedirs(MODEL_SAVE_PATH, exist_ok=True)
    model.save(MODEL_SAVE_PATH)
    logger.info(f"✅ Model saved to {MODEL_SAVE_PATH}")

    # 8. Test rapide post-entraînement
    quick_eval(model)


# ─────────────────────────────────────────────
# ÉVALUATION RAPIDE
# ─────────────────────────────────────────────
def quick_eval(model: SentenceTransformer) -> None:
    """Affiche quelques scores pour vérifier la cohérence du modèle."""
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np

    test_pairs = [
        (
            "Développeur Full Stack React Node.js 3 ans",
            "5 ans React, Node.js, PostgreSQL, Docker",
            "✅ Très proche (attendu ~0.90)",
        ),
        (
            "Développeur Full Stack React Node.js 3 ans",
            "Comptable Excel bilan fiscal",
            "❌ Très différent (attendu ~0.10)",
        ),
        (
            "Data Scientist Python TensorFlow NLP",
            "Étudiant Master IA scikit-learn projet NLP",
            "⚠️  Proche partiel (attendu ~0.55)",
        ),
    ]

    logger.info("\n── Quick Evaluation ──────────────────────────")
    for offer, candidate, label in test_pairs:
        e1 = model.encode([offer])
        e2 = model.encode([candidate])
        sim = float(cosine_similarity(e1, e2)[0][0])
        logger.info(f"{label}")
        logger.info(f"   Offer    : {offer[:60]}")
        logger.info(f"   Candidate: {candidate[:60]}")
        logger.info(f"   Score    : {sim:.4f}\n")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune HR matching model")
    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Chemin vers un fichier JSON de données d'entraînement",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=EPOCHS,
        help=f"Nombre d'époques (défaut: {EPOCHS})",
    )
    parser.add_argument(
        "--eval",
        action="store_true",
        help="Évaluer le modèle existant sans entraîner",
    )
    args = parser.parse_args()

    if args.eval:
        logger.info("Loading existing model for evaluation only...")
        if os.path.exists(MODEL_SAVE_PATH):
            m = SentenceTransformer(MODEL_SAVE_PATH)
        else:
            m = SentenceTransformer(BASE_MODEL)
        quick_eval(m)
    else:
        train(data_path=args.data, epochs=args.epochs)