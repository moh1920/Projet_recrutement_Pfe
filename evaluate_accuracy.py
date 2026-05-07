"""
============================================================
  ÉVALUATION DES PERFORMANCES — BGE-M3 axe1 v5
  Métriques complètes : régression + classification + courbes
============================================================
"""

import json, logging, os
import numpy as np
import joblib
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.metrics import (
    f1_score, precision_score, recall_score,
    mean_absolute_error, confusion_matrix,
    precision_recall_curve, roc_curve, auc,
    classification_report
)
from scipy.stats import pearsonr, spearmanr
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
log = logging.getLogger(__name__)

# ============================================================
#  CONFIG — adaptez ces chemins si nécessaire
# ============================================================
MODEL_PATH      = "G:/ai_models/trained_model_bge_m3_axe1_v5"
BASELINE_PATH   = "G:/ai_models/trained_model_bge_m3_axe1_v4"
CALIBRATOR_PATH = "calibrator_axe1_v5.pkl"
DATA_PATH       = "hr_dataset.json"
THRESHOLD       = 0.67   # seuil optimal trouvé en v5
OUTPUT_DIR      = "evaluation_results"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
#  1. CHARGEMENT DONNÉES
# ============================================================
def load_data(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    seen, clean = set(), []
    for item in data:
        key = (item["offer_text"].strip(), item["candidate_text"].strip())
        if key not in seen and 0.0 <= float(item["score"]) <= 1.0:
            seen.add(key)
            item["score"] = float(item["score"])
            clean.append(item)
    log.info(f"  {len(clean)} paires chargées")
    return clean


# ============================================================
#  2. PRÉDICTION
# ============================================================
def predict(model, data, batch_size=32):
    offers = [p["offer_text"]     for p in data]
    cands  = [p["candidate_text"] for p in data]
    gt     = np.array([p["score"] for p in data])

    model.eval()
    eo = model.encode(offers, batch_size=batch_size,
                      normalize_embeddings=True, show_progress_bar=True)
    ec = model.encode(cands,  batch_size=batch_size,
                      normalize_embeddings=True, show_progress_bar=True)
    pred = np.sum(eo * ec, axis=1)
    return pred, gt


# ============================================================
#  3. MÉTRIQUES COMPLÈTES
# ============================================================
def compute_metrics(pred, gt, threshold, label="modèle"):
    mae      = mean_absolute_error(gt, pred)
    mse      = float(np.mean((pred - gt) ** 2))
    rmse     = float(np.sqrt(mse))
    bias     = float(np.mean(pred - gt))
    pearson  = pearsonr(gt, pred)[0]
    spearman = spearmanr(gt, pred)[0]
    acc10    = float(np.mean(np.abs(pred - gt) <= 0.10))
    acc20    = float(np.mean(np.abs(pred - gt) <= 0.20))
    acc05    = float(np.mean(np.abs(pred - gt) <= 0.05))

    gt_b   = (gt   >= threshold).astype(int)
    pred_b = (pred >= threshold).astype(int)
    f1     = f1_score(gt_b, pred_b, zero_division=0)
    prec   = precision_score(gt_b, pred_b, zero_division=0)
    rec    = recall_score(gt_b, pred_b, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(gt_b, pred_b).ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    fpr, tpr, _ = roc_curve(gt_b, pred)
    roc_auc     = auc(fpr, tpr)

    metrics = dict(
        label=label, mae=mae, mse=mse, rmse=rmse, bias=bias,
        pearson=pearson, spearman=spearman,
        acc05=acc05, acc10=acc10, acc20=acc20,
        f1=f1, precision=prec, recall=rec,
        specificity=specificity, roc_auc=roc_auc,
        tp=tp, fp=fp, tn=tn, fn=fn,
        fpr=fpr, tpr=tpr
    )
    return metrics


def print_metrics(m):
    log.info(f"\n{'='*60}")
    log.info(f"  RÉSULTATS — {m['label']}")
    log.info(f"{'='*60}")
    log.info(f"  --- Régression ---")
    log.info(f"  MAE          : {m['mae']:.4f}")
    log.info(f"  RMSE         : {m['rmse']:.4f}")
    log.info(f"  Biais        : {m['bias']:+.4f}")
    log.info(f"  Pearson r    : {m['pearson']:.4f}")
    log.info(f"  Spearman ρ   : {m['spearman']:.4f}")
    log.info(f"  Acc ±0.05    : {m['acc05']:.2%}")
    log.info(f"  Acc ±0.10    : {m['acc10']:.2%}")
    log.info(f"  Acc ±0.20    : {m['acc20']:.2%}")
    log.info(f"  --- Classification ---")
    log.info(f"  F1-score     : {m['f1']:.4f}")
    log.info(f"  Précision    : {m['precision']:.4f}")
    log.info(f"  Rappel       : {m['recall']:.4f}")
    log.info(f"  Spécificité  : {m['specificity']:.4f}")
    log.info(f"  ROC-AUC      : {m['roc_auc']:.4f}")
    log.info(f"  TP={m['tp']} FP={m['fp']} TN={m['tn']} FN={m['fn']}")
    log.info(f"{'='*60}\n")


# ============================================================
#  4. ANALYSE PAR TRANCHE DE SCORE
# ============================================================
def analyze_by_bucket(pred, gt, label=""):
    log.info(f"\n  Analyse par tranche ({label})")
    log.info(f"  {'Tranche':<15} {'N':>5} {'MAE':>8} {'Biais':>8} {'Acc±0.10':>10}")
    log.info(f"  {'-'*50}")
    buckets = [(0.0,0.3,"Faible"), (0.3,0.6,"Moyen"),
               (0.6,0.8,"Bon"), (0.8,1.01,"Excellent")]
    for lo, hi, name in buckets:
        mask = (gt >= lo) & (gt < hi)
        if mask.sum() == 0:
            continue
        p, g = pred[mask], gt[mask]
        mae  = mean_absolute_error(g, p)
        bias = float(np.mean(p - g))
        acc  = float(np.mean(np.abs(p - g) <= 0.10))
        log.info(f"  {name:<15} {mask.sum():>5} {mae:>8.4f} {bias:>+8.4f} {acc:>10.2%}")


# ============================================================
#  5. VISUALISATIONS
# ============================================================
def plot_all(m_v5, m_base, pred_v5, pred_cal, gt, threshold):
    fig = plt.figure(figsize=(18, 14))
    fig.suptitle("Évaluation BGE-M3 axe1 — v5 vs Baseline", fontsize=16, fontweight='bold')
    gs  = gridspec.GridSpec(3, 3, figure=fig, hspace=0.4, wspace=0.35)

    colors = {"v5": "#2563eb", "baseline": "#dc2626", "calibré": "#16a34a"}

    # --- 1. Scatter : prédictions vs réel ---
    ax1 = fig.add_subplot(gs[0, 0])
    ax1.scatter(gt, pred_v5,   alpha=0.4, s=20, color=colors["v5"],       label="v5 brut")
    ax1.scatter(gt, pred_cal,  alpha=0.4, s=20, color=colors["calibré"],  label="v5 calibré")
    ax1.plot([0,1],[0,1], 'k--', linewidth=1)
    ax1.set_xlabel("Score réel"); ax1.set_ylabel("Score prédit")
    ax1.set_title("Prédictions vs Réel"); ax1.legend(fontsize=8)

    # --- 2. Distribution des erreurs ---
    ax2 = fig.add_subplot(gs[0, 1])
    errors_v5  = pred_v5  - gt
    errors_cal = pred_cal - gt
    ax2.hist(errors_v5,  bins=30, alpha=0.6, color=colors["v5"],      label=f"v5 brut (bias={np.mean(errors_v5):+.3f})")
    ax2.hist(errors_cal, bins=30, alpha=0.6, color=colors["calibré"], label=f"v5 calibré (bias={np.mean(errors_cal):+.3f})")
    ax2.axvline(0, color='k', linestyle='--', linewidth=1)
    ax2.set_xlabel("Erreur (prédit - réel)"); ax2.set_ylabel("Fréquence")
    ax2.set_title("Distribution des erreurs"); ax2.legend(fontsize=8)

    # --- 3. ROC Curve ---
    ax3 = fig.add_subplot(gs[0, 2])
    ax3.plot(m_v5['fpr'],  m_v5['tpr'],  color=colors["v5"],
             label=f"v5 (AUC={m_v5['roc_auc']:.3f})")
    ax3.plot(m_base['fpr'], m_base['tpr'], color=colors["baseline"],
             label=f"Baseline (AUC={m_base['roc_auc']:.3f})", linestyle='--')
    ax3.plot([0,1],[0,1],'k--',linewidth=0.8)
    ax3.set_xlabel("Faux positifs"); ax3.set_ylabel("Vrais positifs")
    ax3.set_title("Courbe ROC"); ax3.legend(fontsize=8)

    # --- 4. Precision-Recall Curve ---
    ax4 = fig.add_subplot(gs[1, 0])
    gt_b = (gt >= threshold).astype(int)
    p_v5,  r_v5,  _ = precision_recall_curve(gt_b, pred_v5)
    p_cal, r_cal, _ = precision_recall_curve(gt_b, pred_cal)
    ax4.plot(r_v5,  p_v5,  color=colors["v5"],      label="v5 brut")
    ax4.plot(r_cal, p_cal, color=colors["calibré"], label="v5 calibré")
    ax4.set_xlabel("Rappel"); ax4.set_ylabel("Précision")
    ax4.set_title("Courbe Précision-Rappel"); ax4.legend(fontsize=8)

    # --- 5. Matrice de confusion v5 calibré ---
    ax5 = fig.add_subplot(gs[1, 1])
    cm = np.array([[m_v5['tn'], m_v5['fp']],
                   [m_v5['fn'], m_v5['tp']]])
    im = ax5.imshow(cm, cmap='Blues')
    ax5.set_xticks([0,1]); ax5.set_yticks([0,1])
    ax5.set_xticklabels(["Non-match","Match"])
    ax5.set_yticklabels(["Non-match","Match"])
    ax5.set_xlabel("Prédit"); ax5.set_ylabel("Réel")
    ax5.set_title(f"Matrice de confusion v5\n(seuil={threshold:.2f})")
    for i in range(2):
        for j in range(2):
            ax5.text(j, i, str(cm[i,j]), ha='center', va='center',
                     fontsize=14, color='white' if cm[i,j] > cm.max()/2 else 'black')

    # --- 6. Comparaison métriques bar chart ---
    ax6 = fig.add_subplot(gs[1, 2])
    metrics_names = ["MAE", "F1", "Précision", "Rappel", "AUC"]
    base_vals = [m_base['mae'], m_base['f1'], m_base['precision'],
                 m_base['recall'], m_base['roc_auc']]
    v5_vals   = [m_v5['mae'],  m_v5['f1'],  m_v5['precision'],
                 m_v5['recall'],  m_v5['roc_auc']]
    x = np.arange(len(metrics_names))
    w = 0.35
    ax6.bar(x - w/2, base_vals, w, label="Baseline", color=colors["baseline"], alpha=0.8)
    ax6.bar(x + w/2, v5_vals,   w, label="v5",       color=colors["v5"],       alpha=0.8)
    ax6.set_xticks(x); ax6.set_xticklabels(metrics_names, fontsize=9)
    ax6.set_title("Comparaison Baseline vs v5")
    ax6.legend(fontsize=8)
    for i, (b, v) in enumerate(zip(base_vals, v5_vals)):
        ax6.text(i - w/2, b + 0.005, f"{b:.3f}", ha='center', fontsize=7)
        ax6.text(i + w/2, v + 0.005, f"{v:.3f}", ha='center', fontsize=7)

    # --- 7. MAE par tranche de score ---
    ax7 = fig.add_subplot(gs[2, 0])
    buckets = [(0.0,0.3,"0.0-0.3"),(0.3,0.6,"0.3-0.6"),
               (0.6,0.8,"0.6-0.8"),(0.8,1.0,"0.8-1.0")]
    b_labels, mae_v5_b, mae_base_b = [], [], []
    pred_base = m_base.get('pred', pred_v5)
    for lo, hi, name in buckets:
        mask = (gt >= lo) & (gt < hi)
        if mask.sum() == 0: continue
        b_labels.append(name)
        mae_v5_b.append(mean_absolute_error(gt[mask], pred_v5[mask]))
        mae_base_b.append(mean_absolute_error(gt[mask], pred_base[mask]))
    x2 = np.arange(len(b_labels))
    ax7.bar(x2 - w/2, mae_base_b, w, label="Baseline", color=colors["baseline"], alpha=0.8)
    ax7.bar(x2 + w/2, mae_v5_b,   w, label="v5",       color=colors["v5"],       alpha=0.8)
    ax7.set_xticks(x2); ax7.set_xticklabels(b_labels)
    ax7.set_ylabel("MAE"); ax7.set_title("MAE par tranche de score")
    ax7.legend(fontsize=8)

    # --- 8. Distribution des scores prédits vs réels ---
    ax8 = fig.add_subplot(gs[2, 1])
    ax8.hist(gt,       bins=20, alpha=0.5, color='gray',          label="Scores réels")
    ax8.hist(pred_v5,  bins=20, alpha=0.5, color=colors["v5"],    label="v5 brut")
    ax8.hist(pred_cal, bins=20, alpha=0.5, color=colors["calibré"],label="v5 calibré")
    ax8.axvline(threshold, color='red', linestyle='--', label=f"Seuil {threshold}")
    ax8.set_xlabel("Score"); ax8.set_ylabel("Fréquence")
    ax8.set_title("Distribution des scores"); ax8.legend(fontsize=7)

    # --- 9. Tableau récap ---
    ax9 = fig.add_subplot(gs[2, 2])
    ax9.axis('off')
    table_data = [
        ["Métrique",    "Baseline", "v5 brut", "v5 cal."],
        ["MAE",         f"{m_base['mae']:.4f}", f"{m_v5['mae']:.4f}", "—"],
        ["RMSE",        f"{m_base['rmse']:.4f}", f"{m_v5['rmse']:.4f}", "—"],
        ["Biais",       f"{m_base['bias']:+.4f}", f"{m_v5['bias']:+.4f}", "—"],
        ["Pearson",     f"{m_base['pearson']:.4f}", f"{m_v5['pearson']:.4f}", "—"],
        ["Acc±0.10",    f"{m_base['acc10']:.2%}", f"{m_v5['acc10']:.2%}", "—"],
        ["F1",          f"{m_base['f1']:.4f}", f"{m_v5['f1']:.4f}", "—"],
        ["AUC",         f"{m_base['roc_auc']:.4f}", f"{m_v5['roc_auc']:.4f}", "—"],
    ]
    tbl = ax9.table(cellText=table_data[1:], colLabels=table_data[0],
                    loc='center', cellLoc='center')
    tbl.auto_set_font_size(False)
    tbl.set_fontsize(9)
    tbl.scale(1.1, 1.4)
    ax9.set_title("Tableau récapitulatif", pad=10)

    out_path = os.path.join(OUTPUT_DIR, "evaluation_report.png")
    plt.savefig(out_path, dpi=150, bbox_inches='tight')
    log.info(f"  📊 Graphiques sauvegardés → {out_path}")
    plt.show()


# ============================================================
#  MAIN
# ============================================================
if __name__ == "__main__":
    log.info("=" * 60)
    log.info("  ÉVALUATION BGE-M3 axe1 v5")
    log.info("=" * 60)

    # Chargement données
    log.info("\n[1] CHARGEMENT DONNÉES")
    data = load_data(DATA_PATH)

    # Chargement modèles
    log.info("\n[2] CHARGEMENT MODÈLES")
    log.info("  Chargement v5...")
    model_v5   = SentenceTransformer(MODEL_PATH)
    log.info("  Chargement baseline...")
    model_base = SentenceTransformer(BASELINE_PATH)
    log.info("  Chargement calibrateur...")
    calibrator = joblib.load(CALIBRATOR_PATH)

    # Prédictions
    log.info("\n[3] PRÉDICTIONS")
    log.info("  v5...")
    pred_v5, gt = predict(model_v5, data)
    log.info("  baseline...")
    pred_base, _  = predict(model_base, data)
    pred_cal = calibrator.predict(pred_v5)

    # Métriques
    log.info("\n[4] MÉTRIQUES")
    m_v5   = compute_metrics(pred_v5,   gt, THRESHOLD, label="v5 brut")
    m_cal  = compute_metrics(pred_cal,  gt, THRESHOLD, label="v5 calibré")
    m_base = compute_metrics(pred_base, gt, THRESHOLD, label="Baseline v4")
    m_base['pred'] = pred_base

    print_metrics(m_base)
    print_metrics(m_v5)
    print_metrics(m_cal)

    # Analyse par tranche
    log.info("\n[5] ANALYSE PAR TRANCHE")
    analyze_by_bucket(pred_v5,  gt, "v5 brut")
    analyze_by_bucket(pred_cal, gt, "v5 calibré")

    # Rapport classification détaillé
    log.info("\n[6] RAPPORT CLASSIFICATION DÉTAILLÉ (v5 calibré)")
    gt_b = (gt >= THRESHOLD).astype(int)
    log.info("\n" + classification_report(
        gt_b, (pred_cal >= THRESHOLD).astype(int),
        target_names=["Non-match", "Match"]
    ))

    # Sauvegarde métriques JSON
    results = {
        "baseline": {k: float(v) for k, v in m_base.items()
                     if isinstance(v, (int, float, np.floating))},
        "v5_brut":  {k: float(v) for k, v in m_v5.items()
                     if isinstance(v, (int, float, np.floating))},
        "v5_calibre": {k: float(v) for k, v in m_cal.items()
                       if isinstance(v, (int, float, np.floating))},
        "seuil": THRESHOLD
    }
    json_path = os.path.join(OUTPUT_DIR, "metrics.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    log.info(f"  💾 Métriques JSON → {json_path}")

    # Graphiques
    log.info("\n[7] GÉNÉRATION GRAPHIQUES")
    plot_all(m_v5, m_base, pred_v5, pred_cal, gt, THRESHOLD)

    log.info("\n✅ Évaluation terminée !")
    log.info(f"   Résultats dans : {OUTPUT_DIR}/")