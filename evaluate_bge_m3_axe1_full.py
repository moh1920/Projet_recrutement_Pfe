"""
Évaluation complète — bge-m3 fine-tuné (axe1)
Graphiques : ROC Curve, Learning Curve, Confusion Matrix, Accuracy, AUC

Dépendances :
    pip install matplotlib numpy scikit-learn sentence-transformers torch scipy tqdm

Usage :
    python evaluate_bge_m3_axe1_full.py
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.patches as mpatches
from sklearn.metrics import (
    roc_curve, auc,
    confusion_matrix, ConfusionMatrixDisplay,
    accuracy_score, precision_score, recall_score, f1_score,
    mean_absolute_error
)
from sklearn.model_selection import StratifiedKFold
from scipy.stats import pearsonr
import warnings, json, os, sys
from tqdm import tqdm
warnings.filterwarnings("ignore")

# ═══════════════════════════════════════════════════════
#  CONFIGURATION
# ═══════════════════════════════════════════════════════
MODEL_PATH  = "G:/ai_models/trained_model_bge_m3_axe1_v4"
GT_FILE     = "test_data.json"
THRESHOLD   = 0.70
OUTPUT_PNG  = "bge_m3_axe1_full_evaluation.png"
N_CV_FOLDS  = 5          # pour la learning curve (cross-val simulée)

# ═══════════════════════════════════════════════════════
#  1. CHARGEMENT GROUND TRUTH
# ═══════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("  CHARGEMENT DONNÉES")
print(f"{'='*60}")

if not os.path.exists(GT_FILE):
    print(f"ERREUR : '{GT_FILE}' introuvable.")
    sys.exit(1)

with open(GT_FILE, "r", encoding="utf-8") as f:
    gt_data = json.load(f)

texts1       = [item["offer_text"]     for item in gt_data]
texts2       = [item["candidate_text"] for item in gt_data]
ground_truth = np.array([item["score"] for item in gt_data])
n_samples    = len(ground_truth)

print(f"  {n_samples} paires chargées.")
print(f"  Distribution scores : min={ground_truth.min():.2f} "
      f"max={ground_truth.max():.2f} mean={ground_truth.mean():.2f}")

# ═══════════════════════════════════════════════════════
#  2. CHARGEMENT MODÈLE
# ═══════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("  CHARGEMENT MODÈLE")
print(f"{'='*60}")

try:
    from sentence_transformers import SentenceTransformer
    import torch
except ImportError:
    print("ERREUR : pip install sentence-transformers torch")
    sys.exit(1)

print(f"  Chargement depuis : {MODEL_PATH}")
try:
    model = SentenceTransformer(MODEL_PATH, trust_remote_code=True)
    print("  Modèle chargé ✓")
except Exception as e:
    print(f"  ERREUR chargement modèle : {e}")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
#  3. CALCUL SIMILARITÉS
# ═══════════════════════════════════════════════════════
def cosine_sim(model, t1, t2):
    """Retourne la similarité cosinus remappée dans [0, 1]."""
    e1 = model.encode(t1, convert_to_tensor=True,
                      normalize_embeddings=True, show_progress_bar=False)
    e2 = model.encode(t2, convert_to_tensor=True,
                      normalize_embeddings=True, show_progress_bar=False)
    cos = float(torch.dot(e1, e2).cpu())
    return round(max(0.0, min(1.0, (cos + 1.0) / 2.0)), 4)

print(f"\n{'='*60}")
print("  PRÉDICTIONS")
print(f"{'='*60}")

predictions = []
for i, (t1, t2) in enumerate(tqdm(zip(texts1, texts2),
                                   total=n_samples, desc="  Encodage")):
    sim = cosine_sim(model, t1, t2)
    predictions.append(sim)
    print(f"  P{i+1:02d} | réel={ground_truth[i]:.3f} | prédit={sim:.3f} "
          f"| erreur={sim - ground_truth[i]:+.3f}")

predictions  = np.array(predictions)
bin_true     = (ground_truth  >= THRESHOLD).astype(int)
bin_pred     = (predictions   >= THRESHOLD).astype(int)
residuals    = predictions - ground_truth

# ═══════════════════════════════════════════════════════
#  4. MÉTRIQUES GLOBALES
# ═══════════════════════════════════════════════════════
acc_bin  = accuracy_score(bin_true, bin_pred)
acc_10   = float(np.mean(np.abs(residuals) <= 0.10))
acc_20   = float(np.mean(np.abs(residuals) <= 0.20))
prec     = precision_score(bin_true, bin_pred, zero_division=0)
rec      = recall_score(bin_true, bin_pred, zero_division=0)
f1       = f1_score(bin_true, bin_pred, zero_division=0)
mae      = mean_absolute_error(ground_truth, predictions)
pearson, _ = pearsonr(ground_truth, predictions)

fpr, tpr, thresholds_roc = roc_curve(bin_true, predictions)
roc_auc  = auc(fpr, tpr)

# ═══════════════════════════════════════════════════════
#  5. LEARNING CURVE (simulée par sous-échantillonnage)
#     — approche adaptée à un petit dataset sans re-training
# ═══════════════════════════════════════════════════════
# On simule la "learning curve" en calculant l'accuracy binaire
# sur des sous-ensembles croissants du dataset (bootstrapped).
train_sizes  = np.linspace(0.2, 1.0, 8)
lc_train_acc = []
lc_val_acc   = []

rng = np.random.default_rng(42)
for frac in train_sizes:
    n_sub = max(2, int(frac * n_samples))
    idx   = rng.choice(n_samples, n_sub, replace=False)
    # "train" = subset accuracy
    lc_train_acc.append(accuracy_score(bin_true[idx], bin_pred[idx]))
    # "val" = complementary subset (or all if frac=1)
    idx_val = np.setdiff1d(np.arange(n_samples), idx)
    if len(idx_val) == 0:
        lc_val_acc.append(accuracy_score(bin_true, bin_pred))
    else:
        lc_val_acc.append(accuracy_score(bin_true[idx_val],
                                          bin_pred[idx_val]))

lc_train_acc = np.array(lc_train_acc)
lc_val_acc   = np.array(lc_val_acc)
train_sizes_n = (train_sizes * n_samples).astype(int)

# ═══════════════════════════════════════════════════════
#  6. FIGURE PRINCIPALE
# ═══════════════════════════════════════════════════════
DARK_BG   = '#0F1117'
CARD_BG   = '#1A1D27'
BORDER    = '#2A2D3E'
C_BLUE    = '#4F8EF7'
C_TEAL    = '#2DD4BF'
C_CORAL   = '#FF6B6B'
C_AMBER   = '#F59E0B'
C_GREEN   = '#22C55E'
C_PURPLE  = '#A78BFA'
C_GRAY    = '#6B7280'
C_WHITE   = '#F1F5F9'
C_LIGHT   = '#94A3B8'

plt.rcParams.update({
    'figure.facecolor': DARK_BG,
    'axes.facecolor':   CARD_BG,
    'axes.edgecolor':   BORDER,
    'axes.labelcolor':  C_LIGHT,
    'xtick.color':      C_LIGHT,
    'ytick.color':      C_LIGHT,
    'text.color':       C_WHITE,
    'grid.color':       BORDER,
    'grid.linestyle':   '--',
    'grid.alpha':       0.5,
    'font.family':      'DejaVu Sans',
})

fig = plt.figure(figsize=(20, 16), facecolor=DARK_BG)
fig.suptitle('Évaluation Complète — bge-m3 fine-tuné (axe1)',
             fontsize=18, fontweight='bold', color=C_WHITE,
             y=0.98, x=0.5)

gs = gridspec.GridSpec(3, 3, figure=fig,
                       hspace=0.50, wspace=0.38,
                       top=0.93, bottom=0.06,
                       left=0.07, right=0.97)

# ─── Helpers ─────────────────────────────────────────
def style_ax(ax, title, xlabel='', ylabel=''):
    ax.set_facecolor(CARD_BG)
    for spine in ax.spines.values():
        spine.set_edgecolor(BORDER)
    ax.set_title(title, fontsize=11, fontweight='bold',
                 color=C_WHITE, pad=10)
    if xlabel: ax.set_xlabel(xlabel, fontsize=9, color=C_LIGHT)
    if ylabel: ax.set_ylabel(ylabel, fontsize=9, color=C_LIGHT)
    ax.grid(True, alpha=0.25)

# ─── PANNEAU 1 : ROC CURVE ────────────────────────────
ax1 = fig.add_subplot(gs[0, 0])
ax1.plot(fpr, tpr, color=C_BLUE, linewidth=2.5,
         label=f'bge-m3 axe1 (AUC = {roc_auc:.3f})', zorder=4)
ax1.fill_between(fpr, tpr, alpha=0.15, color=C_BLUE)
ax1.plot([0,1],[0,1], '--', color=C_GRAY, linewidth=1.2, label='Aléatoire (AUC=0.50)')
ax1.set_xlim(0, 1); ax1.set_ylim(0, 1.02)
style_ax(ax1, f'ROC Curve  |  AUC = {roc_auc:.3f}',
         'Taux faux positifs (FPR)', 'Taux vrais positifs (TPR)')
ax1.legend(fontsize=8, facecolor=DARK_BG, edgecolor=BORDER)

# Annotation AUC
ax1.annotate(f'AUC={roc_auc:.3f}', xy=(0.5, 0.5),
             fontsize=12, fontweight='bold', color=C_TEAL,
             ha='center', va='center',
             bbox=dict(boxstyle='round,pad=0.4', facecolor=DARK_BG,
                       edgecolor=C_TEAL, linewidth=1.5))

# ─── PANNEAU 2 : LEARNING CURVE ──────────────────────
ax2 = fig.add_subplot(gs[0, 1])
ax2.plot(train_sizes_n, lc_train_acc, 'o-', color=C_TEAL,
         linewidth=2, markersize=7, label='Accuracy (subset train)')
ax2.plot(train_sizes_n, lc_val_acc, 's--', color=C_CORAL,
         linewidth=2, markersize=7, label='Accuracy (subset val)')
ax2.fill_between(train_sizes_n, lc_train_acc, lc_val_acc,
                 alpha=0.10, color=C_AMBER)
ax2.set_xlim(0, n_samples + 1)
ax2.set_ylim(0, 1.1)
style_ax(ax2, 'Learning Curve (Accuracy binaire)',
         "Nombre d'échantillons utilisés", 'Accuracy')
ax2.legend(fontsize=8, facecolor=DARK_BG, edgecolor=BORDER)
ax2.axhline(acc_bin, color=C_AMBER, linestyle=':', linewidth=1.2,
            label=f'Acc globale={acc_bin:.1%}')

# ─── PANNEAU 3 : CONFUSION MATRIX ────────────────────
ax3 = fig.add_subplot(gs[0, 2])
cm = confusion_matrix(bin_true, bin_pred)
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=['Non-match\n(<0.70)', 'Match\n(≥0.70)']
)
disp.plot(ax=ax3, colorbar=False, cmap='Blues')
ax3.set_title('Confusion Matrix  (seuil=0.70)',
              fontsize=11, fontweight='bold', color=C_WHITE, pad=10)
ax3.set_xlabel('Prédit', fontsize=9, color=C_LIGHT)
ax3.set_ylabel('Réel', fontsize=9, color=C_LIGHT)
ax3.tick_params(colors=C_LIGHT)
tn, fp, fn, tp_v = cm.ravel()
ax3.text(0.5, -0.22,
         f'TN={tn}  FP={fp}  FN={fn}  TP={tp_v}',
         ha='center', transform=ax3.transAxes,
         fontsize=8.5, color=C_LIGHT)

# ─── PANNEAU 4 : ACCURACY COMPARAISON ────────────────
ax4 = fig.add_subplot(gs[1, 0])
labels_acc = ['Acc\nbinaire\n(seuil 0.70)', 'Acc\n±0.10', 'Acc\n±0.20',
              'Précision', 'Rappel', 'F1-score']
values_acc = [acc_bin, acc_10, acc_20, prec, rec, f1]
colors_acc = [C_BLUE, C_TEAL, C_GREEN, C_PURPLE, C_AMBER, C_CORAL]
bars = ax4.bar(labels_acc, values_acc, color=colors_acc,
               edgecolor=DARK_BG, linewidth=0.8, zorder=3, width=0.6)
for bar, val in zip(bars, values_acc):
    ax4.text(bar.get_x() + bar.get_width()/2,
             bar.get_height() + 0.02,
             f'{val:.1%}', ha='center', va='bottom',
             fontsize=9, fontweight='bold', color=C_WHITE)
ax4.set_ylim(0, 1.20)
ax4.axhline(0.70, color=C_GRAY, linestyle='--', linewidth=1, alpha=0.6)
style_ax(ax4, 'Accuracy & Métriques de Classification',
         '', 'Score')

# ─── PANNEAU 5 : AUC vs SEUILS ───────────────────────
ax5 = fig.add_subplot(gs[1, 1])
# Calculer l'AUC pour différents seuils de binarisation
thresh_list = np.arange(0.30, 0.90, 0.05)
auc_list    = []
acc_list    = []
for thr in thresh_list:
    bt = (ground_truth >= thr).astype(int)
    bp = (predictions  >= thr).astype(int)
    try:
        fpr_t, tpr_t, _ = roc_curve(bt, predictions)
        auc_list.append(auc(fpr_t, tpr_t))
    except Exception:
        auc_list.append(0.5)
    acc_list.append(accuracy_score(bt, bp))

ax5.plot(thresh_list, auc_list, 'o-', color=C_BLUE,
         linewidth=2, markersize=6, label='AUC')
ax5.plot(thresh_list, acc_list, 's--', color=C_TEAL,
         linewidth=2, markersize=6, label='Accuracy')
ax5.axvline(THRESHOLD, color=C_AMBER, linestyle=':', linewidth=1.5,
            label=f'Seuil actuel ({THRESHOLD})')
ax5.set_xlim(0.25, 0.95); ax5.set_ylim(0, 1.10)
style_ax(ax5, 'AUC & Accuracy selon le Seuil',
         'Seuil de classification', 'Score')
ax5.legend(fontsize=8, facecolor=DARK_BG, edgecolor=BORDER)

# ─── PANNEAU 6 : RÉSIDUS (prédiction vs réalité) ─────
ax6 = fig.add_subplot(gs[1, 2])
pair_idx = np.arange(n_samples)
bar_cols = [C_GREEN if abs(r) <= 0.10 else
            (C_AMBER if abs(r) <= 0.20 else C_CORAL)
            for r in residuals]
bars6 = ax6.bar(pair_idx, residuals, color=bar_cols,
                edgecolor=DARK_BG, linewidth=0.6, width=0.65, zorder=3)
for thr_v, col, lbl in [(0.10, C_TEAL, '±0.10'), (-0.10, C_TEAL, ''),
                         (0.20, C_AMBER, '±0.20'), (-0.20, C_AMBER, '')]:
    ax6.axhline(thr_v, color=col, linewidth=1.2, linestyle='--',
                alpha=0.8, label=lbl if lbl else None)
ax6.axhline(0, color=C_GRAY, linewidth=1.0)
ax6.set_xticks(pair_idx)
ax6.set_xticklabels([f'P{i+1}' for i in pair_idx], fontsize=8)
for bar, val in zip(bars6, residuals):
    offset = 0.005 if val >= 0 else -0.022
    ax6.text(bar.get_x() + bar.get_width()/2,
             bar.get_height() + offset,
             f'{val:+.2f}', ha='center', va='bottom',
             fontsize=7.5, color=C_WHITE)
style_ax(ax6, 'Résidus par paire  (prédit − réel)',
         'Paire de test', 'Erreur')
p_green = mpatches.Patch(color=C_GREEN, label='≤ ±0.10')
p_amber = mpatches.Patch(color=C_AMBER, label='≤ ±0.20')
p_coral = mpatches.Patch(color=C_CORAL, label='> ±0.20')
ax6.legend(handles=[p_green, p_amber, p_coral],
           fontsize=8, facecolor=DARK_BG, edgecolor=BORDER)

# ─── PANNEAU 7 : SCORE RÉEL vs PRÉDIT ────────────────
ax7 = fig.add_subplot(gs[2, 0])
sc = ax7.scatter(ground_truth, predictions,
                 c=np.abs(residuals), cmap='RdYlGn_r',
                 vmin=0, vmax=0.5, s=100, zorder=4,
                 edgecolors=C_WHITE, linewidths=0.6)
ax7.plot([0,1],[0,1], '--', color=C_GRAY, linewidth=1.5, label='Idéal (y=x)')
ax7.fill_between([0,1],[0.10,1.10],[-0.10,0.90],
                 alpha=0.08, color=C_BLUE)
for i, (xt, xp) in enumerate(zip(ground_truth, predictions)):
    ax7.annotate(f'P{i+1}', (xt, xp),
                 fontsize=6.5, color=C_LIGHT,
                 xytext=(4, 4), textcoords='offset points')
cbar = plt.colorbar(sc, ax=ax7, fraction=0.046, pad=0.04)
cbar.set_label('|Erreur|', fontsize=8, color=C_LIGHT)
cbar.ax.yaxis.set_tick_params(color=C_LIGHT)
plt.setp(cbar.ax.yaxis.get_ticklabels(), color=C_LIGHT)
ax7.set_xlim(0,1); ax7.set_ylim(0,1)
style_ax(ax7, f'Score Réel vs Prédit\nPearson={pearson:.4f}  MAE={mae:.4f}',
         'Score réel (ground truth)', 'Score prédit')
ax7.legend(fontsize=8, facecolor=DARK_BG, edgecolor=BORDER)

# ─── PANNEAU 8 : DISTRIBUTION SCORES ─────────────────
ax8 = fig.add_subplot(gs[2, 1])
bins = np.linspace(0, 1, 15)
ax8.hist(ground_truth, bins=bins, alpha=0.6, color=C_TEAL,
         label='Ground truth', edgecolor=DARK_BG, zorder=3)
ax8.hist(predictions, bins=bins, alpha=0.6, color=C_CORAL,
         label='Prédictions', edgecolor=DARK_BG, zorder=3)
ax8.axvline(THRESHOLD, color=C_AMBER, linestyle='--',
            linewidth=1.5, label=f'Seuil {THRESHOLD}')
style_ax(ax8, 'Distribution des Scores',
         'Score de similarité', 'Nombre de paires')
ax8.legend(fontsize=8, facecolor=DARK_BG, edgecolor=BORDER)

# ─── PANNEAU 9 : TABLEAU RÉSUMÉ ──────────────────────
ax9 = fig.add_subplot(gs[2, 2])
ax9.set_facecolor(CARD_BG)
ax9.axis('off')
ax9.set_title('Récapitulatif des Métriques',
              fontsize=11, fontweight='bold', color=C_WHITE, pad=10)

summary = [
    ('Métrique',        'Valeur',   ''),
    ('AUC (ROC)',       f'{roc_auc:.4f}',  C_BLUE),
    ('Accuracy binaire',f'{acc_bin:.1%}',  C_TEAL),
    ('Accuracy ±0.10',  f'{acc_10:.1%}',   C_AMBER),
    ('Accuracy ±0.20',  f'{acc_20:.1%}',   C_AMBER),
    ('Précision',       f'{prec:.1%}',     C_GREEN),
    ('Rappel',          f'{rec:.1%}',      C_GREEN),
    ('F1-score',        f'{f1:.1%}',       C_CORAL),
    ('MAE',             f'{mae:.4f}',      C_GRAY),
    ('Pearson r',       f'{pearson:.4f}',  C_PURPLE),
    ('Seuil utilisé',   f'{THRESHOLD}',    C_AMBER),
]

for i, (metric, value, color) in enumerate(summary):
    y_pos = 0.95 - i * 0.085
    is_header = (i == 0)
    fw = 'bold'
    tc_metric = C_LIGHT if not is_header else C_WHITE
    tc_value  = color   if not is_header else C_WHITE

    ax9.text(0.05, y_pos, metric,
             transform=ax9.transAxes, ha='left', va='top',
             fontsize=9, fontweight=fw, color=tc_metric)
    ax9.text(0.95, y_pos, value,
             transform=ax9.transAxes, ha='right', va='top',
             fontsize=9, fontweight='bold', color=tc_value)

    if not is_header:
        line_y = y_pos - 0.045
        ax9.plot([0.02, 0.98], [line_y, line_y],
                 color=BORDER, linewidth=0.5,
                 transform=ax9.transAxes, clip_on=False)

# ═══════════════════════════════════════════════════════
#  7. SAUVEGARDE
# ═══════════════════════════════════════════════════════
plt.savefig(OUTPUT_PNG, dpi=150, bbox_inches='tight',
            facecolor=DARK_BG, edgecolor='none')
print(f"\n  Graphique sauvegardé → '{OUTPUT_PNG}'")
plt.show()

# ═══════════════════════════════════════════════════════
#  8. RÉSUMÉ CONSOLE
# ═══════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("  RÉSUMÉ COMPLET — bge-m3 fine-tuné (axe1)")
print(f"{'='*60}")
print(f"  Paires évaluées     : {n_samples}")
print(f"  Seuil classification: {THRESHOLD}")
print()
print(f"  ── ROC & AUC ──────────────────────────────")
print(f"  AUC                 : {roc_auc:.4f}")
print()
print(f"  ── Accuracy ────────────────────────────────")
print(f"  Accuracy binaire    : {acc_bin:.1%}")
print(f"  Accuracy ±0.10      : {acc_10:.1%}")
print(f"  Accuracy ±0.20      : {acc_20:.1%}")
print()
print(f"  ── Classification ──────────────────────────")
print(f"  Précision           : {prec:.1%}")
print(f"  Rappel              : {rec:.1%}")
print(f"  F1-score            : {f1:.1%}")
print()
print(f"  ── Régression ──────────────────────────────")
print(f"  MAE                 : {mae:.4f}")
print(f"  Pearson r           : {pearson:.4f}")
print()
print(f"  ── Matrice de confusion ────────────────────")
print(f"  TN={tn}  FP={fp}  FN={fn}  TP={tp_v}")
print(f"{'='*60}")

print(f"\n  {'Paire':<6} {'Réel':>8} {'Prédit':>10} {'Erreur':>10} {'Statut':>12}")
print(f"  {'-'*50}")
for i in range(n_samples):
    err = residuals[i]
    status = '✓ ≤0.10' if abs(err)<=0.10 else ('~ ≤0.20' if abs(err)<=0.20 else '✗ >0.20')
    print(f"  P{i+1:<5} {ground_truth[i]:>8.3f} {predictions[i]:>10.3f} "
          f"{err:>+10.3f} {status:>12}")
print(f"{'='*60}\n")