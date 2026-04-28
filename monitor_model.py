"""
=============================================================================
  SCRIPT DE MONITORING — Modèle HR Matching bge-m3 fine-tuné
=============================================================================
Génère 8 graphiques de monitoring organisés en 2 figures :

  Figure 1 — Entraînement & Qualité sémantique
    1. Courbes de convergence (Pearson / Spearman par epoch)
    2. Loss d'entraînement estimée par epoch
    3. Scatter : scores prédits vs réels (bge-m3)
    4. Distribution des erreurs de prédiction

  Figure 2 — Comparaison & Analyse métier
    5. Radar : comparaison multi-métriques bge-m3 vs e5-base
    6. Barres groupées : métriques clés côte à côte
    7. Heatmap de confusion binaire (seuil 0.70)
    8. Profil de scores par catégorie métier

Usage :
  pip install matplotlib seaborn numpy scikit-learn
  python monitor_model.py

  # Avec vos données réelles :
  python monitor_model.py --model_path G:/ai_models/trained_model_bge_m3 \
                          --test_data  test_data.json \
                          --out_dir    ./monitoring_output
=============================================================================
"""

import os
import json
import argparse
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score, confusion_matrix
)
from scipy.stats import pearsonr, spearmanr

# ── Style global ─────────────────────────────────────────────────────────────
plt.rcParams.update({
    "figure.facecolor": "#FAFAFA",
    "axes.facecolor":   "#FFFFFF",
    "axes.grid":        True,
    "grid.alpha":       0.3,
    "grid.linestyle":   "--",
    "axes.spines.top":  False,
    "axes.spines.right":False,
    "font.family":      "DejaVu Sans",
    "axes.titlesize":   12,
    "axes.titleweight": "bold",
    "axes.labelsize":   10,
    "xtick.labelsize":  9,
    "ytick.labelsize":  9,
})

COLOR_BGE  = "#185FA5"   # bleu — bge-m3
COLOR_E5   = "#9FE1CB"   # vert clair — e5-base
COLOR_OK   = "#3B6D11"   # vert foncé — correct
COLOR_KO   = "#A32D2D"   # rouge — incorrect
COLOR_WARN = "#BA7517"   # ambre — à vérifier
COLOR_GRAY = "#B4B2A9"


# ─────────────────────────────────────────────────────────────────────────────
# DONNÉES INTÉGRÉES (issues de votre log d'entraînement + evaluate_accuracy.py)
# Remplacez ces valeurs si vous relancez l'entraînement ou l'évaluation.
# ─────────────────────────────────────────────────────────────────────────────
TRAIN_LOG = {
    # (epoch, pearson, spearman) — valeurs issues du log console
    "epochs":   [1.0, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 7.5, 8.0, 9.0, 10.0],
    "pearson":  [0.8674, 0.8901, 0.8936, 0.9030, 0.9161, 0.9198, 0.9212, 0.9213,
                 0.9212, 0.9212, 0.9210, 0.9190],
    "spearman": [0.8051, 0.8375, 0.8397, 0.8624, 0.8721, 0.8613, 0.8584, 0.8584,
                 0.8584, 0.8584, 0.8584, 0.8573],
    # Loss MNR décroissante (approximée depuis train_loss final = 0.1539)
    "loss":     [0.420, 0.350, 0.310, 0.270, 0.230, 0.205, 0.188, 0.175,
                 0.168, 0.163, 0.158, 0.154],
}

# Paires test (evaluate_accuracy.py) — [reel, bge-m3, e5]
EVAL_PAIRS = {
    "reels":  [0.95, 0.05, 0.93, 0.01, 0.92, 0.02, 0.60, 0.55],
    "bge":    [0.681, 0.127, 0.872, 0.160, 0.876, 0.191, 0.616, 0.469],
    "e5":     [0.881, 0.815, 0.912, 0.817, 0.896, 0.802, 0.843, 0.881],
    "labels": [
        "Dev React\n(positif)",
        "Dev/Comptable\n(négatif)",
        "Data Sci\n(positif)",
        "Data/Infirmier\n(négatif)",
        "DevOps\n(positif)",
        "DevOps/Design\n(négatif)",
        "Chef projet\n(partiel)",
        "Data Sci\n(partiel)",
    ],
    "categories": ["positif", "négatif", "positif", "négatif",
                   "positif", "négatif", "partiel", "partiel"],
}

# Métriques finales (evaluate_accuracy.py)
METRICS = {
    "bge": {
        "MSE":      0.0178,
        "RMSE":     0.1333,
        "MAE":      0.1084,
        "R2":       0.8862,
        "Pearson":  0.9701,
        "Acc_bin":  87.5,
        "Acc_10":   62.5,
        "Acc_20":   87.5,
    },
    "e5": {
        "MSE":      0.2528,
        "RMSE":     0.5028,
        "MAE":      0.3800,
        "R2":      -0.6190,
        "Pearson":  0.9336,
        "Acc_bin":  37.5,
        "Acc_10":   37.5,
        "Acc_20":   37.5,
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# UTILITAIRES
# ─────────────────────────────────────────────────────────────────────────────
def load_test_data(path):
    """Charge un fichier test_data.json et retourne (réels, bge_preds) si le modèle est dispo."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    reels = [float(d["score"]) for d in data]
    return reels


def annotate_bar(ax, bars, fmt="{:.2f}", offset=0.01):
    """Ajoute les valeurs au-dessus des barres."""
    for bar in bars:
        h = bar.get_height()
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            h + offset,
            fmt.format(h),
            ha="center", va="bottom", fontsize=8, color="#444"
        )


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUE 1 — Courbes de convergence Pearson / Spearman
# ─────────────────────────────────────────────────────────────────────────────
def plot_convergence(ax):
    """
    Montre comment les métriques d'évaluation évoluent epoch par epoch.
    Permet de détecter :
      - La vitesse de convergence
      - L'epoch optimale (pic avant plateau ou régression)
      - L'overfitting (divergence entre Pearson et Spearman)
    """
    epochs  = TRAIN_LOG["epochs"]
    pearson = TRAIN_LOG["pearson"]
    spear   = TRAIN_LOG["spearman"]

    # Trouver le meilleur point
    best_idx = int(np.argmax(pearson))

    ax.plot(epochs, pearson, "o-", color=COLOR_BGE, lw=2, ms=5, label="Pearson")
    ax.plot(epochs, spear,   "s--",color=COLOR_OK,  lw=2, ms=5, label="Spearman")

    # Annotation du meilleur epoch
    ax.axvline(epochs[best_idx], color=COLOR_WARN, lw=1.2, ls=":", alpha=0.8)
    ax.annotate(
        f"Meilleur\nPearson={pearson[best_idx]:.4f}\nEpoch {epochs[best_idx]}",
        xy=(epochs[best_idx], pearson[best_idx]),
        xytext=(epochs[best_idx] + 0.8, pearson[best_idx] - 0.012),
        fontsize=8, color=COLOR_WARN,
        arrowprops=dict(arrowstyle="->", color=COLOR_WARN, lw=1),
    )

    ax.fill_between(epochs, pearson, spear, alpha=0.08, color=COLOR_BGE)
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Corrélation")
    ax.set_ylim(0.78, 0.96)
    ax.set_title("1 · Convergence — Pearson & Spearman par epoch")
    ax.legend(fontsize=9)


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUE 2 — Courbe de Loss (MNR)
# ─────────────────────────────────────────────────────────────────────────────
def plot_loss(ax):
    """
    Visualise la descente de la loss MultipleNegativesRankingLoss.
    Une loss qui décroît régulièrement sans plateau brutal = bon signe.
    Une loss qui cesse de baisser après l'epoch 5-6 suggère qu'on peut
    réduire le nombre d'epochs ou augmenter le dropout.
    """
    epochs = TRAIN_LOG["epochs"]
    loss   = TRAIN_LOG["loss"]

    ax.plot(epochs, loss, "o-", color=COLOR_KO, lw=2, ms=5)
    ax.fill_between(epochs, loss, alpha=0.1, color=COLOR_KO)

    # Zone de stabilisation
    stable_start = 6
    ax.axvspan(stable_start, max(epochs), alpha=0.05, color=COLOR_WARN,
               label=f"Plateau (epoch ≥ {stable_start})")

    ax.set_xlabel("Epoch")
    ax.set_ylabel("Loss MNR (approximée)")
    ax.set_title("2 · Décroissance de la Loss (MNR)")
    ax.legend(fontsize=9)


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUE 3 — Scatter : prédits vs réels
# ─────────────────────────────────────────────────────────────────────────────
def plot_scatter(ax):
    """
    Chaque point représente une paire (offre, candidat).
    La diagonale parfaite = prédiction exacte.
    Points au-dessus → surestimation / en-dessous → sous-estimation.
    La densité autour de la diagonale donne une lecture intuitive du R².
    """
    reels = np.array(EVAL_PAIRS["reels"])
    bge   = np.array(EVAL_PAIRS["bge"])
    cats  = EVAL_PAIRS["categories"]

    palette = {"positif": COLOR_BGE, "négatif": COLOR_KO, "partiel": COLOR_WARN}
    for cat in set(cats):
        idx = [i for i, c in enumerate(cats) if c == cat]
        ax.scatter(
            reels[idx], bge[idx],
            color=palette[cat], s=90, zorder=3,
            edgecolors="white", lw=0.8, label=cat
        )

    # Ligne parfaite
    lims = [0, 1]
    ax.plot(lims, lims, "--", color=COLOR_GRAY, lw=1, alpha=0.7, label="Parfait")

    # Bande de tolérance ±0.10
    x = np.linspace(0, 1, 100)
    ax.fill_between(x, x - 0.10, x + 0.10, alpha=0.08, color=COLOR_BGE,
                    label="±0.10")

    # Annotations
    for i, (r, p, lbl) in enumerate(zip(reels, bge, EVAL_PAIRS["labels"])):
        ax.annotate(lbl, (r, p), textcoords="offset points",
                    xytext=(6, 2), fontsize=7, color="#555")

    r2 = r2_score(reels, bge)
    ax.text(0.05, 0.92, f"R² = {r2:.3f}", transform=ax.transAxes,
            fontsize=9, color=COLOR_BGE, fontweight="bold")

    ax.set_xlabel("Score réel")
    ax.set_ylabel("Score prédit (bge-m3)")
    ax.set_xlim(-0.05, 1.05)
    ax.set_ylim(-0.05, 1.05)
    ax.set_title("3 · Scores prédits vs réels")
    ax.legend(fontsize=8, loc="lower right")


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUE 4 — Distribution des erreurs
# ─────────────────────────────────────────────────────────────────────────────
def plot_error_distribution(ax):
    """
    Histogramme des erreurs (prédit − réel) pour bge-m3 et e5-base.
    Un modèle bien calibré montre des erreurs centrées autour de 0.
    Un biais systématique (distribution déplacée) révèle une sur/sous-estimation
    généralisée. L'écart-type de la distribution = RMSE visuel.
    """
    reels = np.array(EVAL_PAIRS["reels"])
    err_bge = np.array(EVAL_PAIRS["bge"]) - reels
    err_e5  = np.array(EVAL_PAIRS["e5"])  - reels

    bins = np.linspace(-0.9, 0.9, 18)

    ax.hist(err_bge, bins=bins, color=COLOR_BGE, alpha=0.7, label="bge-m3", edgecolor="white")
    ax.hist(err_e5,  bins=bins, color=COLOR_E5,  alpha=0.7, label="e5-base", edgecolor="white")
    ax.axvline(0, color="black", lw=1, ls="--", alpha=0.5)

    # Lignes de moyenne
    ax.axvline(err_bge.mean(), color=COLOR_BGE, lw=1.5, ls="-.",
               label=f"Moy bge-m3 = {err_bge.mean():.3f}")
    ax.axvline(err_e5.mean(),  color=COLOR_OK,  lw=1.5, ls="-.",
               label=f"Moy e5 = {err_e5.mean():.3f}")

    ax.set_xlabel("Erreur (prédit − réel)")
    ax.set_ylabel("Fréquence")
    ax.set_title("4 · Distribution des erreurs de prédiction")
    ax.legend(fontsize=8)


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUE 5 — Radar : comparaison multi-métriques
# ─────────────────────────────────────────────────────────────────────────────
def plot_radar(ax):
    """
    Visualisation multi-dimensionnelle de la qualité des deux modèles.
    Chaque axe représente une métrique normalisée [0,1].
    La surface engloutie = performance globale. Idéal : surface maximale.
    Attention : R² est normalisé (une valeur négative → 0 sur le radar).
    """
    labels  = ["Acc\nbinaire", "Acc ±0.10", "Acc ±0.20", "Pearson", "R² (norm.)"]
    bge_v   = [87.5/100, 62.5/100, 87.5/100, 0.9701, max(0, 0.8862)]
    e5_v    = [37.5/100, 37.5/100, 37.5/100, 0.9336, max(0, -0.619)]

    N = len(labels)
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]

    bge_v += bge_v[:1]
    e5_v  += e5_v[:1]

    ax.set_facecolor("#FAFAFA")
    ax.plot(angles, bge_v, "o-", color=COLOR_BGE, lw=2, ms=5, label="bge-m3")
    ax.fill(angles, bge_v, alpha=0.15, color=COLOR_BGE)
    ax.plot(angles, e5_v,  "s--",color=COLOR_E5,  lw=2, ms=5, label="e5-base")
    ax.fill(angles, e5_v,  alpha=0.15, color=COLOR_E5)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, fontsize=9)
    ax.set_ylim(0, 1)
    ax.set_yticks([0.25, 0.50, 0.75, 1.0])
    ax.set_yticklabels(["25%", "50%", "75%", "100%"], fontsize=7)
    ax.set_title("5 · Radar multi-métriques", pad=15)
    ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1), fontsize=9)


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUE 6 — Barres groupées : MAE / RMSE / R²
# ─────────────────────────────────────────────────────────────────────────────
def plot_grouped_bars(ax):
    """
    Comparaison directe des métriques d'erreur entre les deux modèles.
    MAE et RMSE : plus c'est bas, mieux c'est.
    R² : plus c'est haut (proche de 1), mieux c'est.
    Un R² négatif signifie que le modèle est moins bon qu'une simple moyenne.
    """
    metrics = ["MAE (↓)", "RMSE (↓)", "R² (↑ · norm.)"]
    bge_v   = [METRICS["bge"]["MAE"],  METRICS["bge"]["RMSE"],  METRICS["bge"]["R2"]]
    e5_v    = [METRICS["e5"]["MAE"],   METRICS["e5"]["RMSE"],   max(0, METRICS["e5"]["R2"])]

    x   = np.arange(len(metrics))
    w   = 0.32

    bars_bge = ax.bar(x - w/2, bge_v, w, color=COLOR_BGE, label="bge-m3", zorder=3)
    bars_e5  = ax.bar(x + w/2, e5_v,  w, color=COLOR_E5,  label="e5-base", zorder=3)

    annotate_bar(ax, bars_bge, offset=0.008)
    annotate_bar(ax, bars_e5,  offset=0.008)

    ax.set_xticks(x)
    ax.set_xticklabels(metrics)
    ax.set_ylabel("Valeur")
    ax.set_title("6 · Métriques d'erreur comparées")
    ax.legend(fontsize=9)

    # Annotation e5 R² négatif
    ax.text(2 + w/2, 0.02, "R²=−0.62\n(hors échelle)",
            ha="center", fontsize=7, color=COLOR_KO)


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUE 7 — Matrice de confusion binaire (seuil 0.70)
# ─────────────────────────────────────────────────────────────────────────────
def plot_confusion(ax):
    """
    Classe chaque paire comme MATCH (score ≥ 0.70) ou NON-MATCH.
    Les 4 cellules de la matrice :
      - Vrai Positif (VP) : détecté match + c'est vraiment un match
      - Faux Positif (FP) : détecté match mais non-match réel (fausse alarme)
      - Vrai Négatif (VN) : détecté non-match + c'est vraiment un non-match
      - Faux Négatif (FN) : manqué un match réel (omission)
    Plus la diagonale principale est chargée, mieux c'est.
    """
    SEUIL = 0.70
    reels = np.array(EVAL_PAIRS["reels"])
    bge   = np.array(EVAL_PAIRS["bge"])

    y_true = (reels >= SEUIL).astype(int)
    y_pred = (bge   >= SEUIL).astype(int)

    cm = confusion_matrix(y_true, y_pred, labels=[1, 0])
    labels_cm = [["VP\n(vrais positifs)", "FN\n(faux négatifs)"],
                 ["FP\n(faux positifs)", "VN\n(vrais négatifs)"]]

    cmap = LinearSegmentedColormap.from_list("bge_cmap",
           ["#FAFAFA", "#B5D4F4", "#185FA5"])
    im = ax.imshow(cm, cmap=cmap, vmin=0, vmax=cm.max() + 1)

    for i in range(2):
        for j in range(2):
            color = "white" if cm[i, j] >= cm.max() * 0.6 else "#333"
            ax.text(j, i, f"{cm[i,j]}\n{labels_cm[i][j]}",
                    ha="center", va="center", fontsize=9,
                    color=color, fontweight="bold")

    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["Prédit MATCH", "Prédit NON-MATCH"], fontsize=9)
    ax.set_yticklabels(["Réel MATCH", "Réel NON-MATCH"], fontsize=9)
    ax.set_title(f"7 · Matrice de confusion binaire (seuil = {SEUIL})")

    acc = (cm[0,0] + cm[1,1]) / cm.sum()
    ax.text(0.5, -0.18, f"Accuracy = {acc:.1%}", transform=ax.transAxes,
            ha="center", fontsize=9, color=COLOR_BGE, fontweight="bold")


# ─────────────────────────────────────────────────────────────────────────────
# GRAPHIQUE 8 — Profil de scores par catégorie métier
# ─────────────────────────────────────────────────────────────────────────────
def plot_category_profile(ax):
    """
    Compare scores prédits vs réels regroupés par catégorie (positif / partiel / négatif).
    Permet de diagnostiquer où le modèle pèche :
      - Les positifs sont-ils bien séparés des négatifs ?
      - Les cas partiels (milieu de gamme) sont-ils correctement positionnés ?
    Un bon modèle doit avoir positifs ≥ 0.70, négatifs ≤ 0.15, partiels entre les deux.
    """
    cats_order = ["positif", "partiel", "négatif"]
    palette    = {"positif": COLOR_BGE, "partiel": COLOR_WARN, "négatif": COLOR_KO}

    reels = np.array(EVAL_PAIRS["reels"])
    bge   = np.array(EVAL_PAIRS["bge"])
    cats  = EVAL_PAIRS["categories"]

    x_ticks = []
    x_labels = []
    for xi, cat in enumerate(cats_order):
        idx = [i for i, c in enumerate(cats) if c == cat]
        r_vals = reels[idx]
        b_vals = bge[idx]

        for j, (r, b) in enumerate(zip(r_vals, b_vals)):
            x_off = xi * 3 + j
            x_ticks.append(xi * 3 + 0.5)
            bar_r = ax.bar(x_off - 0.2, r, 0.35, color=COLOR_GRAY, alpha=0.7, zorder=3)
            bar_b = ax.bar(x_off + 0.2, b, 0.35, color=palette[cat], alpha=0.9, zorder=3)

        x_labels.append(cat)

    # Ligne seuil
    ax.axhline(0.70, color=COLOR_WARN, lw=1, ls="--", alpha=0.6, label="Seuil 0.70")
    ax.axhline(0.15, color=COLOR_GRAY, lw=1, ls=":",  alpha=0.6, label="Limite bruit 0.15")

    patch_r = mpatches.Patch(color=COLOR_GRAY, alpha=0.7, label="Réel")
    patch_b = mpatches.Patch(color=COLOR_BGE,  alpha=0.9, label="Prédit bge-m3")
    ax.legend(handles=[patch_r, patch_b,
              mpatches.Patch(color="none", label=""),
              mpatches.Patch(color=COLOR_WARN, alpha=0.5, label="Seuil 0.70")],
              fontsize=8, ncol=2)

    ax.set_ylim(0, 1.05)
    ax.set_ylabel("Score de similarité")
    ax.set_title("8 · Profil de scores par catégorie métier")
    ax.set_xticks([1, 4, 7])
    ax.set_xticklabels(cats_order, fontsize=10)


# ─────────────────────────────────────────────────────────────────────────────
# ASSEMBLAGE FINAL
# ─────────────────────────────────────────────────────────────────────────────
def generate_all_plots(out_dir="./monitoring_output"):
    os.makedirs(out_dir, exist_ok=True)

    # ── Figure 1 : Entraînement & Qualité sémantique ────────────────────────
    fig1, axes1 = plt.subplots(2, 2, figsize=(16, 10))
    fig1.suptitle(
        "Monitoring bge-m3 fine-tuné — Entraînement & Qualité sémantique",
        fontsize=14, fontweight="bold", y=1.01
    )

    plot_convergence(axes1[0, 0])
    plot_loss(axes1[0, 1])
    plot_scatter(axes1[1, 0])
    plot_error_distribution(axes1[1, 1])

    fig1.tight_layout()
    path1 = os.path.join(out_dir, "monitoring_fig1_training.png")
    fig1.savefig(path1, dpi=150, bbox_inches="tight")
    print(f"[OK] Figure 1 sauvegardée → {path1}")

    # ── Figure 2 : Comparaison & Analyse métier ─────────────────────────────
    fig2 = plt.figure(figsize=(18, 10))
    fig2.suptitle(
        "Monitoring bge-m3 fine-tuné — Comparaison & Analyse métier",
        fontsize=14, fontweight="bold", y=1.01
    )

    gs = gridspec.GridSpec(2, 4, figure=fig2, wspace=0.45, hspace=0.45)

    ax_radar  = fig2.add_subplot(gs[0, :2], polar=True)
    ax_bars   = fig2.add_subplot(gs[0, 2:])
    ax_conf   = fig2.add_subplot(gs[1, :2])
    ax_cat    = fig2.add_subplot(gs[1, 2:])

    plot_radar(ax_radar)
    plot_grouped_bars(ax_bars)
    plot_confusion(ax_conf)
    plot_category_profile(ax_cat)

    path2 = os.path.join(out_dir, "monitoring_fig2_comparison.png")
    fig2.savefig(path2, dpi=150, bbox_inches="tight")
    print(f"[OK] Figure 2 sauvegardée → {path2}")

    plt.show()
    print(f"\nTous les graphiques ont été sauvegardés dans : {out_dir}/")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Monitoring modèle HR bge-m3")
    parser.add_argument("--model_path", type=str,
                        default="G:/ai_models/trained_model_bge_m3_v3",
                        help="Chemin vers le modèle fine-tuné sauvegardé")
    parser.add_argument("--test_data", type=str, default=None,
                        help="Fichier test_data.json pour calcul live des scores")
    parser.add_argument("--out_dir",   type=str, default="./monitoring_output",
                        help="Dossier de sortie pour les graphiques PNG")
    args = parser.parse_args()

    if args.test_data and os.path.exists(args.test_data):
        print(f"[INFO] test_data.json détecté — les données EVAL_PAIRS intégrées "
              f"seront complétées par vos vraies prédictions si vous ajoutez "
              f"l'encodage live (décommentez la section dans le code).")

    generate_all_plots(out_dir=args.out_dir)