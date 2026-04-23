import os

# --- Déplacement du cache de HuggingFace vers le disque F ---
os.environ["HF_HOME"] = "F:/HF_Cache"
os.environ["HUGGINGFACE_HUB_CACHE"] = "F:/HF_Cache"

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Matching API",
    description="Microservice pour le matching entre les offres de travail, les candidats et les profils détaillés",
    version="1.0.0"
)

# ─────────────────────────────────────────────────────────────────────────────
# CHARGEMENT DU MODÈLE
# Priorité : 1) modèle fine-tuné local  2) modèle de base multilingual-e5-base
#
# Pourquoi multilingual-e5-base ?
#   • Meilleure qualité sémantique que MiniLM pour le matching métier
#   • Supporte FR / EN / AR (besoin tunisien)
#   • Taille raisonnable (~278 MB) pour un déploiement local
#   • Scores MTEB nettement supérieurs sur les tâches de similarité de phrases
#
# Pour fine-tuner ce modèle, lancer : python train_model.py
# ─────────────────────────────────────────────────────────────────────────────
MODELS_CONFIG = {
    "e5": {
        "base_name": "intfloat/multilingual-e5-base",
        "save_path": "./trained_model_e5"
    },
    "bge-m3": {
        "base_name": "BAAI/bge-m3",
        "save_path": "./trained_model_bge_m3"
    }
}

MODELS = {}
for model_key, config in MODELS_CONFIG.items():
    if os.path.exists(config["save_path"]):
        logger.info(f"Loading custom trained model [{model_key}] from {config['save_path']}...")
        MODELS[model_key] = SentenceTransformer(config["save_path"])
    else:
        logger.info(f"Loading base model [{model_key}]: {config['base_name']}")
        MODELS[model_key] = SentenceTransformer(config["base_name"])

PRIMARY_MODEL = "bge-m3"  # Modèle par défaut renvoyé dans le globalScore principal


# ─────────────────────────────────────────────────────────────────────────────
# SCHÉMAS PYDANTIC
# ─────────────────────────────────────────────────────────────────────────────
class MatchRequest(BaseModel):
    offer: Dict[str, Any]
    candidate: Dict[str, Any]
    profile: Optional[Dict[str, Any]] = None

class ModelScoreDetail(BaseModel):
    globalScore: float
    semanticScore: float
    skillsScore: float
    experienceScore: float
    educationScore: float

class MatchResult(BaseModel):
    offerId: str
    candidateId: str
    globalScore: float
    details: Dict[str, Any]
    modelScores: Optional[Dict[str, ModelScoreDetail]] = None

class CandidateProfilePair(BaseModel):
    candidate: Dict[str, Any]
    profile: Optional[Dict[str, Any]] = None

class TrainingExampleDTO(BaseModel):
    offer_text: str
    candidate_text: str
    score: float

class TrainingRequest(BaseModel):
    examples: List[TrainingExampleDTO]
    epochs: Optional[int] = 1
    model_type: Optional[str] = "bge-m3"  # "e5" ou "bge-m3"

class MatchMultipleRequest(BaseModel):
    offer: Dict[str, Any]
    pairs: List[CandidateProfilePair]

class MatchOffersRequest(BaseModel):
    candidate: Dict[str, Any]
    profile: Optional[Dict[str, Any]] = None
    offers: List[Dict[str, Any]]

class MatchProfileOffersRequest(BaseModel):
    profile: Dict[str, Any]
    offers: List[Dict[str, Any]]


# ─────────────────────────────────────────────────────────────────────────────
# LOGIQUE MÉTIER
# ─────────────────────────────────────────────────────────────────────────────
def format_input_for_model(text: str, is_query: bool, model_key: str) -> str:
    """
    Formate le texte d'entrée selon les spécificités de chaque modèle.
    e5 nécessite 'query:' et 'passage:', bge-m3 fonctionne classiquement.
    """
    text = text.strip()
    if model_key == "e5":
        prefix = "query: " if is_query else "passage: "
        return prefix + text
    return text


def calculate_semantic_similarity(text1: str, text2: str, model_encoder: SentenceTransformer, model_key: str) -> float:
    if not text1 or not text2:
        return 0.0
    # text1 = offre (query), text2 = candidat (passage)
    emb1 = model_encoder.encode([format_input_for_model(text1, is_query=True, model_key=model_key)])
    emb2 = model_encoder.encode([format_input_for_model(text2, is_query=False, model_key=model_key)])
    sim  = cosine_similarity(emb1, emb2)[0][0]
    return float(max(0.0, sim))


def calculate_experience_score(offer_min_exp: float, cand_exp: float) -> float:
    if offer_min_exp == 0:
        return 100.0
    if cand_exp >= offer_min_exp:
        return 100.0
    return (cand_exp / offer_min_exp) * 100.0


def extract_skills_list(data: Dict[str, Any], keys: List[str]) -> set:
    skills = set()
    for key in keys:
        items = data.get(key, [])
        if isinstance(items, list):
            for item in items:
                if isinstance(item, str):
                    skills.add(item.lower().strip())
    return skills


def check_education_level(required_level: str, candidate_levels: List[str]) -> float:
    if not required_level:
        return 100.0

    hierarchy = {
        "licence": 1, "bachelor": 1,
        "master": 2, "ingenieur": 2, "ingénieur": 2,
        "doctorat": 3, "phd": 3,
    }
    req_val = hierarchy.get(required_level.lower(), 0)

    cand_max_val = 0
    for level in candidate_levels:
        l_val = hierarchy.get(level.lower(), 0)
        if l_val > cand_max_val:
            cand_max_val = l_val

    if cand_max_val >= req_val:
        return 100.0
    elif cand_max_val > 0:
        return (cand_max_val / req_val) * 100.0
    return 0.0


def process_match(
    offer: Dict[str, Any],
    candidate: Dict[str, Any],
    profile: Dict[str, Any],
) -> MatchResult:

    # 1. EXPÉRIENCE (15 %)
    offer_min_exp = float(offer.get("minYearsExperience", 0))
    cand_exp      = float(candidate.get("experience", 0))
    if cand_exp == 0 and "nbAnneesExperience" in profile:
        cand_exp = float(profile.get("nbAnneesExperience", 0))
    exp_score = calculate_experience_score(offer_min_exp, cand_exp)

    # 2. ÉDUCATION (15 %)
    required_level = offer.get("requiredLevel", "")
    cand_levels    = []
    for edu in candidate.get("education", []):
        if isinstance(edu, dict) and "degree" in edu:
            cand_levels.append(edu["degree"])
    if "niveauDiplome" in profile:
        cand_levels.append(profile["niveauDiplome"])
    edu_score = check_education_level(required_level, cand_levels)

    # 3. COMPÉTENCES EXACTES (30 %)
    req_skills  = extract_skills_list(offer, ["requiredSkills", "modules"])
    cand_skills = extract_skills_list(candidate, ["skills"])
    cand_skills.update(extract_skills_list(
        profile,
        ["langages", "frameworks", "dataSkills", "iaSkills",
         "modulesEnseignes", "erpSkills"],
    ))

    if len(req_skills) > 0:
        matching_skills = req_skills.intersection(cand_skills)
        skills_score    = (len(matching_skills) / len(req_skills)) * 100.0
    else:
        matching_skills = set()
        skills_score    = 100.0

    # 4. SIMILARITÉ SÉMANTIQUE (40 %) SUR L'ENSEMBLE DES MODÈLES
    offer_text = " ".join([
        str(offer.get("title", "")),
        str(offer.get("description", "")),
        str(offer.get("speciality", "")),
    ])
    cand_text = " ".join([
        str(candidate.get("notes", "")),
        str(profile.get("motivation", "")),
        " ".join(candidate.get("skills", [])),
    ])

    model_scores = {}
    for mod_key, mod_encoder in MODELS.items():
        sim_score = calculate_semantic_similarity(offer_text, cand_text, mod_encoder, mod_key) * 100.0
        g_score = (
            exp_score      * 0.15
            + edu_score    * 0.15
            + skills_score * 0.30
            + sim_score    * 0.40
        )
        model_scores[mod_key] = {
            "globalScore": round(g_score, 2),
            "semanticScore": round(sim_score, 2),
            "skillsScore": round(skills_score, 2),
            "experienceScore": round(exp_score, 2),
            "educationScore": round(edu_score, 2)
        }

    # Données par défaut pour la compatibilité ascendante (on utilise PRIMARY_MODEL, voire 'e5' si non dispo)
    main_model_key = PRIMARY_MODEL if PRIMARY_MODEL in model_scores else list(model_scores.keys())[0]
    main_scores = model_scores[main_model_key]

    missing_skills = req_skills - matching_skills

    return MatchResult(
        offerId=offer.get("_id", offer.get("id", "unknown_offer")),
        candidateId=candidate.get("_id", candidate.get("id", "unknown_candidate")),
        globalScore=main_scores["globalScore"],
        details={
            "experienceScore":  main_scores["experienceScore"],
            "educationScore":   main_scores["educationScore"],
            "skillsScore":      main_scores["skillsScore"],
            "semanticScore":    main_scores["semanticScore"],
            "matchingSkills":   list(matching_skills),
            "missingSkills":    list(missing_skills),
            "candidateExperience": cand_exp,
            "offerMinExperience":  offer_min_exp,
            "usedModel": main_model_key
        },
        modelScores=model_scores
    )


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/match", response_model=MatchResult)
async def match_offer_candidate(request: MatchRequest):
    try:
        logger.info(f"Match Offre={request.offer.get('_id','?')} Candidat={request.candidate.get('_id','?')}")
        return process_match(request.offer, request.candidate, request.profile or {})
    except Exception as e:
        logger.error(f"Erreur match: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rank-candidates", response_model=List[MatchResult])
async def rank_candidates(request: MatchMultipleRequest):
    try:
        logger.info(f"RankCandidates Offre={request.offer.get('_id','?')} | {len(request.pairs)} candidats")
        results = [process_match(request.offer, p.candidate, p.profile or {}) for p in request.pairs]
        results.sort(key=lambda x: x.globalScore, reverse=True)
        return results
    except Exception as e:
        logger.error(f"Erreur ranking candidats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rank-offers", response_model=List[MatchResult])
async def rank_offers(request: MatchOffersRequest):
    try:
        logger.info(f"RankOffers Candidat={request.candidate.get('_id','?')} | {len(request.offers)} offres")
        results = [process_match(o, request.candidate, request.profile or {}) for o in request.offers]
        results.sort(key=lambda x: x.globalScore, reverse=True)
        return results
    except Exception as e:
        logger.error(f"Erreur ranking offres: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rank-profile-offers", response_model=List[MatchResult])
async def rank_profile_offers(request: MatchProfileOffersRequest):
    try:
        logger.info(f"RankProfileOffers | {len(request.offers)} offres")
        profile_id = request.profile.get("userId",
                     request.profile.get("_id",
                     request.profile.get("id", "unknown_profile")))
        if isinstance(profile_id, dict):
            profile_id = profile_id.get("$oid", "unknown_profile")

        dummy_candidate = {"_id": profile_id}
        results = [process_match(o, dummy_candidate, request.profile) for o in request.offers]
        results.sort(key=lambda x: x.globalScore, reverse=True)
        return results
    except Exception as e:
        logger.error(f"Erreur ranking offres profil: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/train")
async def api_train_model(request: TrainingRequest):
    try:
        model_key = request.model_type or PRIMARY_MODEL
        if model_key not in MODELS_CONFIG:
            raise HTTPException(status_code=400, detail=f"Modèle inconnu : {model_key}")
            
        logger.info(f"Training [{model_key}]: {len(request.examples)} exemples, {request.epochs} epoch(s)")

        encoder_to_train = MODELS.get(model_key)
        if encoder_to_train is None:
            # S'il n'était pas chargé en mémoire (cas peu probable ici), le charger
            encoder_to_train = SentenceTransformer(MODELS_CONFIG[model_key]["base_name"])

        train_examples = [
            InputExample(
                texts=[
                    format_input_for_model(ex.offer_text, True, model_key),
                    format_input_for_model(ex.candidate_text, False, model_key)
                ],
                label=float(max(0.0, min(1.0, ex.score))),
            )
            for ex in request.examples
        ]

        if not train_examples:
            raise HTTPException(status_code=400, detail="Aucun exemple valide fourni.")

        train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
        train_loss       = losses.CosineSimilarityLoss(encoder_to_train)

        encoder_to_train.fit(
            train_objectives=[(train_dataloader, train_loss)],
            epochs=request.epochs,
            warmup_steps=100,
            show_progress_bar=True,
        )

        save_path = MODELS_CONFIG[model_key]["save_path"]
        os.makedirs(save_path, exist_ok=True)
        encoder_to_train.save(save_path)
        
        # Mettre à jour l'instance en mémoire
        MODELS[model_key] = encoder_to_train
        logger.info(f"Modèle [{model_key}] sauvegardé dans {save_path}")

        return {"status": "success", "message": f"Modèle {model_key} entraîné et sauvegardé dans {save_path}"}

    except Exception as e:
        logger.error(f"Erreur entraînement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)