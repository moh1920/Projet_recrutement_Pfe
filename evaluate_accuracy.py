"""
Script d'evaluation de l'accuracy des modeles bge-m3 vs e5-base.
Compare les scores predits avec les scores reels (ground truth).
"""

import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt

# -- CONFIG ------------------------------------------------------------------
MODELS_BASE_DIR = "G:/ai_models"

MODELS_CONFIG = {
    "e5": {
        "base_name": "intfloat/multilingual-e5-base",
        "save_path": "./trained_model_e5"
    },
    "bge-m3": {
        "base_name": "BAAI/bge-m3",
        "save_path": "G:/ai_models/trained_model_bge_m3_axe1"
    }
}

EVAL_SAVE_PATH = os.path.join(MODELS_BASE_DIR, "eval_results")

# -- CHARGEMENT DES MODELES --------------------------------------------------
def load_model(model_key):
    config = MODELS_CONFIG[model_key]
    if os.path.exists(config["save_path"]):
        print(f"Chargement modele fine-tune [{model_key}] depuis {config['save_path']}")
        return SentenceTransformer(config["save_path"])
    else:
        print(f"Modele fine-tune non trouve, chargement base [{model_key}]: {config['base_name']}")
        return SentenceTransformer(config["base_name"])

# -- FORMATAGE TEXTE ---------------------------------------------------------
def format_text(text, is_query, model_key):
    text = text.strip()
    if model_key == "e5":
        return ("query: " if is_query else "passage: ") + text
    return text

# -- CALCUL DU SCORE SEMANTIQUE ----------------------------------------------
def predict_score(model, offer_text, candidate_text, model_key):
    emb1 = model.encode([format_text(offer_text, True, model_key)])
    emb2 = model.encode([format_text(candidate_text, False, model_key)])
    sim = cosine_similarity(emb1, emb2)[0][0]
    return float(sim)

# -- METRIQUES D'ACCURACY ---------------------------------------------------
def calculate_metrics(y_true, y_pred, model_name):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    # 1. MSE (Mean Squared Error)
    mse = mean_squared_error(y_true, y_pred)

    # 2. RMSE
    rmse = np.sqrt(mse)

    # 3. MAE (Mean Absolute Error)
    mae = mean_absolute_error(y_true, y_pred)

    # 4. R2 Score
    r2 = r2_score(y_true, y_pred)

    # 5. Correlation de Pearson — BUG FIX : protection contre variance nulle
    if np.std(y_true) == 0 or np.std(y_pred) == 0:
        pearson = 0.0
    else:
        pearson = np.corrcoef(y_true, y_pred)[0, 1]

    # 6. Accuracy binaire (seuil 0.70)
    y_true_bin = (y_true >= 0.70).astype(int)
    y_pred_bin = (y_pred >= 0.70).astype(int)
    accuracy_binary = np.mean(y_true_bin == y_pred_bin) * 100

    # 7. Accuracy a +/-0.10 pres
    within_tolerance = np.mean(np.abs(y_true - y_pred) <= 0.10) * 100

    # 8. Accuracy a +/-0.20 pres
    within_tolerance_large = np.mean(np.abs(y_true - y_pred) <= 0.20) * 100

    sep = "=" * 60
    print(f"\n{sep}")
    print(f"METRIQUES POUR : {model_name}")
    print(sep)
    print(f"  MSE                              : {mse:.4f}")
    print(f"  RMSE                             : {rmse:.4f}")
    print(f"  MAE                              : {mae:.4f}")
    print(f"  R2 Score                         : {r2:.4f}")
    print(f"  Correlation Pearson              : {pearson:.4f}")
    print(f"  Accuracy Binaire (seuil 0.70)    : {accuracy_binary:.1f}%")
    print(f"  Accuracy +/-0.10 (tolerance)      : {within_tolerance:.1f}%")
    print(f"  Accuracy +/-0.20 (tolerance large) : {within_tolerance_large:.1f}%")
    print(sep)

    return {
        "model": model_name,
        "mse": mse,
        "rmse": rmse,
        "mae": mae,
        "r2": r2,
        "pearson": pearson,
        "accuracy_binary": accuracy_binary,
        "accuracy_tol_10": within_tolerance,
        "accuracy_tol_20": within_tolerance_large,
        "y_true": y_true,
        "y_pred": y_pred
    }

# -- VISUALISATION ----------------------------------------------------------
def plot_comparison(results_bge, results_e5):
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle("Accuracy des Modeles : Prediction vs Realite", fontsize=16, fontweight="bold")

    colors = {"bge-m3": "#2E86AB", "e5": "#A23B72"}

    for idx, (res, model_name) in enumerate([(results_bge, "bge-m3"), (results_e5, "e5")]):
        y_true = res["y_true"]
        y_pred = res["y_pred"]
        color = colors[model_name]

        # 1. Scatter plot : Predi vs Reel
        ax = axes[0, idx]
        ax.scatter(y_true, y_pred, c=color, s=100, edgecolors="black", alpha=0.7, zorder=3)

        min_val = min(min(y_true), min(y_pred)) - 0.05
        max_val = max(max(y_true), max(y_pred)) + 0.05
        ax.plot([min_val, max_val], [min_val, max_val], "k--", alpha=0.5, linewidth=2,
                label="Prediction parfaite (y=x)")
        ax.fill_between(
            [min_val, max_val],
            [min_val - 0.10, max_val - 0.10],
            [min_val + 0.10, max_val + 0.10],
            alpha=0.1, color="green", label="Tolerance +/-0.10"
        )

        ax.set_xlabel("Score Reel (Ground Truth)")
        ax.set_ylabel("Score Predi par le Modele")
        ax.set_title(f"{model_name}\nR2 = {res['r2']:.3f} | MAE = {res['mae']:.3f}")
        ax.grid(alpha=0.3)
        ax.set_xlim(min_val, max_val)
        ax.set_ylim(min_val, max_val)

        # 2. Barres d'erreur (residus)
        ax2 = axes[1, idx]
        residuals = y_pred - y_true
        x_pos = np.arange(len(residuals))
        colors_bar = [
            "green" if abs(r) <= 0.10 else "orange" if abs(r) <= 0.20 else "red"
            for r in residuals
        ]

        ax2.bar(x_pos, residuals, color=colors_bar, edgecolor="black", alpha=0.8)
        ax2.axhline(y=0,    color="black",  linestyle="-",  linewidth=1)
        ax2.axhline(y=0.10, color="green",  linestyle="--", alpha=0.5, label="Tolerance +/-0.10")
        ax2.axhline(y=-0.10, color="green", linestyle="--", alpha=0.5)
        ax2.axhline(y=0.20, color="orange", linestyle="--", alpha=0.5, label="Tolerance +/-0.20")
        ax2.axhline(y=-0.20, color="orange", linestyle="--", alpha=0.5)
        ax2.set_xlabel("Index de la paire test")
        ax2.set_ylabel("Erreur (Predi - Reel)")
        ax2.set_title(f"Residus - {model_name}")
        ax2.legend(loc="upper right")
        ax2.grid(axis="y", alpha=0.3)

    plt.tight_layout()
    plt.savefig("model_accuracy.png", dpi=150, bbox_inches="tight")
    plt.close()  # BUG FIX : evite le blocage en mode non-interactif
    print("\nGraphique sauvegarde sous 'model_accuracy.png'")

# -- TABLEAU COMPARATIF -----------------------------------------------------
def print_comparison_table(results_bge, results_e5):
    # BUG FIX : f-strings avec guillemets imbriques invalides avant Python 3.12
    sep    = "=" * 80
    dashes = "-" * 80
    header = f"{'METRIQUE':<30} {'bge-m3':>15} {'e5-base':>15} {'MEILLEUR':>15}"

    print(f"\n{sep}")
    print(header)
    print(dashes)

    metrics = [
        ("MSE (mieux bas)",                "mse"),
        ("RMSE (mieux bas)",               "rmse"),
        ("MAE (mieux bas)",                "mae"),
        ("R2 (mieux haut)",                "r2"),
        ("Correlation Pearson (mieux haut)", "pearson"),
        ("Accuracy Binaire % (mieux haut)", "accuracy_binary"),
        ("Accuracy +/-0.10 % (mieux haut)", "accuracy_tol_10"),
        ("Accuracy +/-0.20 % (mieux haut)", "accuracy_tol_20"),
    ]

    for label, key in metrics:
        bge_val = results_bge[key]
        e5_val  = results_e5[key]

        if key in ["mse", "rmse", "mae"]:
            winner = "bge-m3" if bge_val < e5_val else "e5-base" if e5_val < bge_val else "EGAL"
        else:
            winner = "bge-m3" if bge_val > e5_val else "e5-base" if e5_val > bge_val else "EGAL"

        print(f"{label:<30} {bge_val:>15.4f} {e5_val:>15.4f} {winner:>15}")

    print(sep)

# -- MAIN -------------------------------------------------------------------
def main():
    ground_truth_path = "ground_truth.json"

    if not os.path.exists(ground_truth_path):
        print(f"Fichier {ground_truth_path} non trouve!")
        print("Cree un fichier ground_truth.json avec ce format:")
        print("""
[
  {"offer_text": "...", "candidate_text": "...", "true_score": 0.95},
  ...
]
        """)
        return

    with open(ground_truth_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"{len(data)} paires chargees depuis {ground_truth_path}")

    model_bge = load_model("bge-m3")
    model_e5  = load_model("e5")

    y_true     = []
    y_pred_bge = []
    y_pred_e5  = []

    print("\nPrediction en cours...")
    for i, item in enumerate(data):
        true_score = item["true_score"]
        offer      = item["offer_text"]
        candidate  = item["candidate_text"]

        pred_bge = predict_score(model_bge, offer, candidate, "bge-m3")
        pred_e5  = predict_score(model_e5,  offer, candidate, "e5")

        y_true.append(true_score)
        y_pred_bge.append(pred_bge)
        y_pred_e5.append(pred_e5)

        print(f"  [{i+1}/{len(data)}] Reel: {true_score:.2f} | bge-m3: {pred_bge:.3f} | e5: {pred_e5:.3f}")

    results_bge = calculate_metrics(y_true, y_pred_bge, "bge-m3 (fine-tune)")
    results_e5  = calculate_metrics(y_true, y_pred_e5,  "e5-base")

    print_comparison_table(results_bge, results_e5)
    plot_comparison(results_bge, results_e5)

    sep = "=" * 60
    print(f"\n{sep}")
    print("CONCLUSION")
    print(sep)

    if results_bge["r2"] > results_e5["r2"] and results_bge["mae"] < results_e5["mae"]:
        print("bge-m3 est le meilleur modele (meilleur R2 et plus faible MAE)")
    elif results_e5["r2"] > results_bge["r2"] and results_e5["mae"] < results_bge["mae"]:
        print("e5-base est le meilleur modele (meilleur R2 et plus faible MAE)")
    else:
        print("Resultats mitiges - analyse les metriques individuelles")

    print(sep)


if __name__ == "__main__":
    main()