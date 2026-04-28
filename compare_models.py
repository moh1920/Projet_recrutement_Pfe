"""
Script de comparaison graphique des modèles bge-m3 vs e5-base.
Génère des visualisations à partir des résultats de l'API.
"""

import requests
import json
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Patch

API_URL = "http://127.0.0.1:8001/api/rank-candidates"

# ── DONNÉES DE TEST ─────────────────────────────────────────────────────────
offer_data = {
    "_id": "OFF-DEV-2026-03",
    "title": "Enseignant Développement Web (Spring Boot / Angular)",
    "description": "Recrutement d'un enseignant pour assurer les modules de développement Web Full Stack.",
    "speciality": "Développement Web",
    "requiredLevel": "Master",
    "modules": ["Spring Boot", "Angular", "Microservices", "REST API"],
    "minYearsExperience": 4,
    "requiredSkills": ["Java", "Spring Boot", "Angular", "REST", "Docker"]
}

candidates = [
    {
        "_id": "cand-1",
        "firstName": "Maryem",
        "experience": 5,
        "education": [{"degree": "Licence"}],
        "skills": ["Java", "Python", "Spring Boot", "Angular", "React", "SQL", "Machine Learning"],
        "notes": "Développeuse fullstack avec expérience enseignement Spring Boot/Angular."
    },
    {
        "_id": "cand-2",
        "firstName": "Jean",
        "experience": 2,
        "education": [{"degree": "Licence"}],
        "skills": ["HTML", "CSS", "JavaScript", "React"],
        "notes": "Développeur frontend junior."
    },
    {
        "_id": "cand-3",
        "firstName": "Ahmed",
        "experience": 8,
        "education": [{"degree": "Doctorat"}],
        "skills": ["Python", "TensorFlow", "Machine Learning", "Deep Learning", "NLP", "Java"],
        "notes": "Docteur en IA, spécialisé en NLP et Deep Learning."
    },
    {
        "_id": "cand-4",
        "firstName": "Sofia",
        "experience": 4,
        "education": [{"degree": "Master"}],
        "skills": ["Java", "Spring Boot", "Angular", "Docker", "REST", "PostgreSQL"],
        "notes": "Développeuse Java confirmée, expertise Spring Boot et Angular."
    }
]

payload = {
    "offer": offer_data,
    "pairs": [{"candidate": c, "profile": {}} for c in candidates]
}

# ── RÉCUPÉRATION DES DONNÉES ────────────────────────────────────────────────
def fetch_results():
    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        print("ERREUR: Lancer d'abord le serveur: uvicorn main:app --port 8001 --reload")
        exit(1)

results = fetch_results()

# ── EXTRACTION DES DONNÉES ──────────────────────────────────────────────────
names = [c["firstName"] for c in candidates]
bge_scores = []
e5_scores = []
bge_semantic = []
e5_semantic = []

for res in results:
    ms = res.get("modelScores", {})
    bge = ms.get("bge-m3", {})
    e5 = ms.get("e5", {})
    
    bge_scores.append(bge.get("globalScore", 0))
    e5_scores.append(e5.get("globalScore", 0))
    bge_semantic.append(bge.get("semanticScore", 0))
    e5_semantic.append(e5.get("semanticScore", 0))

# ── GRAPHIQUE 1: BARRES GROUPÉES (Scores Globaux) ───────────────────────────
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Comparaison des Modèles: bge-m3 vs e5-base', fontsize=16, fontweight='bold')

x = np.arange(len(names))
width = 0.35

ax1 = axes[0, 0]
bars1 = ax1.bar(x - width/2, bge_scores, width, label='bge-m3', color='#2E86AB', edgecolor='black')
bars2 = ax1.bar(x + width/2, e5_scores, width, label='e5-base', color='#A23B72', edgecolor='black')
ax1.set_ylabel('Score Global (%)')
ax1.set_title('Scores Globaux par Candidat')
ax1.set_xticks(x)
ax1.set_xticklabels(names)
ax1.legend()
ax1.set_ylim(0, 100)
ax1.grid(axis='y', alpha=0.3)

# Ajouter les valeurs sur les barres
for bar in bars1:
    height = bar.get_height()
    ax1.annotate(f'{height:.1f}', xy=(bar.get_x() + bar.get_width()/2, height),
                xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=8)
for bar in bars2:
    height = bar.get_height()
    ax1.annotate(f'{height:.1f}', xy=(bar.get_x() + bar.get_width()/2, height),
                xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=8)

# ── GRAPHIQUE 2: BARRES GROUPÉES (Scores Sémantiques) ───────────────────────
ax2 = axes[0, 1]
bars3 = ax2.bar(x - width/2, bge_semantic, width, label='bge-m3', color='#2E86AB', edgecolor='black')
bars4 = ax2.bar(x + width/2, e5_semantic, width, label='e5-base', color='#A23B72', edgecolor='black')
ax2.set_ylabel('Score Sémantique (%)')
ax2.set_title('Scores Sémantiques par Candidat')
ax2.set_xticks(x)
ax2.set_xticklabels(names)
ax2.legend()
ax2.set_ylim(0, 100)
ax2.grid(axis='y', alpha=0.3)

# ── GRAPHIQUE 3: SCATTER PLOT (Corrélation) ─────────────────────────────────
ax3 = axes[1, 0]
ax3.scatter(bge_semantic, e5_semantic, s=150, c='#F18F01', edgecolors='black', zorder=3)
for i, name in enumerate(names):
    ax3.annotate(name, (bge_semantic[i], e5_semantic[i]), 
                textcoords="offset points", xytext=(5, 5), fontsize=9)
# Ligne de référence y=x
min_val = min(min(bge_semantic), min(e5_semantic)) - 5
max_val = max(max(bge_semantic), max(e5_semantic)) + 5
ax3.plot([min_val, max_val], [min_val, max_val], 'k--', alpha=0.5, label='y=x (accord parfait)')
ax3.set_xlabel('Score Sémantique bge-m3 (%)')
ax3.set_ylabel('Score Sémantique e5-base (%)')
ax3.set_title('Corrélation Sémantique entre Modèles')
ax3.legend()
ax3.grid(alpha=0.3)

# ── GRAPHIQUE 4: DIFFÉRENCE DE CLASSEMENT ───────────────────────────────────
ax4 = axes[1, 1]
# Trier par bge-m3
sorted_indices = np.argsort(bge_scores)[::-1]
bge_ranks = np.empty(len(sorted_indices), dtype=int)
e5_ranks = np.empty(len(sorted_indices), dtype=int)

for rank, idx in enumerate(sorted_indices):
    bge_ranks[idx] = rank + 1
    # Trouver le rang e5 pour ce candidat
    e5_sorted = np.argsort(e5_scores)[::-1]
    e5_ranks[idx] = np.where(e5_sorted == idx)[0][0] + 1

y_pos = np.arange(len(names))
ax4.barh(y_pos, bge_ranks, height=0.3, label='Rang bge-m3', color='#2E86AB', edgecolor='black')
ax4.barh(y_pos + 0.3, e5_ranks, height=0.3, label='Rang e5-base', color='#A23B72', edgecolor='black')
ax4.set_yticks(y_pos + 0.15)
ax4.set_yticklabels(names)
ax4.invert_yaxis()
ax4.set_xlabel('Rang (1 = meilleur)')
ax4.set_title('Comparaison du Classement')
ax4.legend()
ax4.set_xlim(0.5, len(names) + 0.5)
ax4.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig('model_comparison.png', dpi=150, bbox_inches='tight')
plt.show()

print("✅ Graphique sauvegardé sous 'model_comparison.png'")

# ── TABLEAU RÉCAPITULATIF ───────────────────────────────────────────────────
print("\n" + "="*70)
print("TABLEAU COMPARATIF")
print("="*70)
print(f"{'Candidat':<10} {'bge-m3':>10} {'e5-base':>10} {'Δ Global':>10} {'Δ Sémantique':>12}")
print("-"*70)
for i, name in enumerate(names):
    delta_global = abs(bge_scores[i] - e5_scores[i])
    delta_sem = abs(bge_semantic[i] - e5_semantic[i])
    print(f"{name:<10} {bge_scores[i]:>10.2f} {e5_scores[i]:>10.2f} {delta_global:>10.2f} {delta_sem:>12.2f}")
print("="*70)