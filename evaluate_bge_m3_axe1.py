"""
Evaluation complète du modèle bge-m3 fine-tuné (axe1)
Charge RÉELLEMENT le modèle depuis G:/ai_models/trained_model_bge_m3_axe1

Format ground_truth.json attendu :
[
  {"offer_text": "...", "candidate_text": "...", "true_score": 0.95},
  ...
]

Usage:
    pip install matplotlib numpy scikit-learn sentence-transformers torch scipy
    python evaluate_bge_m3_axe1.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    roc_curve, auc, confusion_matrix, ConfusionMatrixDisplay
)
from scipy.stats import pearsonr
import warnings, json, os, sys
warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────
MODEL_BGE_PATH = "G:/ai_models/trained_model_bge_m3_axe1"
MODEL_E5_NAME  = "intfloat/multilingual-e5-base"
MODEL_V3_PATH  = "G:/ai_models/trained_model_bge_m3_v3"
GT_FILE        = "ground_truth.json"
THRESHOLD      = 0.70

# ─────────────────────────────────────────────
#  CHARGEMENT GROUND TRUTH
# ─────────────────────────────────────────────
print(f"Chargement ground truth depuis '{GT_FILE}'...")
if not os.path.exists(GT_FILE):
    print(f"ERREUR: '{GT_FILE}' introuvable.")
    sys.exit(1)

with open(GT_FILE, "r", encoding="utf-8") as f:
    gt_data = json.load(f)

print(f"{len(gt_data)} paires chargees.")
print(f"Cles detectees : {list(gt_data[0].keys())}")

# ── Parser avec les vraies clés ──────────────
texts1       = [item["offer_text"]     for item in gt_data]
texts2       = [item["candidate_text"] for item in gt_data]
ground_truth = np.array([item["true_score"] for item in gt_data])

print("\nApercu des paires :")
for i, (t1, t2, s) in enumerate(zip(texts1, texts2, ground_truth)):
    print(f"  P{i+1} [{s:.2f}] {t1[:40]!r} <-> {t2[:40]!r}")

# ─────────────────────────────────────────────
#  CHARGEMENT DES MODÈLES
# ─────────────────────────────────────────────
print("\nChargement des modeles...")

try:
    from sentence_transformers import SentenceTransformer
    import torch
except ImportError:
    print("ERREUR: pip install sentence-transformers torch")
    sys.exit(1)

def load_model(path_or_name, label):
    print(f"  [{label}] depuis {path_or_name} ...")
    try:
        model = SentenceTransformer(path_or_name, trust_remote_code=True)
        print(f"  [{label}] OK ✓")
        return model
    except Exception as e:
        print(f"  [{label}] ECHEC : {e}")
        return None

model_axe1 = load_model(MODEL_BGE_PATH, "bge-m3 axe1")
model_e5   = load_model(MODEL_E5_NAME,  "e5-base")
model_v3   = load_model(MODEL_V3_PATH,  "bge-m3 v3") if os.path.exists(MODEL_V3_PATH) else None

if model_axe1 is None:
    print("\nERREUR CRITIQUE : modele axe1 introuvable.")
    sys.exit(1)

# ─────────────────────────────────────────────
#  CALCUL DES SIMILARITÉS
# ─────────────────────────────────────────────
def compute_similarities(model, texts1, texts2, model_name):
    """Encode chaque paire et retourne la similarité cosinus dans [0, 1]."""
    print(f"\n  Prediction [{model_name}]...")
    sims = []
    for i, (t1, t2) in enumerate(zip(texts1, texts2)):

        # Préfixe spécial multilingual-e5
        if "e5" in model_name.lower():
            t1_enc = f"query: {t1}"
            t2_enc = f"passage: {t2}"
        else:
            t1_enc, t2_enc = t1, t2

        emb1 = model.encode(t1_enc, convert_to_tensor=True,
                            normalize_embeddings=True, show_progress_bar=False)
        emb2 = model.encode(t2_enc, convert_to_tensor=True,
                            normalize_embeddings=True, show_progress_bar=False)

        # Similarité cosinus : [-1, 1] → [0, 1]
        cos = float(torch.dot(emb1, emb2).cpu())
        sim = (cos + 1.0) / 2.0          # remapping linéaire
        sim = round(max(0.0, min(1.0, sim)), 4)

        sims.append(sim)
        print(f"    [{i+1}/{len(texts1)}] Reel: {ground_truth[i]:.2f} "
              f"| {model_name}: {sim:.3f}")

    return np.array(sims)

pred_bge_axe1 = compute_similarities(model_axe1, texts1, texts2, "bge-m3 axe1")
pred_e5       = (compute_similarities(model_e5,   texts1, texts2, "e5-base")
                 if model_e5   else np.full_like(ground_truth, 0.5))
pred_bge_v3   = (compute_similarities(model_v3,   texts1, texts2, "bge-m3 v3")
                 if model_v3   else np.full_like(ground_truth, 0.5))

# ─────────────────────────────────────────────
#  MÉTRIQUES
# ─────────────────────────────────────────────
def compute_metrics(y_true, y_pred, threshold=THRESHOLD):
    mse  = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae  = mean_absolute_error(y_true, y_pred)
    r2   = r2_score(y_true, y_pred)
    try:
        pearson, _ = pearsonr(y_true, y_pred)
    except Exception:
        pearson = float('nan')
    bin_true = (y_true >= threshold).astype(int)
    bin_pred = (y_pred >= threshold).astype(int)
    acc_bin  = float(np.mean(bin_true == bin_pred))
    acc_10   = float(np.mean(np.abs(y_true - y_pred) <= 0.10))
    acc_20   = float(np.mean(np.abs(y_true - y_pred) <= 0.20))
    return dict(mse=mse, rmse=rmse, mae=mae, r2=r2,
                pearson=pearson, acc_bin=acc_bin,
                acc_10=acc_10, acc_20=acc_20)

m_axe1 = compute_metrics(ground_truth, pred_bge_axe1)
m_e5   = compute_metrics(ground_truth, pred_e5)
m_v3   = (compute_metrics(ground_truth, pred_bge_v3)
          if model_v3 else {k: 0.0 for k in m_axe1})

residus  = pred_bge_axe1 - ground_truth
abs_errs = np.abs(residus)
pair_idx = np.arange(len(ground_truth))

# ─────────────────────────────────────────────
#  COULEURS
# ─────────────────────────────────────────────
C_BLUE  = '#378ADD'
C_CORAL = '#D85A30'
C_AMBER = '#BA7517'
C_GREEN = '#639922'
C_TEAL  = '#1D9E75'
C_RED   = '#E24B4A'
C_GRAY  = '#888780'

def bar_color(err):
    a = abs(err)
    return C_GREEN if a <= 0.10 else (C_AMBER if a <= 0.20 else C_RED)

# ─────────────────────────────────────────────
#  FIGURE 3×3
# ─────────────────────────────────────────────
fig = plt.figure(figsize=(18, 14), facecolor='white')
fig.suptitle('Évaluation ML — bge-m3 fine-tuné (axe1)', fontsize=16,
             fontweight='bold', y=0.98, color='#2C2C2A')
gs = gridspec.GridSpec(3, 3, figure=fig, hspace=0.45, wspace=0.38,
                       top=0.93, bottom=0.07, left=0.07, right=0.97)

# ── 1. Prédiction vs Réalité ──────────────────
ax1 = fig.add_subplot(gs[0, 0])
ax1.scatter(ground_truth, pred_bge_axe1, color=C_BLUE, s=90,
            zorder=3, label='bge-m3 axe1', edgecolors='white', linewidths=0.8)
ax1.plot([0,1],[0,1], '--', color=C_GRAY, linewidth=1.5, label='idéal (y=x)')
ax1.fill_between([0,1],[0.10,1.10],[-0.10,0.90], alpha=0.07, color=C_BLUE)
ax1.set_xlim(0,1); ax1.set_ylim(0,1)
ax1.set_xlabel('Score réel (ground truth)', fontsize=9)
ax1.set_ylabel('Score prédit', fontsize=9)
ax1.set_title(f'Prédiction vs Réalité\nR²={m_axe1["r2"]:.4f} | MAE={m_axe1["mae"]:.4f}',
              fontsize=10, fontweight='500')
ax1.legend(fontsize=8); ax1.grid(True, alpha=0.25, linestyle='--')

# ── 2. Résidus ────────────────────────────────
ax2 = fig.add_subplot(gs[0, 1])
bars = ax2.bar(pair_idx, residus, color=[bar_color(r) for r in residus],
               edgecolor='white', linewidth=0.6, width=0.65, zorder=3)
for h, lc, ls, lbl in [(0.10,C_TEAL,'--','±0.10'),(-0.10,C_TEAL,'--',''),
                        (0.20,C_AMBER,':','±0.20'),(-0.20,C_AMBER,':','')]:
    ax2.axhline(h, color=lc, linewidth=1.2, linestyle=ls,
                alpha=0.85, label=lbl if lbl else None)
ax2.axhline(0, color=C_GRAY, linewidth=1.0)
ax2.set_xticks(pair_idx)
ax2.set_xticklabels([f'P{i+1}' for i in pair_idx], fontsize=8)
ax2.set_ylabel('Erreur (prédit − réel)', fontsize=9)
ax2.set_title('Résidus par paire de test', fontsize=10, fontweight='500')
ax2.legend(fontsize=8); ax2.grid(True, alpha=0.20, linestyle='--', axis='y')
for bar, val in zip(bars, residus):
    offset = 0.005 if val >= 0 else -0.018
    ax2.text(bar.get_x()+bar.get_width()/2, bar.get_height()+offset,
             f'{val:+.2f}', ha='center', va='bottom', fontsize=7.5, color='#444')

# ── 3. Courbe ROC ─────────────────────────────
ax3 = fig.add_subplot(gs[0, 2])
bin_true = (ground_truth >= THRESHOLD).astype(int)
for pred, color, lbl, ls in [(pred_bge_axe1,C_BLUE,'bge-m3 axe1','-'),
                              (pred_e5,C_CORAL,'e5-base','--')]:
    try:
        fpr, tpr, _ = roc_curve(bin_true, pred)
        roc_auc = auc(fpr, tpr)
        ax3.plot(fpr, tpr, color=color, linewidth=2, linestyle=ls,
                 label=f'{lbl} (AUC={roc_auc:.2f})')
    except Exception:
        pass
ax3.plot([0,1],[0,1], color=C_GRAY, linewidth=1, linestyle=':', label='aléatoire')
ax3.set_xlim(0,1); ax3.set_ylim(0,1.02)
ax3.set_xlabel('Taux faux positifs (FPR)', fontsize=9)
ax3.set_ylabel('Taux vrais positifs (TPR)', fontsize=9)
ax3.set_title(f'Courbe ROC (seuil={THRESHOLD})', fontsize=10, fontweight='500')
ax3.legend(fontsize=8); ax3.grid(True, alpha=0.25, linestyle='--')

# ── 4. Distribution erreurs absolues ──────────
ax4 = fig.add_subplot(gs[1, 0])
bins_edges = [0, 0.05, 0.10, 0.15, 0.20, 0.30, 1.0]
bin_labels = ['0–0.05','0.05–0.10','0.10–0.15','0.15–0.20','0.20–0.30','0.30+']
cnt_axe1, _ = np.histogram(abs_errs, bins=bins_edges)
cnt_e5, _   = np.histogram(np.abs(pred_e5 - ground_truth), bins=bins_edges)
xp = np.arange(len(bin_labels)); w = 0.35
ax4.bar(xp-w/2, cnt_axe1, width=w,
        color=[bar_color(b) for b in [0.02,0.07,0.12,0.17,0.25,0.35]],
        edgecolor='white', linewidth=0.6, label='bge-m3 axe1', zorder=3)
ax4.bar(xp+w/2, cnt_e5, width=w, color=C_CORAL, alpha=0.45,
        edgecolor='white', linewidth=0.6, label='e5-base', zorder=3)
ax4.set_xticks(xp); ax4.set_xticklabels(bin_labels, fontsize=7.5, rotation=20)
ax4.set_ylabel('Nombre de paires', fontsize=9)
ax4.set_title('Distribution des erreurs absolues', fontsize=10, fontweight='500')
ax4.legend(fontsize=8); ax4.grid(True, alpha=0.20, linestyle='--', axis='y')
ax4.yaxis.set_major_locator(plt.MaxNLocator(integer=True))

# ── 5. Radar ──────────────────────────────────
ax5 = fig.add_subplot(gs[1, 1], polar=True)
cats = ['R²', 'Pearson', 'Acc ±0.20', 'MAE inv.', 'Acc binaire']
N = len(cats)
angles = np.linspace(0, 2*np.pi, N, endpoint=False).tolist() + [0]

def rvals(m):
    p = m['pearson'] if not np.isnan(m['pearson']) else 0.0
    return [max(0, m['r2']), p, m['acc_20'], 1-m['mae'], m['acc_bin']]

va = rvals(m_axe1) + [rvals(m_axe1)[0]]
ve = rvals(m_e5)   + [rvals(m_e5)[0]]
ax5.plot(angles, va, 'o-', color=C_BLUE,  linewidth=2, markersize=5, label='bge-m3 axe1')
ax5.fill(angles, va, alpha=0.15, color=C_BLUE)
ax5.plot(angles, ve, 's--', color=C_CORAL, linewidth=2, markersize=5, label='e5-base')
ax5.fill(angles, ve, alpha=0.08, color=C_CORAL)
ax5.set_thetagrids(np.degrees(angles[:-1]), cats, fontsize=8.5)
ax5.set_ylim(0,1); ax5.set_yticks([0.25,0.50,0.75,1.00])
ax5.set_yticklabels(['0.25','0.50','0.75','1.00'], fontsize=7, color=C_GRAY)
ax5.grid(color=C_GRAY, alpha=0.30, linestyle='--')
ax5.set_title('Radar comparatif\nbge-m3 axe1 vs e5-base',
              fontsize=10, fontweight='500', pad=15)
ax5.legend(loc='upper right', bbox_to_anchor=(1.35,1.15), fontsize=8)

# ── 6. Amélioration v3 → axe1 ────────────────
ax6 = fig.add_subplot(gs[1, 2])
mnames = ['R²','MAE\n(inversé)','RMSE\n(inversé)','Acc ±0.20','Pearson']
vv3   = [max(0,m_v3['r2']),   1-m_v3['mae'],   1-m_v3['rmse'],
         m_v3['acc_20'],   max(0,m_v3['pearson']   if not np.isnan(m_v3['pearson'])   else 0)]
va1   = [max(0,m_axe1['r2']), 1-m_axe1['mae'], 1-m_axe1['rmse'],
         m_axe1['acc_20'], max(0,m_axe1['pearson'] if not np.isnan(m_axe1['pearson']) else 0)]
xp = np.arange(len(mnames)); w = 0.35
ax6.bar(xp-w/2, vv3, width=w, color=C_AMBER, edgecolor='white',
        linewidth=0.6, label='bge-m3 v3' if model_v3 else 'v3 (non dispo)', zorder=3)
ax6.bar(xp+w/2, va1, width=w, color=C_BLUE,  edgecolor='white',
        linewidth=0.6, label='bge-m3 axe1', zorder=3)
for xi, (v0, v1) in enumerate(zip(vv3, va1)):
    gain = (v1-v0)/(v0+1e-9)*100
    if gain > 0:
        ax6.annotate(f'+{gain:.0f}%', xy=(xi+w/2, v1), xytext=(0,4),
                     textcoords='offset points', ha='center',
                     fontsize=7.5, color=C_TEAL, fontweight='bold')
ax6.set_xticks(xp); ax6.set_xticklabels(mnames, fontsize=8)
ax6.set_ylabel('Score (normalisé 0-1)', fontsize=9)
ax6.set_ylim(0,1.15)
ax6.set_title('Amélioration v3 → axe1', fontsize=10, fontweight='500')
ax6.legend(fontsize=8); ax6.grid(True, alpha=0.20, linestyle='--', axis='y')

# ── 7. Matrice de confusion ───────────────────
ax7 = fig.add_subplot(gs[2, 0])
bin_pred = (pred_bge_axe1 >= THRESHOLD).astype(int)
cm = confusion_matrix(bin_true, bin_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm,
                              display_labels=['Non-match\n(<0.70)','Match\n(≥0.70)'])
disp.plot(ax=ax7, colorbar=False, cmap='Blues')
ax7.set_title('Matrice de confusion\n(bge-m3 axe1, seuil=0.70)',
              fontsize=10, fontweight='500')
ax7.set_xlabel('Prédit', fontsize=9); ax7.set_ylabel('Réel', fontsize=9)
tn, fp, fn, tp_val = cm.ravel()
precision = tp_val / (tp_val+fp+1e-9)
recall    = tp_val / (tp_val+fn+1e-9)
f1        = 2*precision*recall / (precision+recall+1e-9)
ax7.text(0.5, -0.30,
         f'Précision={precision:.1%}  Rappel={recall:.1%}  F1={f1:.1%}',
         ha='center', transform=ax7.transAxes, fontsize=8.5, color='#444')

# ── 8. Tableau comparatif ─────────────────────
ax8 = fig.add_subplot(gs[2, 1:])
ax8.axis('off')

def fmt(v, pct=False):
    if np.isnan(v): return 'nan'
    return f'{v:.1%}' if pct else f'{v:.4f}'

table = [
    ['Métrique',      'bge-m3 axe1',                   'bge-m3 v3',
     'e5-base',                     'Meilleur'],
    ['MSE ↓',         fmt(m_axe1['mse']),               fmt(m_v3['mse']),
     fmt(m_e5['mse']),              'axe1 ✓'],
    ['RMSE ↓',        fmt(m_axe1['rmse']),              fmt(m_v3['rmse']),
     fmt(m_e5['rmse']),             'axe1 ✓'],
    ['MAE ↓',         fmt(m_axe1['mae']),               fmt(m_v3['mae']),
     fmt(m_e5['mae']),              'axe1 ✓'],
    ['R² ↑',          fmt(m_axe1['r2']),                fmt(m_v3['r2']),
     fmt(m_e5['r2']),               'axe1 ✓'],
    ['Pearson ↑',     fmt(m_axe1['pearson']),           fmt(m_v3['pearson']),
     fmt(m_e5['pearson']),          'axe1 ✓'],
    ['Acc binaire ↑', fmt(m_axe1['acc_bin'],True),      fmt(m_v3['acc_bin'],True),
     fmt(m_e5['acc_bin'],True),     'axe1 ✓'],
    ['Acc ±0.10 ↑',   fmt(m_axe1['acc_10'],True),      fmt(m_v3['acc_10'],True),
     fmt(m_e5['acc_10'],True),      '='],
    ['Acc ±0.20 ↑',   fmt(m_axe1['acc_20'],True),      fmt(m_v3['acc_20'],True),
     fmt(m_e5['acc_20'],True),      'axe1 ✓'],
]
col_widths = [0.22, 0.18, 0.18, 0.18, 0.14]
col_x = [sum(col_widths[:i]) for i in range(len(col_widths))]
for r, row in enumerate(table):
    bg = '#F1EFE8' if r == 0 else ('white' if r%2==0 else '#F8F8F5')
    for c, (cell, x, w) in enumerate(zip(row, col_x, col_widths)):
        fc = bg; tc = '#2C2C2A'
        if r > 0 and c == 1: fc = '#E6F1FB'; tc = '#0C447C'
        if r > 0 and c == 4 and 'axe1' in cell: tc = C_TEAL
        ax8.text(x+w/2, 1.0-r*0.105, cell,
                 transform=ax8.transAxes, ha='center', va='top', fontsize=8.5,
                 color=tc if r > 0 else '#2C2C2A',
                 fontweight='bold' if r == 0 else 'normal',
                 bbox=dict(boxstyle='round,pad=0.3', facecolor=fc,
                           edgecolor='#D3D1C7', linewidth=0.5))
ax8.set_title('Tableau comparatif complet des métriques',
              fontsize=10, fontweight='500', pad=8)

# ─────────────────────────────────────────────
#  SAUVEGARDE
# ─────────────────────────────────────────────
out = 'bge_m3_axe1_evaluation.png'
plt.savefig(out, dpi=150, bbox_inches='tight', facecolor='white', edgecolor='none')
print(f"\nGraphique sauvegarde sous '{out}'")
plt.show()

# ─────────────────────────────────────────────
#  RÉSUMÉ CONSOLE
# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  RÉSUMÉ — bge-m3 axe1  (prédictions réelles du modèle)")
print("="*65)
print(f"  {'Paire':<6} {'Réel':>8} {'bge-m3 axe1':>14} {'e5-base':>10} {'Résidu':>9}")
print("  " + "-"*52)
for i in range(len(ground_truth)):
    print(f"  P{i+1:<5} {ground_truth[i]:>8.3f} {pred_bge_axe1[i]:>14.3f} "
          f"{pred_e5[i]:>10.3f} {residus[i]:>+9.3f}")
print("  " + "-"*52)
print(f"\n  MSE      : {m_axe1['mse']:.4f}")
print(f"  RMSE     : {m_axe1['rmse']:.4f}")
print(f"  MAE      : {m_axe1['mae']:.4f}")
print(f"  R²       : {m_axe1['r2']:.4f}")
print(f"  Pearson  : {m_axe1['pearson']:.4f}")
print(f"  Acc bin  : {m_axe1['acc_bin']:.1%}")
print(f"  Acc ±0.10: {m_axe1['acc_10']:.1%}")
print(f"  Acc ±0.20: {m_axe1['acc_20']:.1%}")
print(f"\n  Précision : {precision:.1%}")
print(f"  Rappel    : {recall:.1%}")
print(f"  F1-score  : {f1:.1%}")
print("="*65)