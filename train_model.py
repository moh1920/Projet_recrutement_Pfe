"""
============================================================
  ENTRAÎNEMENT BGE-M3 axe1 — VERSION 5 (CORRIGÉ)
  Fix : gradient flow via forward() au lieu de encode()
  Compatible SentenceTransformers + PyTorch autograd
============================================================
"""

import json, random, logging, os
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from sentence_transformers import SentenceTransformer
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import f1_score, precision_score, recall_score, mean_absolute_error
from scipy.stats import pearsonr
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
log = logging.getLogger(__name__)

# ============================================================
#  CONFIG
# ============================================================
MODEL_PATH      = "G:/ai_models/trained_model_bge_m3_axe1_v4"
OUTPUT_PATH     = "G:/ai_models/trained_model_bge_m3_axe1_v5"
CALIBRATOR_PATH = "calibrator_axe1_v5.pkl"

MATCH_THRESHOLD = 0.70
EPOCHS          = 15
BATCH_SIZE      = 16
LR              = 2e-5
WARMUP_RATIO    = 0.10
VAL_SPLIT       = 0.15
ALPHA_REG       = 0.60
SEED            = 42
MAX_LENGTH      = 128

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)


# ============================================================
#  1. CHARGEMENT
# ============================================================
def load_and_clean(path: str):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    log.info(f"  {len(data)} paires brutes chargées")

    seen, clean = set(), []
    for item in data:
        key = (item["offer_text"].strip(), item["candidate_text"].strip())
        if key not in seen and 0.0 <= float(item["score"]) <= 1.0:
            seen.add(key)
            item["score"] = float(item["score"])
            clean.append(item)

    log.info(f"  {len(clean)} paires après dédoublonnage ({len(data)-len(clean)} supprimées)")
    scores = [p["score"] for p in clean]
    log.info(f"  Scores — min={min(scores):.2f} max={max(scores):.2f} "
             f"mean={np.mean(scores):.2f} std={np.std(scores):.2f}")
    return clean


def split_stratified(data, val_ratio=VAL_SPLIT, seed=SEED):
    random.seed(seed)
    buckets = [[] for _ in range(10)]
    for item in data:
        idx = min(int(item["score"] * 10), 9)
        buckets[idx].append(item)

    train, val = [], []
    for b in buckets:
        random.shuffle(b)
        n = max(1, int(len(b) * val_ratio))
        val.extend(b[:n])
        train.extend(b[n:])

    train_keys = {(i["offer_text"], i["candidate_text"]) for i in train}
    val = [i for i in val if (i["offer_text"], i["candidate_text"]) not in train_keys]

    log.info(f"  Split — train: {len(train)} | val: {len(val)}")
    for name, subset in [("train", train), ("val", val)]:
        s = [p["score"] for p in subset]
        nm = sum(1 for x in s if x >= MATCH_THRESHOLD)
        log.info(f"  {name}: mean={np.mean(s):.3f} | "
                 f"match≥{MATCH_THRESHOLD}: {nm}/{len(s)} ({100*nm/len(s):.1f}%)")
    return train, val


# ============================================================
#  2. DATASET
# ============================================================
class PairDataset(Dataset):
    def __init__(self, pairs):
        self.pairs = pairs

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx):
        p = self.pairs[idx]
        return p["offer_text"], p["candidate_text"], float(p["score"])


def collate_fn(batch):
    o, c, s = zip(*batch)
    return list(o), list(c), torch.tensor(s, dtype=torch.float32)


# ============================================================
#  3. ENCODAGE AVEC GRADIENT
#     SentenceTransformer.encode() détache les tenseurs.
#     On utilise le tokenizer + forward() directement.
# ============================================================
def encode_with_grad(model, texts, device, max_length=MAX_LENGTH):
    """
    Encode une liste de textes en passant par le forward PyTorch
    pour conserver le gradient (nécessaire pour loss.backward()).
    Retourne les embeddings L2-normalisés.
    """
    tokenizer = model.tokenizer
    transformer = model._first_module().auto_model  # ← safer than model[0]

    encoded = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=max_length,
        return_tensors="pt"
    ).to(device)

    output = transformer(**encoded)

    token_embeddings = output.last_hidden_state
    attention_mask   = encoded["attention_mask"]
    mask_expanded    = attention_mask.unsqueeze(-1).float()
    sum_emb          = (token_embeddings * mask_expanded).sum(dim=1)
    sum_mask         = mask_expanded.sum(dim=1).clamp(min=1e-9)
    mean_emb         = sum_emb / sum_mask

    return F.normalize(mean_emb, p=2, dim=1)


# ============================================================
#  4. LOSS HYBRIDE
# ============================================================
class HybridLoss(nn.Module):
    def __init__(self, alpha=ALPHA_REG, threshold=MATCH_THRESHOLD, delta=0.10):
        super().__init__()
        self.alpha     = alpha
        self.threshold = threshold
        self.huber     = nn.HuberLoss(delta=delta, reduction='mean')

    def forward(self, cos_sim: torch.Tensor, scores_gt: torch.Tensor):
        # Régression continue
        loss_reg = self.huber(cos_sim, scores_gt)

        # Classification binaire avec pénalité asymétrique (faux positifs ×2)
        labels  = (scores_gt >= self.threshold).float()
        weights = torch.where(labels == 0,
                              torch.full_like(labels, 2.0),
                              torch.ones_like(labels))
        proba   = torch.sigmoid((cos_sim - self.threshold) * 12)
        bce     = -(weights * (
            labels * torch.log(proba + 1e-8) +
            (1 - labels) * torch.log(1 - proba + 1e-8)
        )).mean()

        return self.alpha * loss_reg + (1 - self.alpha) * bce


# ============================================================
#  5. ÉVALUATION (utilise encode() sans grad — plus rapide)
# ============================================================
def evaluate(model, data, threshold=MATCH_THRESHOLD):
    offers = [p["offer_text"]     for p in data]
    cands  = [p["candidate_text"] for p in data]
    gt     = np.array([p["score"] for p in data])

    model.eval()
    with torch.no_grad():
        eo = model.encode(offers, batch_size=32, normalize_embeddings=True,
                          show_progress_bar=False)
        ec = model.encode(cands,  batch_size=32, normalize_embeddings=True,
                          show_progress_bar=False)
    pred = np.sum(eo * ec, axis=1)

    mae     = mean_absolute_error(gt, pred)
    pearson = pearsonr(gt, pred)[0]
    acc10   = float(np.mean(np.abs(pred - gt) <= 0.10))
    acc20   = float(np.mean(np.abs(pred - gt) <= 0.20))
    bias    = float(np.mean(pred - gt))

    gt_b   = (gt   >= threshold).astype(int)
    pred_b = (pred >= threshold).astype(int)
    f1   = f1_score(gt_b, pred_b, zero_division=0)
    prec = precision_score(gt_b, pred_b, zero_division=0)
    rec  = recall_score(gt_b, pred_b, zero_division=0)

    return dict(mae=mae, pearson=pearson, acc10=acc10, acc20=acc20,
                bias=bias, f1=f1, precision=prec, recall=rec,
                pred=pred, gt=gt)


# ============================================================
#  6. HARD NEGATIVE MINING
# ============================================================
def mine_hard_negatives(model, train_data, margin=0.12, max_ratio=0.25):
    neg = [p for p in train_data if p["score"] < MATCH_THRESHOLD]
    if not neg:
        return []

    model.eval()
    with torch.no_grad():
        eo = model.encode([p["offer_text"]     for p in neg], batch_size=32,
                          normalize_embeddings=True, show_progress_bar=False)
        ec = model.encode([p["candidate_text"] for p in neg], batch_size=32,
                          normalize_embeddings=True, show_progress_bar=False)
    sims = np.sum(eo * ec, axis=1)

    hard = [(neg[i], sims[i]) for i in range(len(neg))
            if sims[i] > (MATCH_THRESHOLD - margin)]
    hard.sort(key=lambda x: x[1], reverse=True)
    n = min(len(hard), int(len(train_data) * max_ratio))
    result = [h[0] for h in hard[:n]]
    log.info(f"  Hard negatives : {len(result)} / {len(neg)} sélectionnés")
    return result


# ============================================================
#  7. ENTRAÎNEMENT
# ============================================================
def train(model, train_data, val_data, loss_fn):
    device = torch.device("cpu")
    log.info(f"  Device : {device}")

    first_module = model._first_module()
    transformer = first_module.auto_model.to(device)

    # Geler tout
    for param in transformer.parameters():
        param.requires_grad = False

    # Dégeler seulement les 2 dernières couches
    for layer in transformer.encoder.layer[-2:]:
        for param in layer.parameters():
            param.requires_grad = True

    trainable = sum(p.numel() for p in transformer.parameters() if p.requires_grad)
    total     = sum(p.numel() for p in transformer.parameters())
    log.info(f"  Paramètres entraînables : {trainable:,} / {total:,} ({100*trainable/total:.1f}%)")

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, transformer.parameters()),
        lr=LR, weight_decay=0.01
    )

    steps_ep    = len(train_data) // BATCH_SIZE + 1
    total_steps = steps_ep * EPOCHS
    warmup      = int(total_steps * WARMUP_RATIO)

    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer, max_lr=LR, total_steps=total_steps,
        pct_start=warmup / total_steps, anneal_strategy='cos'
    )

    best_mae  = float('inf')
    best_path = OUTPUT_PATH + "_best"
    patience  = 4          # early stopping
    no_improve = 0

    for epoch in range(1, EPOCHS + 1):
        transformer.train()

        epoch_data = train_data
        if epoch >= 4:
            model.eval()
            hn = mine_hard_negatives(model, train_data)
            epoch_data = train_data + hn

        loader = DataLoader(PairDataset(epoch_data), batch_size=BATCH_SIZE,
                            shuffle=True, collate_fn=collate_fn)
        total_loss = 0.0

        for offers, cands, scores_t in loader:
            scores_t = scores_t.to(device)
            transformer.train()

            eo = encode_with_grad(model, offers, device)
            ec = encode_with_grad(model, cands,  device)

            cos_sim = (eo * ec).sum(dim=1)
            loss    = loss_fn(cos_sim, scores_t)

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(transformer.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            total_loss += loss.item()

        avg_loss = total_loss / len(loader)
        model.eval()
        m = evaluate(model, val_data)

        log.info(f"  Epoch {epoch:02d}/{EPOCHS} | loss={avg_loss:.4f} | "
                 f"MAE={m['mae']:.4f} | bias={m['bias']:+.4f} | "
                 f"Acc±0.10={m['acc10']:.2%} | F1={m['f1']:.4f}")

        if m['mae'] < best_mae:
            best_mae = m['mae']
            no_improve = 0
            model.save(best_path)
            log.info(f"  ✓ Checkpoint sauvegardé (MAE={best_mae:.4f})")
        else:
            no_improve += 1
            log.info(f"  ✗ Pas d'amélioration ({no_improve}/{patience})")
            if no_improve >= patience:
                log.info(f"  Early stopping à l'epoch {epoch}")
                break

    log.info("  Chargement du meilleur checkpoint...")
    model = SentenceTransformer(best_path)
    model.save(OUTPUT_PATH)
    log.info(f"  Modèle final → {OUTPUT_PATH}")
    return model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info(f"  Device : {device}")

    # Safely get the backbone
    first_module = model._first_module()
    transformer = first_module.auto_model.to(device)

    # ✅ Unfreeze all parameters
    for param in transformer.parameters():
        param.requires_grad = True

    log.info(f"  Paramètres entraînables : "
             f"{sum(p.numel() for p in transformer.parameters() if p.requires_grad):,}")

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, transformer.parameters()),
        lr=LR, weight_decay=0.01
    )

    steps_ep    = len(train_data) // BATCH_SIZE + 1
    total_steps = steps_ep * EPOCHS
    warmup      = int(total_steps * WARMUP_RATIO)

    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer, max_lr=LR, total_steps=total_steps,
        pct_start=warmup / total_steps, anneal_strategy='cos'
    )

    best_mae  = float('inf')
    best_path = OUTPUT_PATH + "_best"

    for epoch in range(1, EPOCHS + 1):
        transformer.train()

        epoch_data = train_data
        if epoch >= 4:
            model.eval()
            hn = mine_hard_negatives(model, train_data)
            epoch_data = train_data + hn

        loader = DataLoader(PairDataset(epoch_data), batch_size=BATCH_SIZE,
                            shuffle=True, collate_fn=collate_fn)
        total_loss = 0.0

        for offers, cands, scores_t in loader:
            scores_t = scores_t.to(device)
            transformer.train()

            # Encodage AVEC gradient
            eo = encode_with_grad(model, offers, device)
            ec = encode_with_grad(model, cands,  device)

            cos_sim = (eo * ec).sum(dim=1)  # (B,) — tenseur avec grad_fn
            loss    = loss_fn(cos_sim, scores_t)

            optimizer.zero_grad()
            loss.backward()                  # fonctionne maintenant
            torch.nn.utils.clip_grad_norm_(transformer.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            total_loss += loss.item()

        avg_loss = total_loss / len(loader)
        model.eval()
        m = evaluate(model, val_data)

        log.info(f"  Epoch {epoch:02d}/{EPOCHS} | loss={avg_loss:.4f} | "
                 f"MAE={m['mae']:.4f} | bias={m['bias']:+.4f} | "
                 f"Acc±0.10={m['acc10']:.2%} | F1={m['f1']:.4f}")

        if m['mae'] < best_mae:
            best_mae = m['mae']
            model.save(best_path)
            log.info(f"  ✓ Checkpoint sauvegardé (MAE={best_mae:.4f})")

    log.info("  Chargement du meilleur checkpoint...")
    model = SentenceTransformer(best_path)
    model.save(OUTPUT_PATH)
    log.info(f"  Modèle final → {OUTPUT_PATH}")
    return model


# ============================================================
#  8. CALIBRATION + SEUIL
# ============================================================
def calibrate(pred, gt, path=CALIBRATOR_PATH):
    cal = IsotonicRegression(out_of_bounds='clip')
    cal.fit(pred, gt)
    joblib.dump(cal, path)
    pred_cal = cal.predict(pred)
    log.info(f"  MAE avant: {mean_absolute_error(gt, pred):.4f} "
             f"→ après: {mean_absolute_error(gt, pred_cal):.4f}")
    log.info(f"  Biais avant: {np.mean(pred-gt):+.4f} "
             f"→ après: {np.mean(pred_cal-gt):+.4f}")
    return cal


def find_best_threshold(gt, pred):
    gt_b = (gt >= MATCH_THRESHOLD).astype(int)
    best_f1, best_t = 0.0, MATCH_THRESHOLD
    for t in np.arange(0.30, 0.95, 0.01):
        f1 = f1_score(gt_b, (pred >= t).astype(int), zero_division=0)
        if f1 > best_f1:
            best_f1, best_t = f1, t
    log.info(f"  Seuil optimal : {best_t:.2f} (F1={best_f1:.4f})")
    return best_t


# ============================================================
#  MAIN
# ============================================================
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data",       default="job_matching_dataset_800.json")
    parser.add_argument("--model_type", default="bge-m3")
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("  BGE-M3 axe1 — ENTRAÎNEMENT v5 (800 paires)")
    log.info("=" * 60)

    log.info("\n[1] CHARGEMENT")
    data = load_and_clean(args.data)
    train_data, val_data = split_stratified(data)

    log.info("\n[2] MODÈLE")
    model = SentenceTransformer(MODEL_PATH)
    log.info(f"  Chargé depuis : {MODEL_PATH}")

    log.info("\n[3] BASELINE")
    base = evaluate(model, val_data)
    log.info(f"  MAE={base['mae']:.4f} | bias={base['bias']:+.4f} | "
             f"Acc±0.10={base['acc10']:.2%} | F1={base['f1']:.4f}")

    log.info("\n[4] ENTRAÎNEMENT")
    loss_fn = HybridLoss(alpha=ALPHA_REG)
    model   = train(model, train_data, val_data, loss_fn)

    log.info("\n[5] ÉVALUATION FINALE")
    final = evaluate(model, val_data)
    log.info(f"  MAE={final['mae']:.4f} | bias={final['bias']:+.4f} | "
             f"Acc±0.10={final['acc10']:.2%} | F1={final['f1']:.4f}")

    log.info("\n[6] CALIBRATION")
    all_m = evaluate(model, data)
    cal   = calibrate(all_m['pred'], all_m['gt'])

    log.info("\n[7] SEUIL OPTIMAL")
    pred_cal = cal.predict(final['pred'])
    best_t   = find_best_threshold(final['gt'], pred_cal)

    # Métriques finales
    mae_cal  = mean_absolute_error(final['gt'], pred_cal)
    acc10_cal = float(np.mean(np.abs(pred_cal - final['gt']) <= 0.10))
    acc20_cal = float(np.mean(np.abs(pred_cal - final['gt']) <= 0.20))
    gt_b = (final['gt'] >= MATCH_THRESHOLD).astype(int)
    f1_cal   = f1_score(gt_b, (pred_cal >= best_t).astype(int), zero_division=0)
    prec_cal = precision_score(gt_b, (pred_cal >= best_t).astype(int), zero_division=0)
    rec_cal  = recall_score(gt_b, (pred_cal >= best_t).astype(int), zero_division=0)

    log.info("\n" + "=" * 68)
    log.info(f"  {'Métrique':<20} {'Baseline':>12} {'v5 brut':>12} {'v5 calibré':>14}")
    log.info("-" * 68)
    log.info(f"  {'MAE':<20} {base['mae']:>12.4f} {final['mae']:>12.4f} {mae_cal:>14.4f}")
    log.info(f"  {'Biais':<20} {base['bias']:>+12.4f} {final['bias']:>+12.4f} "
             f"{float(np.mean(pred_cal - final['gt'])):>+14.4f}")
    log.info(f"  {'Acc ±0.10':<20} {base['acc10']:>12.2%} {final['acc10']:>12.2%} {acc10_cal:>14.2%}")
    log.info(f"  {'Acc ±0.20':<20} {base['acc20']:>12.2%} {final['acc20']:>12.2%} {acc20_cal:>14.2%}")
    log.info(f"  {'F1-score':<20} {base['f1']:>12.4f} {final['f1']:>12.4f} {f1_cal:>14.4f}")
    log.info(f"  {'Précision':<20} {base['precision']:>12.4f} {final['precision']:>12.4f} {prec_cal:>14.4f}")
    log.info(f"  {'Rappel':<20} {base['recall']:>12.4f} {final['recall']:>12.4f} {rec_cal:>14.4f}")
    log.info(f"  {'Seuil':<20} {'0.70':>12} {'0.70':>12} {best_t:>14.2f}")
    log.info("=" * 68)
    log.info(f"\n  Modèle    → {OUTPUT_PATH}")
    log.info(f"  Calibrateur → {CALIBRATOR_PATH}")
    log.info(f"  Seuil prod  → {best_t:.2f}")