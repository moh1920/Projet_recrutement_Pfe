import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json

app = FastAPI(
    title="AI Matching API",
    description="Microservice pour le matching entre les offres de travail, les candidats et les profils détaillés",
    version="1.0.0"
)

# Chargement du modèle NLP sémantique (multilingue)
MODEL_SAVE_PATH = "./trained_model"

if os.path.exists(MODEL_SAVE_PATH):
    print(f"Loading custom trained model from {MODEL_SAVE_PATH}...")
    model = SentenceTransformer(MODEL_SAVE_PATH)
else:
    print("Loading default base model...")
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class MatchRequest(BaseModel):
    offer: Dict[str, Any]
    candidate: Dict[str, Any]
    profile: Optional[Dict[str, Any]] = None

class MatchResult(BaseModel):
    offerId: str
    candidateId: str
    globalScore: float
    details: Dict[str, Any]

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

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    embeddings1 = model.encode([text1])
    embeddings2 = model.encode([text2])
    sim = cosine_similarity(embeddings1, embeddings2)[0][0]
    return float(max(0, sim)) # Éviter les scores négatifs

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
    
    # Simple hiérarchie académique pour l'exemple
    hierarchy = {
        "licence": 1,
        "bachelor": 1,
        "master": 2,
        "ingenieur": 2,
        "ingénieur": 2,
        "doctorat": 3,
        "phd": 3
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

def process_match(offer: Dict[str, Any], candidate: Dict[str, Any], profile: Dict[str, Any]) -> MatchResult:
    # 1. EXPÉRIENCE (Poids: 15%)
    # ----------------------------------------
    offer_min_exp = float(offer.get("minYearsExperience", 0))
    cand_exp = float(candidate.get("experience", 0))
    # fallback sur profile si non présent dans candidate
    if cand_exp == 0 and "nbAnneesExperience" in profile:
        cand_exp = float(profile.get("nbAnneesExperience", 0))
        
    exp_score = calculate_experience_score(offer_min_exp, cand_exp)

    # 2. ÉDUCATION (Poids: 15%)
    # ----------------------------------------
    required_level = offer.get("requiredLevel", "")
    cand_levels = []
    for edu in candidate.get("education", []):
        if isinstance(edu, dict) and "degree" in edu:
            cand_levels.append(edu["degree"])
    if "niveauDiplome" in profile:
        cand_levels.append(profile["niveauDiplome"])
        
    edu_score = check_education_level(required_level, cand_levels)

    # 3. COMPÉTENCES EXACTES (Poids: 30%)
    # ----------------------------------------
    req_skills = extract_skills_list(offer, ["requiredSkills", "modules"])
    
    cand_skills = extract_skills_list(candidate, ["skills"])
    cand_skills.update(extract_skills_list(profile, ["langages", "frameworks", "dataSkills", "iaSkills", "modulesEnseignes", "erpSkills"]))

    if len(req_skills) > 0:
        matching_skills = req_skills.intersection(cand_skills)
        skills_score = (len(matching_skills) / len(req_skills)) * 100.0
    else:
        matching_skills = set()
        skills_score = 100.0

    # 4. SIMILARITÉ SÉMANTIQUE (Poids: 40%)
    # ----------------------------------------
    offer_text_parts = [
        str(offer.get("title", "")),
        str(offer.get("description", "")),
        str(offer.get("speciality", ""))
    ]
    offer_text = " ".join(offer_text_parts)
    
    cand_text_parts = [
        str(candidate.get("notes", "")),
        str(profile.get("motivation", "")),
        " ".join(candidate.get("skills", []))
    ]
    cand_text = " ".join(cand_text_parts)

    semantic_score = calculate_semantic_similarity(offer_text, cand_text) * 100.0

    # CALCUL DU SCORE GLOBAL
    # ----------------------------------------
    global_score = (exp_score * 0.15) + (edu_score * 0.15) + (skills_score * 0.30) + (semantic_score * 0.40)

    missing_skills = req_skills - matching_skills

    return MatchResult(
        offerId=offer.get("_id", offer.get("id", "unknown_offer")),
        candidateId=candidate.get("_id", candidate.get("id", "unknown_candidate")),
        globalScore=round(global_score, 2),
        details={
            "experienceScore": round(exp_score, 2),
            "educationScore": round(edu_score, 2),
            "skillsScore": round(skills_score, 2),
            "semanticScore": round(semantic_score, 2),
            "matchingSkills": list(matching_skills),
            "missingSkills": list(missing_skills),
            "candidateExperience": cand_exp,
            "offerMinExperience": offer_min_exp
        }
    )

@app.post("/api/match", response_model=MatchResult)
async def match_offer_candidate(request: MatchRequest):
    try:
        logger.info(f"Processing Match pour Offre: {request.offer.get('_id', 'unknown')} et Candidat: {request.candidate.get('_id', 'unknown')}")
        return process_match(request.offer, request.candidate, request.profile or {})
    except Exception as e:
        logger.error(f"Erreur lors du match: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rank-candidates", response_model=List[MatchResult])
async def rank_candidates(request: MatchMultipleRequest):
    try:
        logger.info(f"Processing RankCandidates pour Offre: {request.offer.get('_id', 'unknown')} avec {len(request.pairs)} candidats")
        results = []
        for pair in request.pairs:
            res = process_match(request.offer, pair.candidate, pair.profile or {})
            results.append(res)
        
        # tri par score global décroissant
        results.sort(key=lambda x: x.globalScore, reverse=True)
        return results
    except Exception as e:
        logger.error(f"Erreur lors du calcul de ranking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rank-offers", response_model=List[MatchResult])
async def rank_offers(request: MatchOffersRequest):
    try:
        logger.info(f"Processing RankOffers pour Candidat: {request.candidate.get('_id', 'unknown')} contre {len(request.offers)} offres")
        results = []
        for offer in request.offers:
            res = process_match(offer, request.candidate, request.profile or {})
            results.append(res)
        
        # tri par score global décroissant
        results.sort(key=lambda x: x.globalScore, reverse=True)
        return results
    except Exception as e:
        logger.error(f"Erreur lors du calcul de ranking des offres: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rank-profile-offers", response_model=List[MatchResult])
async def rank_profile_offers(request: MatchProfileOffersRequest):
    try:
        logger.info(f"Processing RankProfileOffers contre {len(request.offers)} offres")
        results = []
        
        # Creation d'un candidat factice avec l'identifiant du profil pour garder la trace
        profile_id = request.profile.get("userId", request.profile.get("_id", request.profile.get("id", "unknown_profile")))
        if isinstance(profile_id, dict):
            profile_id = profile_id.get("$oid", "unknown_profile")
            
        dummy_candidate = {"_id": profile_id}
        
        for offer in request.offers:
            res = process_match(offer, dummy_candidate, request.profile)
            results.append(res)
        
        # tri par score global décroissant
        results.sort(key=lambda x: x.globalScore, reverse=True)
        return results
    except Exception as e:
        logger.error(f"Erreur lors du calcul de ranking des offres pour un profil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/train")
async def train_model(request: TrainingRequest):
    global model
    try:
        logger.info(f"Starting model training with {len(request.examples)} examples for {request.epochs} epochs")
        
        # Prepare training data
        train_examples = []
        for ex in request.examples:
            # Score must be between 0.0 and 1.0 for CosineSimilarityLoss
            score = float(max(0.0, min(1.0, ex.score)))
            train_examples.append(InputExample(texts=[ex.offer_text, ex.candidate_text], label=score))
            
        if not train_examples:
            raise HTTPException(status_code=400, detail="No valid training examples provided.")
            
        # Create DataLoader
        train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
        
        # Define loss function
        train_loss = losses.CosineSimilarityLoss(model)
        
        # Fine-tune the model
        model.fit(
            train_objectives=[(train_dataloader, train_loss)],
            epochs=request.epochs,
            warmup_steps=100,
            show_progress_bar=True
        )
        
        # Save the fine-tuned model
        os.makedirs(MODEL_SAVE_PATH, exist_ok=True)
        model.save(MODEL_SAVE_PATH)
        logger.info(f"Model saved to {MODEL_SAVE_PATH}")
        
        return {"status": "success", "message": f"Model successfully trained and saved to {MODEL_SAVE_PATH}"}
        
    except Exception as e:
        logger.error(f"Erreur lors de l'entrainement du modele: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Lancement du serveur en local
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
