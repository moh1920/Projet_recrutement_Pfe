"""
=============================================================================
  train_model_v3_fixed.py — Version 3 finale (tous bugs corrigés)
=============================================================================
CORRECTIONS :

  BUG 1 — Double évaluation par epoch (callback appelé 2x)
    model.fit() avec evaluator= déclenche à la fois evaluation_steps ET
    on_epoch_end → 2 appels du callback par epoch → patience épuisée en 2 epochs.
    FIX : on utilise SentenceTransformerTrainer directement avec eval_strategy="no"
    Le callback EarlyStoppingEvaluatorCallback est le seul déclencheur via on_epoch_end.

  BUG 2 — eval_steps = steps_per_epoch (1 éval par epoch exactement)
    FIX : évaluation uniquement dans on_epoch_end → toujours 1x par epoch.

  BUG 3 — Rapport JSON : best_epoch et best_spearman corrects
    FIX : rapport lit early_stop_cb.best_epoch et early_stop_cb.best_spearman.

  BUG 4 — EVAL_SAVE_PATH timestampé pour éviter pollution cross-run
    FIX : EVAL_SAVE_PATH = eval_results_v3/{run_ts}.

  BUG 5 — WARMUP_RATIO abaissé à 0.05 pour petits datasets
    FIX : WARMUP_RATIO = 0.05.

  BUG 6 — Mauvais tokenizer rechargé (Mistral dans le checkpoint)
    FIX : is_valid_checkpoint() vérifie config.json avant rechargement.

Usage:
  python train_model_v3_fixed.py --data train_data_v3.json
  python train_model_v3_fixed.py --data train_data_v3.json --test_data test.json
  python train_model_v3_fixed.py --eval --model_type bge-m3
  python train_model_v3_fixed.py --data train_data_v3.json --lr_finder
=============================================================================
"""

import os
os.environ["HF_HOME"]               = "F:/HF_Cache"
os.environ["HUGGINGFACE_HUB_CACHE"] = "F:/HF_Cache"

import json
import math
import random
import argparse
import logging
import datetime
from typing import List, Tuple, Optional, Dict

import numpy as np
import torch
from torch.utils.data import DataLoader
from datasets import Dataset
from sklearn.metrics import mean_absolute_error
from scipy.stats import pearsonr, spearmanr
from sentence_transformers import SentenceTransformer, InputExample, losses
from sentence_transformers.trainer import SentenceTransformerTrainer
from sentence_transformers.training_args import (
    SentenceTransformerTrainingArguments,
    BatchSamplers,
)
from transformers import TrainerCallback, TrainerControl, TrainerState, TrainingArguments
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine

# ─────────────────────────────────────────────────────────────────────────────
# REPRODUCTIBILITÉ
# ─────────────────────────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
MODELS_BASE_DIR = "G:/ai_models"
os.makedirs(MODELS_BASE_DIR, exist_ok=True)

MODELS_CONFIG = {
    "e5": {
        "base_model": "intfloat/multilingual-e5-base",
        "save_path":  os.path.join(MODELS_BASE_DIR, "trained_model_e5_v3"),
    },
    "bge-m3": {
        "base_model": "BAAI/bge-m3",
        "save_path":  os.path.join(MODELS_BASE_DIR, "trained_model_bge_m3_v3"),
    },
}

REPORT_SAVE_PATH = os.path.join(MODELS_BASE_DIR, "training_reports")

# ── Hyperparamètres ───────────────────────────────────────────────────────────
EPOCHS          = 10       # early stopping prend le relais
WARMUP_RATIO    = 0.05     # FIX BUG 5
LR              = 2e-5
WEIGHT_DECAY    = 0.01
EARLY_STOP_PAT  = 3
SCORE_THRESHOLD = 0.55
MAX_GRAD_NORM   = 1.0
MATRYOSHKA_DIMS = {
    "bge-m3": [1024, 512, 256, 128, 64],
    "e5":     [768,  512, 256, 128, 64],
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# DONNÉES SYNTHÉTIQUES (fallback)
# ─────────────────────────────────────────────────────────────────────────────
SYNTHETIC_EXAMPLES: List[Tuple[str, str, float]] = [
    ("Développeur Full Stack React Node.js 3 ans",
     "5 ans React Node.js PostgreSQL Docker e-commerce.", 0.95),
    ("Développeur Full Stack React Node.js 3 ans",
     "Comptable 10 ans Excel bilan fiscalité.", 0.02),
    ("Ingénieur Backend Python Django REST API",
     "Développeur Python 4 ans Django FastAPI Kubernetes.", 0.91),
    ("Data Scientist ML NLP Python TensorFlow",
     "Data Scientist 3 ans Python scikit-learn TensorFlow NLP.", 0.93),
    ("DevOps Engineer Kubernetes AWS Terraform CI/CD",
     "DevOps 6 ans AWS EKS Terraform Helm Jenkins.", 0.92),
    ("Chef de projet IT Agile Scrum 5 ans",
     "Chef de projet 6 ans Agile Scrum Jira roadmap.", 0.90),
    ("Développeur Full Stack React Node.js 3 ans",
     "Développeur frontend React 1 an stage notions Node.", 0.60),
    ("Data Scientist ML NLP Python TensorFlow",
     "Étudiant Master IA Python pandas scikit-learn NLP.", 0.55),
    ("DevOps Engineer Kubernetes AWS Terraform CI/CD",
     "Administrateur Linux 3 ans Bash Docker notions.", 0.50),
    ("Chef de projet IT Agile Scrum 5 ans",
     "Développeur senior 8 ans lead tech Kanban notions.", 0.45),
    ("مطور ويب React Node.js خبرة 3 سنوات",
     "مطور 5 سنوات React Node.js PostgreSQL Docker.", 0.93),
]


# ─────────────────────────────────────────────────────────────────────────────
# UTILITAIRES
# ─────────────────────────────────────────────────────────────────────────────
def load_examples_from_json(path: str) -> List[Tuple[str, str, float]]:
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    examples = [
        (item["offer_text"].strip(), item["candidate_text"].strip(), float(item["score"]))
        for item in raw
    ]
    logger.info(f"Chargé {len(examples)} exemples depuis {path}")
    return examples


def deduplicate(data: List[Tuple[str, str, float]]) -> List[Tuple[str, str, float]]:
    seen, out = set(), []
    for offer, cand, score in data:
        key = (offer.lower()[:60], cand.lower()[:60])
        if key not in seen:
            seen.add(key)
            out.append((offer, cand, score))
    removed = len(data) - len(out)
    if removed:
        logger.info(f"Déduplication : {removed} doublons supprimés → {len(out)} paires uniques")
    return out


def augment_data(
    data: List[Tuple[str, str, float]],
    ratio: float = 0.20,
) -> List[Tuple[str, str, float]]:
    augmented = list(data)
    positives = [(o, c, s) for o, c, s in data if s >= 0.75]
    n_aug = max(1, int(len(positives) * ratio))
    chosen = random.sample(positives, min(n_aug, len(positives)))
    for offer, cand, score in chosen:
        augmented.append((cand, offer, score))
    logger.info(f"Augmentation : +{len(chosen)} paires (inversion symétrique)")
    return augmented


def stratified_split(
    data: List[Tuple[str, str, float]],
    test_ratio: float = 0.15,
) -> Tuple[List, List]:
    buckets: Dict[int, list] = {i: [] for i in range(5)}
    for item in data:
        score = item[2]
        bucket = min(4, int(score * 5))
        buckets[bucket].append(item)

    train, test = [], []
    for bucket_items in buckets.values():
        random.shuffle(bucket_items)
        n_test = max(1, int(len(bucket_items) * test_ratio))
        test  += bucket_items[:n_test]
        train += bucket_items[n_test:]

    logger.info(f"Split stratifié → train={len(train)} | test={len(test)}")
    return train, test


def format_text(text: str, is_query: bool, model_key: str) -> str:
    text = text.strip()
    if model_key == "e5":
        return ("query: " if is_query else "passage: ") + text
    return text


def auto_batch_size(n_positives: int) -> int:
    if n_positives >= 128:
        return 64
    elif n_positives >= 64:
        return 32
    else:
        return 16


def is_valid_checkpoint(path: str, model_key: str) -> bool:
    """FIX BUG 6 : vérifie que le checkpoint correspond bien au bon modèle."""
    config_path = os.path.join(path, "config.json")
    if not os.path.exists(config_path):
        return False
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        arch       = cfg.get("architectures", [""])[0].lower()
        model_type = cfg.get("model_type", "").lower()
        if "mistral" in arch or "mistral" in model_type:
            logger.warning(f"Checkpoint {path} contient un modèle Mistral — ignoré !")
            return False
        return True
    except Exception as e:
        logger.warning(f"Impossible de lire config.json dans {path} : {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# CONSTRUCTION DES EXEMPLES
# ─────────────────────────────────────────────────────────────────────────────
def build_mnr_examples(
    data: List[Tuple[str, str, float]],
    model_key: str,
    threshold: float = SCORE_THRESHOLD,
) -> List[InputExample]:
    positives = [(o, c, s) for o, c, s in data if s >= threshold]
    logger.info(f"MNR : {len(positives)} paires positives (score >= {threshold}) / {len(data)} total")
    return [
        InputExample(texts=[
            format_text(o, True,  model_key),
            format_text(c, False, model_key),
        ])
        for o, c, _ in positives
    ]


def build_cosine_examples(
    data: List[Tuple[str, str, float]],
    model_key: str,
    label_smoothing: float = 0.05,
) -> List[InputExample]:
    smoothed = []
    for o, c, s in data:
        s_smooth = float(max(0.0, min(1.0, s * (1 - 2 * label_smoothing) + label_smoothing)))
        smoothed.append(InputExample(
            texts=[format_text(o, True, model_key), format_text(c, False, model_key)],
            label=s_smooth,
        ))
    return smoothed


def input_examples_to_dataset(examples: List[InputExample]) -> Dataset:
    """Convertit une liste d'InputExample en HuggingFace Dataset."""
    texts = [ex.texts for ex in examples]
    n_cols = len(texts[0])
    data_dict = {f"sentence_{i}": [t[i] for t in texts] for i in range(n_cols)}
    labels = [ex.label for ex in examples]
    if any(l != 0 for l in labels):
        data_dict["label"] = labels
    return Dataset.from_dict(data_dict)


# ─────────────────────────────────────────────────────────────────────────────
# MÉTRIQUES ÉTENDUES
# ─────────────────────────────────────────────────────────────────────────────
def compute_extended_metrics(
    model: SentenceTransformer,
    data: List[Tuple[str, str, float]],
    model_key: str,
    threshold: float = 0.65,
) -> Dict[str, float]:
    reels, preds = [], []
    for offer, cand, score in data:
        e1  = model.encode([format_text(offer, True,  model_key)])
        e2  = model.encode([format_text(cand,  False, model_key)])
        sim = float(sk_cosine(e1, e2)[0][0])
        reels.append(score)
        preds.append(sim)

    reels = np.array(reels)
    preds = np.array(preds)

    mae      = mean_absolute_error(reels, preds)
    pearson  = pearsonr(reels, preds)[0]
    spear    = spearmanr(reels, preds)[0]
    y_true_b = (reels >= threshold).astype(int)
    y_pred_b = (preds >= threshold).astype(int)
    acc_bin  = float((y_true_b == y_pred_b).mean() * 100)
    acc_010  = float((np.abs(reels - preds) <= 0.10).mean() * 100)

    return {
        "MAE":         round(float(mae),    4),
        "Pearson":     round(float(pearson),4),
        "Spearman":    round(float(spear),  4),
        "Acc_binaire": round(acc_bin,       2),
        "Acc_pm010":   round(acc_010,       2),
        "threshold":   threshold,
        "n_pairs":     len(data),
    }


# ─────────────────────────────────────────────────────────────────────────────
# LR FINDER
# ─────────────────────────────────────────────────────────────────────────────
def find_best_lr(
    model_key: str,
    data: List[Tuple[str, str, float]],
    candidates: List[float] = [5e-6, 2e-5, 5e-5],
) -> float:
    logger.info("=== LR Finder démarré ===")
    base_model_name = MODELS_CONFIG[model_key]["base_model"]
    _, val_data = stratified_split(data, test_ratio=0.15)
    best_lr, best_spearman = candidates[0], -1.0

    for lr_candidate in candidates:
        logger.info(f"  Test LR={lr_candidate}")
        m        = SentenceTransformer(base_model_name)
        examples = build_mnr_examples(data, model_key, SCORE_THRESHOLD)
        dl       = DataLoader(examples, shuffle=True, batch_size=16)
        loss_fn  = losses.MultipleNegativesRankingLoss(m)

        # evaluation_steps=0 → eval_strategy="no" → pas besoin d'evaluator
        m.fit(
            train_objectives  = [(dl, loss_fn)],
            epochs            = 1,
            warmup_steps      = max(5, len(dl) // 10),
            optimizer_params  = {"lr": lr_candidate},
            show_progress_bar = False,
            evaluation_steps  = 0,
        )
        metrics = compute_extended_metrics(m, val_data, model_key)
        spear   = metrics["Spearman"]
        logger.info(f"    Spearman={spear:.4f}")
        if spear > best_spearman:
            best_spearman = spear
            best_lr       = lr_candidate
        del m

    logger.info(f"=== Meilleur LR : {best_lr} (Spearman={best_spearman:.4f}) ===")
    return best_lr


# ─────────────────────────────────────────────────────────────────────────────
# CALLBACK EARLY STOPPING
# ─────────────────────────────────────────────────────────────────────────────
class EarlyStoppingEvaluatorCallback(TrainerCallback):
    """
    FIX BUG 1 : Callback unique qui évalue et pilote l'early stopping.

    Appelé uniquement via on_epoch_end → exactement 1 évaluation par epoch.
    Le Trainer est configuré avec eval_strategy="no" pour ne pas déclencher
    de 2ème évaluation automatique via evaluation_steps.
    """

    def __init__(
        self,
        model: SentenceTransformer,
        raw_val: List[Tuple[str, str, float]],
        model_key: str,
        eval_save_path: str,
        patience: int = EARLY_STOP_PAT,
    ):
        self.model          = model
        self.raw_val        = raw_val
        self.model_key      = model_key
        self.eval_save_path = eval_save_path
        self.patience       = patience

        self.history        = []
        self.best_pearson   = -1.0
        self.best_spearman  = -float("inf")
        self.no_improve     = 0
        self.best_epoch     = 0

    def on_epoch_end(
        self,
        args: TrainingArguments,
        state: TrainerState,
        control: TrainerControl,
        **kwargs,
    ) -> None:
        epoch   = state.epoch or 0
        metrics = compute_extended_metrics(self.model, self.raw_val, self.model_key)
        metrics["epoch"] = epoch
        self.history.append(metrics)

        if metrics["Pearson"] > self.best_pearson:
            self.best_pearson = metrics["Pearson"]

        logger.info(
            f"  Epoch {epoch:.2f} | Pearson={metrics['Pearson']:.4f} | "
            f"Spearman={metrics['Spearman']:.4f} | MAE={metrics['MAE']:.4f} | "
            f"Acc_bin={metrics['Acc_binaire']:.1f}% | Acc±0.10={metrics['Acc_pm010']:.1f}%"
        )

        if metrics["Spearman"] > self.best_spearman + 1e-4:
            self.best_spearman = metrics["Spearman"]
            self.no_improve    = 0
            self.best_epoch    = epoch
            os.makedirs(self.eval_save_path, exist_ok=True)
            self.model.save(self.eval_save_path)
            logger.info(f"  ✓ Nouveau meilleur Spearman={metrics['Spearman']:.4f} → sauvegardé")
        else:
            self.no_improve += 1
            logger.info(
                f"  ↔ Pas d'amélioration ({self.no_improve}/{self.patience}) "
                f"— meilleur={self.best_spearman:.4f} @ epoch {self.best_epoch:.2f}"
            )
            if self.no_improve >= self.patience:
                logger.info(f"  ✗ Early stopping à epoch {epoch:.2f}")
                control.should_training_stop = True


# ─────────────────────────────────────────────────────────────────────────────
# ENTRAÎNEMENT PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
def train(
    data_path:      Optional[str] = None,
    test_data_path: Optional[str] = None,
    epochs:         int           = EPOCHS,
    batch_size:     Optional[int] = None,
    lr:             float         = LR,
    warmup_ratio:   float         = WARMUP_RATIO,
    model_key:      str           = "bge-m3",
    use_lr_finder:  bool          = False,
    augment:        bool          = True,
) -> Dict:

    # FIX BUG 4 : chemin timestampé → plus de pollution cross-run
    run_ts         = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    eval_save_path = os.path.join(MODELS_BASE_DIR, "eval_results_v3", run_ts)
    checkpoint_dir = os.path.join(MODELS_BASE_DIR, "checkpoints_v3", run_ts)

    # ── 1. Chargement & nettoyage ────────────────────────────────────────────
    raw = (
        load_examples_from_json(data_path)
        if data_path and os.path.exists(data_path)
        else SYNTHETIC_EXAMPLES
    )
    raw = deduplicate(raw)

    buckets = [0] * 5
    for _, _, s in raw:
        buckets[min(4, int(s * 5))] += 1
    logger.info(
        f"Distribution scores → [0-0.2]:{buckets[0]} [0.2-0.4]:{buckets[1]} "
        f"[0.4-0.6]:{buckets[2]} [0.6-0.8]:{buckets[3]} [0.8-1.0]:{buckets[4]}"
    )

    # ── 2. Split ─────────────────────────────────────────────────────────────
    raw_test_external = (
        load_examples_from_json(test_data_path)
        if test_data_path and os.path.exists(test_data_path)
        else None
    )

    if raw_test_external:
        raw_train = raw
        raw_val   = raw_test_external
        logger.info(f"Test externe : {len(raw_val)} paires")
    else:
        raw_train, raw_val = stratified_split(raw, test_ratio=0.15)

    # ── 3. Augmentation ─────────────────────────────────────────────────────
    if augment and len(raw_train) >= 30:
        raw_train = augment_data(raw_train, ratio=0.20)

    # ── 4. LR Finder ────────────────────────────────────────────────────────
    if use_lr_finder:
        lr = find_best_lr(model_key, raw_train)

    # ── 5. Modèle ────────────────────────────────────────────────────────────
    base_model_name = MODELS_CONFIG[model_key]["base_model"]
    model_save_path = MODELS_CONFIG[model_key]["save_path"]
    logger.info(f"Chargement [{model_key}] : {base_model_name}")
    model = SentenceTransformer(base_model_name)

    # ── 6. Loss & Dataset HuggingFace ────────────────────────────────────────
    mnr_examples = build_mnr_examples(raw_train, model_key, SCORE_THRESHOLD)
    n_pos        = len(mnr_examples)

    if batch_size is None:
        batch_size = auto_batch_size(n_pos)
        logger.info(f"Batch size auto : {batch_size} ({n_pos} positifs)")

    if n_pos >= 32:
        base_loss = losses.MultipleNegativesRankingLoss(model)
        try:
            m_dims     = MATRYOSHKA_DIMS.get(model_key, MATRYOSHKA_DIMS["bge-m3"])
            train_loss = losses.MatryoshkaLoss(model, base_loss, matryoshka_dims=m_dims)
            logger.info(f"Loss : MatryoshkaMNR (dims={m_dims})")
        except Exception:
            train_loss = base_loss
            logger.info("Loss : MultipleNegativesRankingLoss (Matryoshka non disponible)")
        train_dataset = input_examples_to_dataset(mnr_examples)
    else:
        logger.warning(f"Seulement {n_pos} positifs → CosineSimilarityLoss + label smoothing")
        cosine_ex     = build_cosine_examples(raw_train, model_key, label_smoothing=0.05)
        train_loss    = losses.CosineSimilarityLoss(model)
        train_dataset = input_examples_to_dataset(cosine_ex)

    # ── 7. Calcul steps ──────────────────────────────────────────────────────
    steps_per_epoch = math.ceil(n_pos / batch_size)
    total_steps     = steps_per_epoch * epochs
    warmup_steps    = max(5, int(total_steps * warmup_ratio))

    logger.info(
        f"Entraînement : epochs={epochs} | batch={batch_size} | lr={lr} | "
        f"warmup={warmup_steps}/{total_steps} steps | "
        f"eval=1x/epoch (on_epoch_end) | patience={EARLY_STOP_PAT}"
    )

    # ── 8. Callback early stopping (FIX BUG 1) ───────────────────────────────
    os.makedirs(eval_save_path, exist_ok=True)
    early_stop_cb = EarlyStoppingEvaluatorCallback(
        model          = model,
        raw_val        = raw_val,
        model_key      = model_key,
        eval_save_path = eval_save_path,
        patience       = EARLY_STOP_PAT,
    )

    # ── 9. Training Arguments ─────────────────────────────────────────────────
    training_args = SentenceTransformerTrainingArguments(
        output_dir                  = checkpoint_dir,
        num_train_epochs            = epochs,
        per_device_train_batch_size = batch_size,
        per_device_eval_batch_size  = batch_size,
        warmup_steps                = warmup_steps,
        learning_rate               = lr,
        weight_decay                = WEIGHT_DECAY,
        max_grad_norm               = MAX_GRAD_NORM,
        # FIX BUG 1 : eval_strategy="no" → le Trainer ne déclenche JAMAIS
        # d'évaluation automatique. Seul on_epoch_end du callback évalue.
        eval_strategy               = "no",
        save_strategy               = "no",
        logging_steps               = steps_per_epoch,
        fp16                        = False,
        disable_tqdm                = False,
        lr_scheduler_type           = "cosine",
        batch_sampler               = BatchSamplers.BATCH_SAMPLER,
    )

    # ── 10. Trainer ───────────────────────────────────────────────────────────
    trainer = SentenceTransformerTrainer(
        model         = model,
        args          = training_args,
        train_dataset = train_dataset,
        loss          = train_loss,
        callbacks     = [early_stop_cb],
    )

    trainer.train()

    # ── 11. Rechargement du meilleur checkpoint (FIX BUG 6) ──────────────────
    if (
        os.path.exists(eval_save_path)
        and os.listdir(eval_save_path)
        and is_valid_checkpoint(eval_save_path, model_key)
    ):
        logger.info(f"Rechargement meilleur modèle depuis {eval_save_path}")
        model = SentenceTransformer(eval_save_path)
    else:
        logger.warning(
            f"Checkpoint invalide ou absent dans {eval_save_path}. "
            "On conserve le modèle en mémoire."
        )

    # ── 12. Sauvegarde finale ─────────────────────────────────────────────────
    os.makedirs(model_save_path, exist_ok=True)
    model.save(model_save_path)
    logger.info(f"Modèle final → {model_save_path}")

    # ── 13. Rapport JSON (FIX BUG 3) ─────────────────────────────────────────
    report = {
        "run_ts":         run_ts,
        "model_key":      model_key,
        "base_model":     base_model_name,
        "data_path":      data_path,
        "n_train":        len(raw_train),
        "n_val":          len(raw_val),
        "n_mnr_pos":      n_pos,
        "batch_size":     batch_size,
        "lr":             lr,
        "warmup_ratio":   warmup_ratio,
        "epochs_run":     len(early_stop_cb.history),
        "best_epoch":     early_stop_cb.best_epoch,       # FIX BUG 3
        "best_pearson":   early_stop_cb.best_pearson,
        "best_spearman":  early_stop_cb.best_spearman,    # FIX BUG 3
        "eval_save_path": eval_save_path,
        "history":        early_stop_cb.history,
    }
    os.makedirs(REPORT_SAVE_PATH, exist_ok=True)
    report_path = os.path.join(REPORT_SAVE_PATH, f"report_{model_key}_{run_ts}.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    logger.info(f"Rapport → {report_path}")

    quick_eval(model, model_key)
    return report


# ─────────────────────────────────────────────────────────────────────────────
# QUICK EVAL (8 paires)
# ─────────────────────────────────────────────────────────────────────────────
def quick_eval(model: SentenceTransformer, model_key: str = "bge-m3") -> None:
    test_pairs = [
        ("Développeur Full Stack React Node.js 3 ans",
         "5 ans React, Node.js, PostgreSQL, Docker",
         "Très proche",    (0.82, 1.00)),
        ("Développeur Full Stack React Node.js 3 ans",
         "Comptable Excel bilan fiscal",
         "Très différent", (0.00, 0.12)),
        ("Data Scientist Python TensorFlow NLP",
         "Étudiant Master IA scikit-learn projet NLP",
         "Partiel",        (0.45, 0.68)),
        ("DevOps Kubernetes AWS Terraform CI/CD",
         "Administrateur Linux Bash Docker notions",
         "Partiel fort",   (0.45, 0.68)),
        ("مطور ويب React Node.js خبرة 3 سنوات",
         "مطور 5 سنوات React Node.js PostgreSQL",
         "Arabe excellent",(0.85, 1.00)),
        ("Ingénieur Backend Python Django REST",
         "Développeur Python 2 ans Flask API basique",
         "Partiel bas",    (0.55, 0.72)),
        ("Chef de projet IT Agile Scrum 5 ans",
         "Chef de projet 3 ans Agile Scrum équipe 5",
         "Proche",         (0.72, 0.90)),
        ("Expert Cybersécurité pentest SIEM CISSP",
         "Boulanger pâtissier 10 ans artisan",
         "Hors domaine",   (0.00, 0.10)),
    ]

    sep = "─" * 65
    logger.info(f"\n{sep}")
    logger.info("Quick Evaluation post-entraînement (8 paires)")
    logger.info(sep)

    ok_count = 0
    for offer, cand, label, (lo, hi) in test_pairs:
        e1  = model.encode([format_text(offer, True,  model_key)])
        e2  = model.encode([format_text(cand,  False, model_key)])
        sim = float(sk_cosine(e1, e2)[0][0])
        ok  = lo <= sim <= hi
        if ok:
            ok_count += 1
        status = "OK" if ok else "VÉRIFIER"
        logger.info(f"  [{status:7s}] {label} → attendu [{lo:.2f},{hi:.2f}] | obtenu {sim:.4f}")
        logger.info(f"             Offre    : {offer[:55]}")
        logger.info(f"             Candidat : {cand[:55]}\n")

    logger.info(f"Résultat : {ok_count}/{len(test_pairs)} paires dans la plage attendue")
    logger.info(sep)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune HR matching — v3 finale")

    parser.add_argument("--data",         type=str,   default=None)
    parser.add_argument("--test_data",    type=str,   default=None)
    parser.add_argument("--epochs",       type=int,   default=EPOCHS)
    parser.add_argument("--batch_size",   type=int,   default=None)
    parser.add_argument("--lr",           type=float, default=LR)
    parser.add_argument("--warmup_ratio", type=float, default=WARMUP_RATIO,
                        help="Fraction des steps en warmup (défaut 0.05)")
    parser.add_argument("--model_type",   type=str,   choices=["e5", "bge-m3"], default="bge-m3")
    parser.add_argument("--eval",         action="store_true")
    parser.add_argument("--lr_finder",    action="store_true")
    parser.add_argument("--no_augment",   action="store_true")

    args = parser.parse_args()

    if args.eval:
        logger.info("Mode évaluation seule...")
        sp = MODELS_CONFIG[args.model_type]["save_path"]
        bn = MODELS_CONFIG[args.model_type]["base_model"]
        m  = SentenceTransformer(sp if os.path.exists(sp) else bn)
        quick_eval(m, args.model_type)
    else:
        train(
            data_path      = args.data,
            test_data_path = args.test_data,
            epochs         = args.epochs,
            batch_size     = args.batch_size,
            lr             = args.lr,
            warmup_ratio   = args.warmup_ratio,
            model_key      = args.model_type,
            use_lr_finder  = args.lr_finder,
            augment        = not args.no_augment,
        )