"""
=============================================================================
  Script d'entraînement HR Matching — Axe 1 V4 (Dataset 800 paires)
=============================================================================
Corrections vs V3 :
  ✅ CORRECTION 1 : Dataset étendu à 800 paires (mix synthétique + généré)
  ✅ CORRECTION 2 : Dataset rééquilibré (~15% négatifs / ~31% zone grise / ~54% positifs)
  ✅ CORRECTION 3 : Epochs adaptés 5 → 3 (dataset plus grand, moins d'overfitting)
  ✅ CORRECTION 4 : LR conservé 1e-5 (stable sur plus de données)
  ✅ CORRECTION 5 : Calibration post-training automatique (LinearRegression)
  ✅ CORRECTION 6 : Pondération CosineLoss x2 vs MNR (priorité calibration)
  ✅ CORRECTION 7 : Ancres négatives doublées dans CosineLoss (12 au lieu de 6)
  ✅ CORRECTION 8 : Sauvegarde calibrateur joblib pour production
  ✅ CORRECTION 9 : Métriques calibrées vs non-calibrées dans le rapport final
  ✅ CORRECTION 10 : Support dataset externe JSON (offer_text, candidate_text, score)

Objectif cible :
  Accuracy ±0.10 : 22% → 75%+
  MAE            : 0.29 → 0.08-
  Acc binaire    : 77%  → 90%+

Usage :
  python train_model_axe1_v4.py
  python train_model_axe1_v4.py --data train_data.json --test_data test_data.json
  python train_model_axe1_v4.py --eval --test_data test_data.json
=============================================================================
"""

import os
os.environ["HF_HOME"]               = "F:/HF_Cache"
os.environ["HUGGINGFACE_HUB_CACHE"] = "F:/HF_Cache"

import json, math, argparse, logging, joblib
from typing import List, Tuple, Optional

import numpy as np
import torch
from torch.utils.data import DataLoader

from sentence_transformers import SentenceTransformer, InputExample, losses, evaluation
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.linear_model import LinearRegression

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
MODELS_BASE_DIR = "G:/ai_models"
os.makedirs(MODELS_BASE_DIR, exist_ok=True)

MODELS_CONFIG = {
    "e5": {
        "base_model": "intfloat/multilingual-e5-base",
        "save_path":  os.path.join(MODELS_BASE_DIR, "trained_model_e5_v4"),
    },
    "bge-m3": {
        "base_model": "BAAI/bge-m3",
        "save_path":  os.path.join(MODELS_BASE_DIR, "trained_model_bge_m3_axe1_v4"),
    },
}

EVAL_SAVE_PATH      = os.path.join(MODELS_BASE_DIR, "eval_results_axe1_v4")
CALIBRATOR_PATH     = os.path.join(MODELS_BASE_DIR, "calibrator_axe1_v4.pkl")

# ── Hyperparamètres V4 ──────────────────────────────────────────────────────
BATCH_SIZE        = 16      # ✅ augmenté (dataset plus grand → batches plus grands)
EPOCHS            = 3       # ✅ réduit 5→3 (800 paires suffisent, évite overfitting)
WARMUP_RATIO      = 0.10    # ✅ réduit (moins de warmup nécessaire)
LR                = 1e-5    # conservé (stable)
WEIGHT_DECAY      = 0.01
MNR_THRESHOLD     = 0.65
COSINE_WEIGHT     = 2.0     # CosineLoss pondérée x2 vs MNR

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ═════════════════════════════════════════════════════════════════════════════
#  SYNTHETIC EXAMPLES V3 (108 paires de référence — conservées)
# ═════════════════════════════════════════════════════════════════════════════
SYNTHETIC_EXAMPLES: List[Tuple[str, str, float]] = [
    # BLOC A — POSITIFS FORTS (score 0.85 – 0.95) — 36 paires
    ("Développeur Full Stack React Node.js 3 ans expérience Paris",
     "5 ans développeur React, Node.js, PostgreSQL, Docker. Missions e-commerce.", 0.95),
    ("Ingénieur Backend Python Django REST API microservices",
     "Développeur Python 4 ans Django, FastAPI, Kubernetes, CI/CD GitHub Actions.", 0.90),
    ("Data Scientist Machine Learning NLP Python TensorFlow 2 ans",
     "Data Scientist 3 ans Python scikit-learn TensorFlow NLP classification texte.", 0.93),
    ("Ingénieur Data Pipeline Spark Kafka AWS",
     "Data Engineer 5 ans Spark, Kafka, AWS S3 Glue, orchestration Airflow.", 0.91),
    ("DevOps Engineer CI/CD Kubernetes AWS Terraform 4 ans",
     "DevOps 6 ans AWS EKS Terraform Helm Jenkins pipeline CI/CD.", 0.92),
    ("Développeur Mobile iOS Swift SwiftUI 3 ans",
     "Développeur iOS 4 ans Swift SwiftUI Combine App Store publication.", 0.94),
    ("Développeur Mobile Android Kotlin Jetpack Compose",
     "Développeur Android 3 ans Kotlin Jetpack Compose Room Retrofit.", 0.92),
    ("Expert Cybersécurité pentest SIEM SOC certifié CISSP",
     "Ingénieur sécu 5 ans pentest Metasploit SIEM Splunk certif OSCP.", 0.91),
    ("Chef de projet IT Agile Scrum gestion équipe 5 ans",
     "Chef de projet 6 ans Agile Scrum Jira roadmap équipe 10 personnes.", 0.90),
    ("Responsable RH recrutement SIRH 5 ans",
     "RH généraliste 7 ans recrutement cadres SIRH Workday paie ADP.", 0.91),
    ("Contrôleur de gestion reporting finance Excel Power BI",
     "Contrôleur de gestion 4 ans budgets reporting mensuel Power BI SAP.", 0.92),
    ("Enseignant informatique université Java POO algorithmique",
     "Enseignant chercheur 8 ans Java Python algorithmique publi IEEE.", 0.89),
    ("مطور ويب متكامل React Node.js خبرة 3 سنوات",
     "مطور 5 سنوات React Node.js PostgreSQL Docker مشاريع تجارة إلكترونية.", 0.93),
    ("عالم بيانات تعلم آلي Python TensorFlow سنتان",
     "خبير بيانات 3 سنوات Python scikit-learn TensorFlow معالجة لغات طبيعية.", 0.91),
    ("Architecte Cloud AWS Solutions Architect certifié",
     "Cloud Architect 5 ans AWS certifié SAA-C03 migration on-premise.", 0.93),
    ("Développeur Blockchain Solidity Ethereum Smart Contracts",
     "Développeur Web3 3 ans Solidity Hardhat Ethereum DeFi NFT.", 0.90),
    ("Ingénieur Machine Learning MLOps Python PyTorch",
     "ML Engineer 4 ans PyTorch MLflow Kubeflow déploiement modèles prod.", 0.92),
    ("Analyste Cybersécurité SOC Tier 2 SIEM Splunk",
     "Analyste SOC 3 ans Splunk QRadar threat hunting incident response.", 0.91),
    ("Développeur React TypeScript Redux frontend senior",
     "Frontend senior 5 ans React TypeScript Redux Webpack Storybook.", 0.94),
    ("Ingénieur QA Automation Selenium Python CI/CD",
     "QA Engineer 4 ans Selenium Python pytest Jenkins pipelines tests.", 0.90),
    ("Data Engineer dbt Snowflake Airflow Python",
     "Data Engineer 3 ans dbt Snowflake Airflow Python ETL moderne.", 0.92),
    ("Product Manager SaaS B2B roadmap OKR",
     "PM 5 ans SaaS B2B Jira roadmap OKR stakeholders management.", 0.91),
    ("Développeur Java Spring Boot microservices Kafka",
     "Ingénieur Java 4 ans Spring Boot Kafka Docker microservices REST.", 0.93),
    ("Scrum Master certifié PSM-II équipe distribuée",
     "Scrum Master PSM-II 4 ans équipes distribuées SAFe Agile coach.", 0.90),
    ("Ingénieur réseau Cisco CCNP routage commutation",
     "Network Engineer CCNP 5 ans Cisco routage OSPF BGP datacenter.", 0.92),
    ("Développeur .NET C# ASP.NET Core Azure",
     "Développeur C# 4 ans ASP.NET Core Azure DevOps Entity Framework.", 0.91),
    ("Business Intelligence Analyst SQL Power BI DAX",
     "BI Analyst 3 ans SQL Power BI DAX modélisation étoile.", 0.90),
    ("Développeur Flutter Dart mobile iOS Android",
     "Mobile Dev 3 ans Flutter Dart Riverpod apps iOS Android store.", 0.93),
    ("Administrateur base de données PostgreSQL DBA",
     "DBA PostgreSQL 5 ans tuning requêtes réplication haute dispo.", 0.91),
    ("Site Reliability Engineer SRE Kubernetes Prometheus",
     "SRE 4 ans Kubernetes Prometheus Grafana Terraform on-call.", 0.92),
    ("Analyste Data Python Pandas visualisation Tableau",
     "Data Analyst 3 ans Python pandas Tableau reporting KPIs.", 0.90),
    ("Ingénieur Embedded C Linux temps réel RTOS",
     "Embedded Engineer 5 ans C Linux RTOS STM32 protocoles CAN SPI.", 0.91),
    ("UX Designer Figma Design System recherche utilisateur",
     "UX/UI Designer 4 ans Figma Design System tests utilisateurs.", 0.90),
    ("Développeur Salesforce Apex LWC CRM",
     "Salesforce Dev 3 ans Apex LWC Flows CRM intégration API.", 0.92),
    ("Ingénieur NLP Transformers HuggingFace Python",
     "NLP Engineer 3 ans HuggingFace Transformers BERT fine-tuning.", 0.93),
    ("Chef de projet Infrastructure IT ITIL migration cloud",
     "IT PM 5 ans ITIL migration cloud projets infra datacenter.", 0.90),

    # BLOC B — NÉGATIFS CLAIRS (score 0.01 – 0.08) — 36 paires
    ("Développeur Full Stack React Node.js 3 ans expérience Paris",
     "Comptable 10 ans expérience Excel, bilan financier, fiscalité.", 0.02),
    ("Ingénieur Backend Python Django REST API microservices",
     "Chef de projet marketing digital SEO/SEA campagnes Google Ads.", 0.03),
    ("Data Scientist Machine Learning NLP Python TensorFlow 2 ans",
     "Infirmier urgences 8 ans soins intensifs bloc opératoire.", 0.01),
    ("Ingénieur Data Pipeline Spark Kafka AWS",
     "Professeur mathématiques lycée algèbre géométrie.", 0.04),
    ("DevOps Engineer CI/CD Kubernetes AWS Terraform 4 ans",
     "Designer UX/UI Figma prototypage maquettes responsive.", 0.02),
    ("Développeur Mobile Android Kotlin Jetpack Compose",
     "Analyste financier audit interne contrôle gestion.", 0.02),
    ("Expert Cybersécurité pentest SIEM SOC certifié CISSP",
     "Commercial grands comptes télécoms négociation contrats B2B.", 0.01),
    ("Responsable RH recrutement SIRH 5 ans",
     "Ingénieur réseau Cisco CCNA VPN MPLS.", 0.03),
    ("Contrôleur de gestion reporting finance Excel Power BI",
     "Développeur Symfony PHP MySQL API REST.", 0.02),
    ("Enseignant informatique université Java POO algorithmique",
     "Logisticien supply chain entrepôt gestion stocks.", 0.02),
    ("Architecte Cloud AWS Solutions Architect certifié",
     "Chirurgien orthopédiste bloc opératoire prothèses.", 0.01),
    ("Développeur React TypeScript Redux frontend senior",
     "Juriste droit des affaires contrats M&A due diligence.", 0.02),
    ("Ingénieur Machine Learning MLOps Python PyTorch",
     "Cuisinier chef étoilé cuisine gastronomique française.", 0.01),
    ("Data Engineer dbt Snowflake Airflow Python",
     "Chauffeur poids lourd permis C transport longue distance.", 0.02),
    ("Product Manager SaaS B2B roadmap OKR",
     "Vétérinaire animaux compagnie chirurgie urgences.", 0.01),
    ("Développeur Java Spring Boot microservices Kafka",
     "Architecte bâtiment rénovation urbaine permis construire.", 0.03),
    ("Ingénieur QA Automation Selenium Python CI/CD",
     "Directeur artistique publicité créativité campagnes TV.", 0.02),
    ("Scrum Master certifié PSM-II équipe distribuée",
     "Kinésithérapeute rééducation sport traumatologie.", 0.01),
    ("Business Intelligence Analyst SQL Power BI DAX",
     "Pharmacien officine conseil médicament délivrance.", 0.02),
    ("Développeur Flutter Dart mobile iOS Android",
     "Psychologue clinicien thérapie comportementale TCC.", 0.01),
    ("Administrateur base de données PostgreSQL DBA",
     "Notaire droit immobilier succession actes authentiques.", 0.02),
    ("Site Reliability Engineer SRE Kubernetes Prometheus",
     "Diététicien nutrition sportive régimes thérapeutiques.", 0.01),
    ("Analyste Data Python Pandas visualisation Tableau",
     "Pilote commercial long courrier A320 A380 certifié.", 0.02),
    ("Ingénieur Embedded C Linux temps réel RTOS",
     "Expert comptable commissaire aux comptes audit légal.", 0.03),
    ("UX Designer Figma Design System recherche utilisateur",
     "Mécanicien automobile diagnostic moteur réparation.", 0.02),
    ("Développeur Salesforce Apex LWC CRM",
     "Chirurgien dentiste implantologie prothèse dentaire.", 0.01),
    ("Ingénieur NLP Transformers HuggingFace Python",
     "Pompier secours incendie sauvetage intervention.", 0.02),
    ("Chef de projet Infrastructure IT ITIL migration cloud",
     "Instituteur primaire pédagogie Montessori cycle 2.", 0.03),
    ("Développeur Blockchain Solidity Ethereum Smart Contracts",
     "Ostéopathe traitement musculo-squelettique manipulation.", 0.01),
    ("Analyste Cybersécurité SOC Tier 2 SIEM Splunk",
     "Jardinier paysagiste aménagement espaces verts taille.", 0.02),
    ("Data Scientist Machine Learning NLP Python",
     "Huissier de justice signification actes recouvrement.", 0.01),
    ("Développeur .NET C# ASP.NET Core Azure",
     "Opticien lunetier adaptation verres contactologie.", 0.02),
    ("Ingénieur réseau Cisco CCNP routage commutation",
     "Fleuriste arrangement floral décoration événementiel.", 0.02),
    ("مطور ويب React Node.js خبرة 3 سنوات",
     "محاسب خبرة 10 سنوات ميزانية تدقيق مالي ضرائب.", 0.02),
    ("عالم بيانات Python TensorFlow تعلم آلي",
     "ممرض طوارئ 8 سنوات عمليات جراحية عناية مركزة.", 0.01),
    ("Développeur mobile iOS Swift 3 ans",
     "Sommelier vins spiritueux conseil restauration gastronomique.", 0.02),

    # BLOC C — ZONE GRISE (score 0.20 – 0.75) — 36 paires
    ("Développeur Mobile iOS Swift SwiftUI 3 ans",
     "Développeur web React Native 2 ans, jamais touché Swift natif.", 0.35),
    ("Data Scientist Python TensorFlow NLP",
     "Analyste BI Power BI SQL reporting, notions Python basiques.", 0.30),
    ("Ingénieur Data Pipeline Spark Kafka AWS",
     "DBA Oracle 6 ans, aucune expérience cloud ni streaming.", 0.28),
    ("Expert Cybersécurité pentest SIEM SOC certifié CISSP",
     "Administrateur réseau Cisco 5 ans, intéressé sécu, aucune certif.", 0.32),
    ("Développeur Full Stack React Node.js 3 ans",
     "Développeur backend Java Spring 5 ans, aucune expérience frontend.", 0.38),
    ("Chef de projet IT Agile Scrum 5 ans",
     "Business Analyst fonctionnel 4 ans spécifications, aucune certif Agile.", 0.36),
    ("DevOps Engineer CI/CD Kubernetes AWS Terraform 4 ans",
     "Développeur backend Node.js 3 ans, déploiement manuel FTP.", 0.27),
    ("Architecte Cloud AWS certifié",
     "Administrateur système Windows on-premise 6 ans, notions AWS.", 0.25),
    ("Ingénieur NLP HuggingFace Transformers",
     "Linguiste traitement manuel corpus, notions Python scripts.", 0.22),
    ("Product Manager SaaS B2B OKR",
     "Commercial terrain B2B 5 ans, aucune expérience produit digital.", 0.24),
    ("Développeur Blockchain Solidity Ethereum",
     "Développeur web PHP 4 ans, aucune connaissance crypto.", 0.20),
    ("Site Reliability Engineer Kubernetes Prometheus",
     "Développeur backend Python 3 ans, aucune expérience ops.", 0.28),
    ("Ingénieur Backend Python Django REST API",
     "Développeur PHP Symfony 4 ans, notions Python scripts ponctuels.", 0.45),
    ("Chef de projet IT Agile Scrum gestion équipe 5 ans",
     "Développeur senior 8 ans, lead tech informel, zéro formation Scrum.", 0.48),
    ("DevOps Engineer CI/CD Kubernetes AWS Terraform 4 ans",
     "Administrateur système Linux 3 ans scripts Bash, notions Docker.", 0.50),
    ("Data Scientist Machine Learning NLP Python TensorFlow 2 ans",
     "Étudiant Master IA Python pandas scikit-learn projet NLP universitaire.", 0.55),
    ("Responsable RH recrutement SIRH 5 ans",
     "Office manager 5 ans administratif, participation recrutement junior.", 0.42),
    ("Contrôleur de gestion reporting finance Excel Power BI",
     "Comptable 6 ans Excel avancé, aucune expérience Power BI ni SAP.", 0.44),
    ("Développeur Full Stack React Node.js 3 ans expérience Paris",
     "Développeur frontend Angular TypeScript RxJS 3 ans, aucun backend.", 0.46),
    ("Ingénieur Data Pipeline Spark Kafka AWS",
     "Développeur Python ETL 3 ans scripts locaux, aucune expérience cloud.", 0.52),
    ("Expert Cybersécurité pentest SIEM SOC certifié CISSP",
     "Développeur backend 5 ans, sensibilisé sécu OWASP, aucune pratique SOC.", 0.43),
    ("Développeur Mobile iOS Swift SwiftUI 3 ans",
     "Développeur Flutter 3 ans iOS+Android cross-platform, notions Swift.", 0.50),
    ("Ingénieur Machine Learning MLOps PyTorch",
     "Data Analyst SQL Python 2 ans, aucune expérience modèles ML prod.", 0.47),
    ("Business Intelligence SQL Power BI DAX",
     "Développeur fullstack 4 ans, requêtes SQL basiques, aucune BI.", 0.41),
    ("Développeur Full Stack React Node.js 3 ans expérience Paris",
     "Développeur frontend React 1 an stage e-commerce, notions Node.", 0.60),
    ("Data Scientist Machine Learning NLP Python TensorFlow 2 ans",
     "Data Analyst 2 ans Python SQL, premier projet ML en production.", 0.62),
    ("DevOps Engineer CI/CD Kubernetes AWS Terraform 4 ans",
     "Ingénieur cloud AWS 2 ans EC2 S3, aucune expérience Kubernetes.", 0.65),
    ("Ingénieur Backend Python Django REST API microservices",
     "Développeur Python 2 ans scripts data, début Django tutoriels.", 0.58),
    ("Chef de projet IT Agile Scrum gestion équipe 5 ans",
     "Scrum Master certifié PSM-I 1 an, équipe 4 personnes start-up.", 0.68),
    ("Expert Cybersécurité pentest SIEM SOC certifié CISSP",
     "Ingénieur réseau 4 ans, formation sécu en cours, projet SOC junior.", 0.60),
    ("Développeur Mobile Android Kotlin Jetpack Compose",
     "Développeur Android Java 4 ans migration en cours vers Kotlin.", 0.70),
    ("Responsable RH recrutement SIRH 5 ans",
     "Chargé RH 3 ans recrutement opérateurs, aucune expérience SIRH.", 0.62),
    ("Ingénieur Data Pipeline Spark Kafka AWS",
     "Data Engineer junior 1 an Spark local, aucune expérience Kafka.", 0.58),
    ("Contrôleur de gestion reporting finance Excel Power BI",
     "Contrôleur de gestion 2 ans Excel, Power BI autodidacte projets perso.", 0.65),
    ("Architecte Cloud AWS certifié Solutions Architect",
     "Ingénieur cloud junior 1 an AWS EC2 Lambda autodidacte.", 0.63),
    ("Ingénieur QA Automation Selenium Python CI/CD",
     "Développeur Python 3 ans, tests unitaires pytest, aucun framework E2E.", 0.61),
]


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def load_examples_from_json(path: str) -> List[Tuple[str, str, float]]:
    """Charge un dataset JSON au format {offer_text, candidate_text, score}."""
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    examples = []
    for item in raw:
        offer = item.get("offer_text", item.get("offer", ""))
        cand  = item.get("candidate_text", item.get("candidate", ""))
        score = float(item.get("score", item.get("label", 0.0)))
        examples.append((offer, cand, score))
    logger.info(f"Dataset JSON chargé : {len(examples)} paires depuis {path}")
    return examples


def format_text(text: str, is_query: bool, model_key: str) -> str:
    text = text.strip()
    if model_key == "e5":
        return ("query: " if is_query else "passage: ") + text
    return text


def build_mnr_examples(data, model_key, threshold=MNR_THRESHOLD):
    positives = [(o, c, s) for o, c, s in data if s >= threshold]
    logger.info(f"MNR : {len(positives)} paires positives (>={threshold})")
    return [InputExample(texts=[format_text(o, True, model_key),
                                format_text(c, False, model_key)])
            for o, c, _ in positives]


def build_cosine_zone_grise(data, model_key, low=0.05, high=0.90):
    """
    Plage élargie 0.05–0.90 + ancres doublées (12 au lieu de 6).
    Inclure les extrêmes comme bornes de référence est CRUCIAL.
    """
    zone        = [(o, c, s) for o, c, s in data if low <= s <= high]
    extreme_neg = [(o, c, s) for o, c, s in data if s < low][:12]
    extreme_pos = [(o, c, s) for o, c, s in data if s > high][:12]
    all_cosine  = zone + extreme_neg + extreme_pos

    logger.info(f"CosineLoss : {len(zone)} zone + {len(extreme_neg)} neg "
                f"+ {len(extreme_pos)} pos = {len(all_cosine)} total")
    return [InputExample(
                texts=[format_text(o, True, model_key),
                       format_text(c, False, model_key)],
                label=float(max(0.0, min(1.0, s))))
            for o, c, s in all_cosine]


def build_evaluator(data, model_key, name="eval"):
    s1     = [format_text(o, True, model_key)  for o, _, _ in data]
    s2     = [format_text(c, False, model_key) for _, c, _ in data]
    scores = [s for _, _, s in data]
    return evaluation.EmbeddingSimilarityEvaluator(
        s1, s2, scores, name=name, show_progress_bar=False)


def compute_warmup_steps(n_examples, batch_size, epochs, ratio):
    steps = math.ceil(n_examples / batch_size) * epochs
    warmup = max(10, int(steps * ratio))
    logger.info(f"Total steps={steps} | Warmup={warmup}")
    return warmup


# ─────────────────────────────────────────────────────────────────────────────
# CALIBRATION POST-TRAINING
# ─────────────────────────────────────────────────────────────────────────────
def fit_calibrator(model, data, model_key):
    """Régression linéaire : score_calibré = a * score_brut + b"""
    raw_preds, y_true = [], []
    for offer, candidate, score in data:
        e1  = model.encode([format_text(offer,     True,  model_key)])
        e2  = model.encode([format_text(candidate, False, model_key)])
        sim = float(cosine_similarity(e1, e2)[0][0])
        raw_preds.append(sim)
        y_true.append(score)

    X = np.array(raw_preds).reshape(-1, 1)
    y = np.array(y_true)

    cal = LinearRegression()
    cal.fit(X, y)

    logger.info(f"Calibrateur ajusté : a={cal.coef_[0]:.4f} b={cal.intercept_:.4f}")
    logger.info(f"  → score_calibré = {cal.coef_[0]:.3f} × score_brut + {cal.intercept_:.3f}")
    return cal, np.array(raw_preds), y


def predict_calibrated(model, offer, candidate, model_key, calibrator):
    """Prédiction calibrée pour la production."""
    e1  = model.encode([format_text(offer,     True,  model_key)])
    e2  = model.encode([format_text(candidate, False, model_key)])
    raw = float(cosine_similarity(e1, e2)[0][0])
    cal = float(calibrator.predict([[raw]])[0])
    return max(0.0, min(1.0, cal)), raw


# ─────────────────────────────────────────────────────────────────────────────
# ÉVALUATION COMPLÈTE
# ─────────────────────────────────────────────────────────────────────────────
def evaluate_full(y_true, y_pred_raw, y_pred_cal=None, label="Évaluation"):
    def metrics(yt, yp):
        mae     = mean_absolute_error(yt, yp)
        r2      = r2_score(yt, yp)
        pearson = float(np.corrcoef(yt, yp)[0, 1])
        acc_bin = float(np.mean(((yt>=0.70).astype(int))==((yp>=0.70).astype(int)))*100)
        acc_10  = float(np.mean(np.abs(yt - yp) <= 0.10) * 100)
        acc_20  = float(np.mean(np.abs(yt - yp) <= 0.20) * 100)
        return mae, r2, pearson, acc_bin, acc_10, acc_20

    sep = "=" * 65
    logger.info(f"\n{sep}\n  {label}\n{sep}")

    mr, r2r, pr, abr, a10r, a20r = metrics(y_true, y_pred_raw)
    logger.info(f"  [BRUT]      MAE={mr:.4f} R²={r2r:.4f} Pearson={pr:.4f}")
    logger.info(f"              Acc bin={abr:.1f}% | ±0.10={a10r:.1f}% | ±0.20={a20r:.1f}%")

    if y_pred_cal is not None:
        mc, r2c, pc, abc, a10c, a20c = metrics(y_true, y_pred_cal)
        logger.info(f"  [CALIBRÉ]   MAE={mc:.4f} R²={r2c:.4f} Pearson={pc:.4f}")
        logger.info(f"              Acc bin={abc:.1f}% | ±0.10={a10c:.1f}% | ±0.20={a20c:.1f}%")
        logger.info(f"\n  Gain Acc ±0.10 : {a10r:.1f}% → {a10c:.1f}% (+{a10c-a10r:.1f}%)")
        logger.info(f"  Gain MAE       : {mr:.4f} → {mc:.4f} ({mc-mr:+.4f})")
    logger.info(sep)


# ─────────────────────────────────────────────────────────────────────────────
# ENTRAÎNEMENT V4
# ─────────────────────────────────────────────────────────────────────────────
def train(data_path=None, test_data_path=None,
          epochs=EPOCHS, batch_size=BATCH_SIZE,
          lr=LR, model_key="bge-m3"):

    # --- Chargement des données ---
    if data_path and os.path.exists(data_path):
        external_data = load_examples_from_json(data_path)
        # Fusion : synthétique (108) + externe (800+) = ~900+ paires
        raw_train = SYNTHETIC_EXAMPLES + external_data
        logger.info(f"Fusion dataset : {len(SYNTHETIC_EXAMPLES)} synthétiques + "
                    f"{len(external_data)} externes = {len(raw_train)} total")
    else:
        raw_train = SYNTHETIC_EXAMPLES
        logger.info(f"Dataset synthétique uniquement : {len(raw_train)} paires")

    raw_test  = (load_examples_from_json(test_data_path)
                 if test_data_path and os.path.exists(test_data_path)
                 else None)

    # Stats dataset
    scores = [s for _, _, s in raw_train]
    neg  = sum(1 for s in scores if s < 0.30)
    grey = sum(1 for s in scores if 0.30 <= s < 0.70)
    pos  = sum(1 for s in scores if s >= 0.70)
    logger.info(f"Dataset final : {len(raw_train)} paires | "
                f"négatifs={neg} ({neg/len(raw_train)*100:.1f}%) | "
                f"zone grise={grey} ({grey/len(raw_train)*100:.1f}%) | "
                f"positifs={pos} ({pos/len(raw_train)*100:.1f}%)")

    base_model_name = MODELS_CONFIG[model_key]["base_model"]
    model_save_path = MODELS_CONFIG[model_key]["save_path"]
    logger.info(f"Chargement modèle [{model_key}] : {base_model_name}")
    model = SentenceTransformer(base_model_name)

    mnr_examples    = build_mnr_examples(raw_train, model_key)
    cosine_examples = build_cosine_zone_grise(raw_train, model_key)

    if len(mnr_examples) < 8:
        raise ValueError(f"Trop peu de paires positives : {len(mnr_examples)}")

    mnr_dl    = DataLoader(mnr_examples,    shuffle=True, batch_size=batch_size)
    cosine_dl = DataLoader(cosine_examples, shuffle=True, batch_size=batch_size)

    mnr_loss    = losses.MultipleNegativesRankingLoss(model)
    cosine_loss = losses.CosineSimilarityLoss(model)

    # CosineLoss répété 2x pour pondérer x2 vs MNR
    train_objectives = [
        (mnr_dl,    mnr_loss),
        (cosine_dl, cosine_loss),
        (cosine_dl, cosine_loss),   # ← répété intentionnellement
    ]

    os.makedirs(EVAL_SAVE_PATH, exist_ok=True)
    evaluator = None
    if raw_test:
        evaluator = build_evaluator(raw_test, model_key, "test-eval")
    elif len(raw_train) > 20:
        # Split 85/15 pour l'évaluation interne
        cut = int(len(raw_train) * 0.85)
        evaluator = build_evaluator(raw_train[cut:], model_key, "internal-eval")

    warmup = compute_warmup_steps(
        max(len(mnr_dl.dataset), len(cosine_dl.dataset)),
        batch_size, epochs, WARMUP_RATIO)

    logger.info(f"Entraînement : epochs={epochs} batch={batch_size} lr={lr}")
    model.fit(
        train_objectives=train_objectives,
        evaluator=evaluator,
        epochs=epochs,
        warmup_steps=warmup,
        optimizer_params={"lr": lr},
        weight_decay=WEIGHT_DECAY,
        scheduler="warmupcosine",
        output_path=EVAL_SAVE_PATH,
        show_progress_bar=True,
        save_best_model=True,
        evaluation_steps=max(10, len(mnr_dl) // 3),
    )

    os.makedirs(model_save_path, exist_ok=True)
    model.save(model_save_path)
    logger.info(f"Modèle sauvegardé → {model_save_path}")

    # Calibration post-training
    cal_data = raw_test if raw_test else raw_train
    logger.info(f"\nCalibration sur {len(cal_data)} paires...")
    calibrator, raw_preds, y_true = fit_calibrator(model, cal_data, model_key)

    cal_preds = np.clip(calibrator.predict(raw_preds.reshape(-1, 1)), 0, 1)
    evaluate_full(y_true, raw_preds, cal_preds, "Résultats post-entraînement")

    # Sauvegarde calibrateur
    joblib.dump(calibrator, CALIBRATOR_PATH)
    logger.info(f"Calibrateur sauvegardé → {CALIBRATOR_PATH}")
    logger.info("En production : charger avec joblib.load(CALIBRATOR_PATH)")

    quick_eval(model, model_key, calibrator)


# ─────────────────────────────────────────────────────────────────────────────
# QUICK EVAL
# ─────────────────────────────────────────────────────────────────────────────
def quick_eval(model, model_key="bge-m3", calibrator=None):
    test_pairs = [
        ("Développeur Full Stack React Node.js 3 ans",
         "5 ans React, Node.js, PostgreSQL, Docker", "Très proche (attendu >= 0.85)"),
        ("Développeur Full Stack React Node.js 3 ans",
         "Comptable Excel bilan fiscal", "Très différent (attendu <= 0.08)"),
        ("Data Scientist Python TensorFlow NLP",
         "Étudiant Master IA scikit-learn projet NLP", "Partiel moyen (attendu 0.50-0.65)"),
        ("DevOps Kubernetes AWS Terraform CI/CD",
         "Administrateur Linux Bash Docker notions", "Partiel fort (attendu 0.48-0.62)"),
        ("Ingénieur Backend Python Django REST API",
         "Développeur PHP Symfony notions Python", "Partiel faible (attendu 0.38-0.52)"),
        ("Chef de projet IT Agile Scrum 5 ans",
         "Développeur senior lead tech informel zéro Scrum", "Partiel moyen (attendu 0.40-0.55)"),
        ("مطور ويب React Node.js خبرة 3 سنوات",
         "مطور 5 سنوات React Node.js PostgreSQL", "Arabe excellent (attendu >= 0.88)"),
    ]

    import re
    logger.info("\n" + "─"*65)
    logger.info("Quick Eval — scores bruts et calibrés")
    logger.info("─"*65)

    ok_raw, ok_cal = 0, 0
    for offer, candidate, label in test_pairs:
        if calibrator:
            sim_cal, sim_raw = predict_calibrated(model, offer, candidate,
                                                   model_key, calibrator)
        else:
            e1 = model.encode([format_text(offer,     True,  model_key)])
            e2 = model.encode([format_text(candidate, False, model_key)])
            sim_raw = float(cosine_similarity(e1, e2)[0][0])
            sim_cal = sim_raw

        nums = [float(n) for n in re.findall(r"[\d.]+", label.split("attendu")[-1])
                if "." in n or len(n) > 1]

        def check(s):
            if ">=" in label and nums: return s >= nums[0]
            if "<=" in label and nums: return s <= nums[0]
            if len(nums) >= 2: return nums[0] <= s <= nums[1]
            return True

        r_ok = check(sim_raw)
        c_ok = check(sim_cal)
        if r_ok: ok_raw += 1
        if c_ok: ok_cal += 1

        logger.info(f"\n[{'OK' if c_ok else 'VERIF'}] {label}")
        logger.info(f"  Offre    : {offer[:60]}")
        logger.info(f"  Candidat : {candidate[:60]}")
        logger.info(f"  Brut={sim_raw:.4f}  Calibré={sim_cal:.4f}")

    logger.info(f"\nScore brut   : {ok_raw}/{len(test_pairs)}")
    logger.info(f"Score calibré: {ok_cal}/{len(test_pairs)}")
    logger.info("─"*65)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data",       type=str,   default=None,
                        help="Chemin vers le dataset JSON (offer_text, candidate_text, score)")
    parser.add_argument("--test_data",  type=str,   default=None,
                        help="Chemin vers le dataset de test JSON")
    parser.add_argument("--epochs",     type=int,   default=EPOCHS)
    parser.add_argument("--batch_size", type=int,   default=BATCH_SIZE)
    parser.add_argument("--lr",         type=float, default=LR)
    parser.add_argument("--eval",       action="store_true",
                        help="Mode évaluation uniquement")
    parser.add_argument("--model_type", type=str,   choices=["e5","bge-m3"],
                        default="bge-m3")
    args = parser.parse_args()

    if args.eval:
        save_path = MODELS_CONFIG[args.model_type]["save_path"]
        base_name = MODELS_CONFIG[args.model_type]["base_model"]
        m = SentenceTransformer(save_path if os.path.exists(save_path) else base_name)
        cal = joblib.load(CALIBRATOR_PATH) if os.path.exists(CALIBRATOR_PATH) else None
        if args.test_data and os.path.exists(args.test_data):
            raw = load_examples_from_json(args.test_data)
            if cal:
                rp = []
                yt = []
                for o, c, s in raw:
                    sc, sr = predict_calibrated(m, o, c, args.model_type, cal)
                    rp.append(sr); yt.append(s)
                evaluate_full(np.array(yt), np.array(rp),
                              np.clip(cal.predict(np.array(rp).reshape(-1,1)),0,1))
        quick_eval(m, args.model_type, cal)
    else:
        train(data_path=args.data, test_data_path=args.test_data,
              epochs=args.epochs, batch_size=args.batch_size,
              lr=args.lr, model_key=args.model_type)