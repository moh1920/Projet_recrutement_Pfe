"""
smart_engine.py
===============
Moteur intelligent de recrutement d'enseignants universitaires.

Architecture :
  1. SentenceTransformer  → embeddings sémantiques multilingues (FR/AR/EN)
  2. FAISS                → recherche vectorielle rapide pour le ranking
  3. LLM Qwen (via HF)    → raisonnement expert et justification
  4. Score composite      → combinaison pondérée des trois couches

Aucune règle hardcodée. Le sens est compris, pas cherché par mots-clés.
"""

from __future__ import annotations

import os
import json
import logging
import hashlib
import numpy as np
from typing import Optional
from functools import lru_cache
from dataclasses import dataclass, field

from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss

from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.prompts import ChatPromptTemplate

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration centralisée
# ---------------------------------------------------------------------------
EMBEDDING_MODEL   = os.getenv("EMBEDDING_MODEL",   "paraphrase-multilingual-MiniLM-L12-v2")
LLM_MODEL_ID      = os.getenv("LLM_MODEL_ID",      "Qwen/Qwen2.5-7B-Instruct")
LLM_MAX_TOKENS    = int(os.getenv("LLM_MAX_TOKENS", "2048"))
LLM_TEMPERATURE   = float(os.getenv("LLM_TEMPERATURE", "0.01"))

# Poids du score composite (doivent sommer à 1.0)
W_SEMANTIC  = float(os.getenv("W_SEMANTIC",  "0.40"))   # similarité sémantique globale (40%)
W_STRUCTURED = float(os.getenv("W_STRUCTURED", "0.40")) # critères structurés (40%)
W_LLM       = float(os.getenv("W_LLM",       "0.20"))   # raisonnement LLM expert (20%)

# ---------------------------------------------------------------------------
# Modèles Pydantic
# ---------------------------------------------------------------------------

class JobOffer(BaseModel):
    title: str
    department: Optional[str]         = None
    speciality: Optional[str]         = None
    requiredLevel: Optional[str]      = None
    minYearsExperience: int           = 0
    academicExperience: bool          = False
    requiredSkills: list[str]         = []
    modules: list[str]                = []
    description: Optional[str]        = None

    class Config:
        extra = "ignore"


class SmartEvaluationResult(BaseModel):
    candidateName:    str
    offerTitle:       str
    semanticScore:    float          # 0-100 : similarité sémantique CV ↔ offre
    skillsScore:      float          # 0-100 : matching compétences requises (backward compatibility)
    structuredScore:  float          # 0-100 : score critères structurés
    llmScore:         float          # 0-100 : note attribuée par le LLM expert
    globalScore:      float          # 0-100 : score composite pondéré
    grade:            str
    matchedSkills:    list[str]      = []
    missingSkills:    list[str]      = []
    llmAnalysis:      str            = ""   # raisonnement complet du LLM
    strengths:        list[str]      = []
    weaknesses:       list[str]      = []
    recommendation:   str            = ""
    structuredBreakdown: dict        = {}   # Détail des critères structurés
    cvJson:           dict           = {}   # CV extrait structuré au format JSON


class RankingResult(BaseModel):
    rank:         int
    candidateName: str
    globalScore:  float
    grade:        str
    recommendation: str


# ---------------------------------------------------------------------------
# Singletons — chargés une seule fois au démarrage
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Charge le modèle d'embeddings une seule fois (thread-safe via lru_cache)."""
    logger.info(f"Chargement du modèle d'embeddings : {EMBEDDING_MODEL}")
    return SentenceTransformer(EMBEDDING_MODEL)


@lru_cache(maxsize=1)
def get_llm() -> ChatHuggingFace:
    """Instancie le LLM une seule fois."""
    if "HUGGINGFACEHUB_API_TOKEN" not in os.environ:
        raise EnvironmentError(
            "HUGGINGFACEHUB_API_TOKEN manquant. "
            "Ajoutez-le dans votre fichier .env."
        )
    logger.info(f"Chargement du LLM : {LLM_MODEL_ID}")
    endpoint = HuggingFaceEndpoint(
        repo_id=LLM_MODEL_ID,
        temperature=LLM_TEMPERATURE,
        max_new_tokens=LLM_MAX_TOKENS,
        timeout=180,
        return_full_text=False,
    )
    return ChatHuggingFace(llm=endpoint)


# ---------------------------------------------------------------------------
# Couche 1 — Embeddings sémantiques
# ---------------------------------------------------------------------------

def embed(texts: list[str]) -> np.ndarray:
    """
    Convertit une liste de textes en vecteurs sémantiques normalisés.
    Supporte le français, l'arabe et l'anglais sans configuration.
    """
    model = get_embedding_model()
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return vectors.astype("float32")


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Similarité cosinus entre deux vecteurs normalisés (résultat entre -1 et 1)."""
    return float(np.dot(a, b))


def semantic_cv_offer_score(cv_text: str, offer_text: str) -> float:
    """
    Score sémantique global entre le CV et l'offre (0-100).
    Comprend le sens même si les mots sont différents.
    Ex : 'apprentissage automatique' ≈ 'machine learning' → score élevé
    """
    vectors = embed([cv_text, offer_text])
    similarity = cosine_similarity(vectors[0], vectors[1])
    # Normalisation de [-1, 1] vers [0, 100]
    return round((similarity + 1) / 2 * 100, 2)


def semantic_skills_score(cv_text: str, required_skills: list[str]) -> dict:
    """
    Pour chaque compétence requise, calcule sa similarité sémantique avec le CV.

    Retourne :
      - matched  : compétences trouvées (similarité > seuil)
      - missing  : compétences absentes
      - score    : 0-100
    """
    if not required_skills:
        return {"score": 100.0, "matched": [], "missing": []}

    THRESHOLD = 0.55   # seuil de similarité pour considérer une compétence présente

    cv_vector     = embed([cv_text])[0]
    skill_vectors = embed(required_skills)

    matched = []
    missing = []

    for skill, skill_vec in zip(required_skills, skill_vectors):
        sim = cosine_similarity(cv_vector, skill_vec)
        if sim >= THRESHOLD:
            matched.append(skill)
        else:
            missing.append(skill)

    score = (len(matched) / len(required_skills)) * 100
    return {
        "score":   round(score, 2),
        "matched": matched,
        "missing": missing,
    }


# ---------------------------------------------------------------------------
# Couche 2 — FAISS : ranking rapide de plusieurs candidats
# ---------------------------------------------------------------------------

@dataclass
class CandidateIndex:
    """
    Index FAISS pour classer N candidats par rapport à une offre.
    Utile quand on a beaucoup de CVs à comparer simultanément.
    """
    names:    list[str]  = field(default_factory=list)
    index:    faiss.Index | None = None
    dim:      int = 384   # dimension de paraphrase-multilingual-MiniLM-L12-v2

    def build(self, cv_texts: list[str], candidate_names: list[str]) -> None:
        """Construit l'index à partir des textes bruts des CVs."""
        self.names = candidate_names
        vectors = embed(cv_texts)
        self.dim = vectors.shape[1]
        self.index = faiss.IndexFlatIP(self.dim)   # Inner Product = cosine sur vecteurs normalisés
        self.index.add(vectors)
        logger.info(f"Index FAISS construit : {len(candidate_names)} candidats")

    def rank(self, offer_text: str, top_k: int = 10) -> list[dict]:
        """
        Retourne les top_k candidats les plus proches de l'offre.
        Résultat trié du meilleur au moins bon.
        """
        if self.index is None:
            raise RuntimeError("L'index n'a pas été construit. Appelez build() d'abord.")
        offer_vec = embed([offer_text])
        distances, indices = self.index.search(offer_vec, min(top_k, len(self.names)))
        results = []
        for rank, (dist, idx) in enumerate(zip(distances[0], indices[0]), start=1):
            score = round((float(dist) + 1) / 2 * 100, 2)   # normalisation vers 0-100
            results.append({
                "rank":          rank,
                "candidateName": self.names[idx],
                "semanticScore": score,
            })
        return results


# ---------------------------------------------------------------------------
# Couche 3 — LLM : raisonnement expert
# ---------------------------------------------------------------------------

_LLM_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "Tu es un expert RH senior spécialisé dans le recrutement universitaire "
     "au Maghreb (Tunisie, Algérie, Maroc). Tu évalues des candidats pour des "
     "postes d'enseignants-chercheurs avec rigueur et objectivité.\n\n"
     "RÈGLES ABSOLUES :\n"
     "- N'invente AUCUNE information absente du CV.\n"
     "- Sois strict sur le niveau de diplôme (Doctorat ≠ Master).\n"
     "- Justifie chaque point fort et chaque faiblesse avec des faits du CV.\n"
     "- Le CV peut être en français ou en arabe, analyse-le correctement.\n"
     "- Réponds UNIQUEMENT en JSON valide, sans aucun texte autour.\n\n"
     "FORMAT DE RÉPONSE OBLIGATOIRE :\n"
     "{{\n"
     '  "llmScore": <entier 0-100>,\n'
     '  "strengths": ["point fort 1", "point fort 2", ...],\n'
     '  "weaknesses": ["faiblesse 1", "faiblesse 2", ...],\n'
     '  "llmAnalysis": "<analyse détaillée en 3-5 phrases>",\n'
     '  "recommendation": "<Convoquer | Liste d attente | Rejeter> — <raison courte>"\n'
     "}}"
    ),
    ("user",
     "OFFRE D'EMPLOI :\n{offer}\n\n"
     "CV DU CANDIDAT :\n{cv}\n\n"
     "Critères à évaluer :\n"
     "- Niveau de diplôme requis : {required_level}\n"
     "- Années d'expérience minimales : {min_years}\n"
     "- Expérience académique requise : {academic}\n"
     "- Compétences requises : {required_skills}\n"
     "- Modules à enseigner : {modules}\n\n"
     "Produis le JSON d'évaluation :"
    ),
])


def llm_expert_evaluation(cv_text: str, offer: JobOffer) -> dict:
    """
    Demande au LLM d'évaluer le CV comme un expert RH.
    Retourne un dict avec llmScore, strengths, weaknesses, llmAnalysis, recommendation.
    """
    llm  = get_llm()
    chain = _LLM_PROMPT | llm

    raw = chain.invoke({
        "offer":          offer.model_dump_json(),
        "cv":             cv_text[:4000],   # limite de contexte
        "required_level": offer.requiredLevel or "Non spécifié",
        "min_years":      offer.minYearsExperience,
        "academic":       "Oui" if offer.academicExperience else "Non",
        "required_skills": ", ".join(offer.requiredSkills) or "Non spécifié",
        "modules":        ", ".join(offer.modules) or "Non spécifié",
    })

    cleaned = _clean_json(raw.content)

    try:
        import json_repair
        result = json_repair.loads(cleaned)
        if not isinstance(result, dict):
            raise ValueError("Résultat non-dict")
        return result
    except Exception as e:
        logger.error(f"LLM JSON invalide : {e}\nExtrait : {cleaned[:200]}")
        return {
            "llmScore":     50,
            "strengths":    [],
            "weaknesses":   ["Analyse LLM indisponible"],
            "llmAnalysis":  "Erreur lors de l'analyse LLM.",
            "recommendation": "Liste d'attente — analyse manuelle requise",
        }


def _clean_json(text: str) -> str:
    """Nettoie la réponse brute du LLM pour obtenir du JSON valide."""
    import re
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```", "", text)
    # Supprime les commentaires JS style /* */ mais PAS les URLs
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return text.strip()


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Couche 3.5 — Évaluation des Critères Structurés (40%)
# ---------------------------------------------------------------------------

def score_education_level(cv_degree: Optional[str], required_degree: Optional[str]) -> float:
    if not required_degree:
        return 100.0
    
    # Normalisation
    def get_level(degree_str: Optional[str]) -> int:
        if not degree_str:
            return 1
        d_lower = degree_str.lower()
        if "doctorat" in d_lower or "phd" in d_lower or "doc" in d_lower:
            return 4
        if "ingénieur" in d_lower or "ingenieur" in d_lower:
            return 3
        if "master" in d_lower or "mastère" in d_lower or "m2" in d_lower:
            return 3
        if "licence" in d_lower or "bac+3" in d_lower:
            return 2
        return 1

    req_level = get_level(required_degree)
    cand_level = get_level(cv_degree)
    
    if cand_level >= req_level:
        return 100.0
    elif cand_level == req_level - 1:
        return 50.0
    else:
        return 0.0


def score_experience_years(cv_exp: int, required_exp: int) -> float:
    if required_exp <= 0:
        return 100.0
    if cv_exp >= required_exp:
        return 100.0
    return round((cv_exp / required_exp) * 100, 2)


def score_academic_experience(cv_academic: bool, required_academic: bool) -> float:
    if not required_academic:
        return 100.0
    return 100.0 if cv_academic else 0.0


def score_skills_match(cv_skills: list[str], required_skills: list[str]) -> tuple[float, list[str], list[str]]:
    matched = []
    missing = []

    # Get unique, non-empty required skills
    req_skills_clean = [s.strip() for s in required_skills if s and s.strip()]

    if not req_skills_clean:
        return 100.0, [], []

    cv_skills_lower = [s.lower().strip() for s in cv_skills if isinstance(s, str)]

    for r_skill in req_skills_clean:
        r_lower = r_skill.lower()
        # 1. Direct case-insensitive substring match
        found = False
        for c_skill in cv_skills_lower:
            if r_lower in c_skill or c_skill in r_lower:
                matched.append(r_skill)
                found = True
                break
        if found:
            continue
            
        # 2. Semantic embedding check (threshold 0.65)
        if cv_skills:
            try:
                r_vec = embed([r_skill])[0]
                c_vecs = embed(cv_skills)
                similarities = [cosine_similarity(r_vec, cv_vec) for cv_vec in c_vecs]
                max_sim = max(similarities) if similarities else 0.0
                if max_sim >= 0.65:
                    matched.append(r_skill)
                    found = True
            except Exception as e:
                logger.warning(f"Error in semantic skill matching: {e}")
                
        if not found:
            missing.append(r_skill)

    score = round((len(matched) / len(req_skills_clean)) * 100, 2)
    return score, matched, missing


def score_modules_alignment(cv_modules: list[str], required_modules: list[str]) -> tuple[float, list[str]]:
    matched_modules = []
    req_modules_clean = [m.strip() for m in required_modules if m and m.strip()]

    if not req_modules_clean:
        return 100.0, []

    cv_modules_lower = [m.lower().strip() for m in cv_modules if isinstance(m, str)]

    for r_mod in req_modules_clean:
        r_lower = r_mod.lower()
        found = False
        for c_mod in cv_modules_lower:
            if r_lower in c_mod or c_mod in r_lower:
                matched_modules.append(r_mod)
                found = True
                break
        if found:
            continue
            
        # Semantic check for modules (threshold 0.65)
        if cv_modules:
            try:
                r_vec = embed([r_mod])[0]
                c_vecs = embed(cv_modules)
                similarities = [cosine_similarity(r_vec, cv_vec) for cv_vec in c_vecs]
                max_sim = max(similarities) if similarities else 0.0
                if max_sim >= 0.65:
                    matched_modules.append(r_mod)
                    found = True
            except Exception as e:
                logger.warning(f"Error in semantic module matching: {e}")
                
        if not found:
            pass

    score = round((len(matched_modules) / len(req_modules_clean)) * 100, 2)
    return score, matched_modules


def evaluate_structured_criteria(cv_json: dict, offer: JobOffer) -> tuple[float, dict]:
    # Extract candidate fields from cv_json
    formation = cv_json.get("formation", {}) or {}
    degree = formation.get("niveau_diplome")
    
    experience = cv_json.get("experience", {}) or {}
    exp_years = experience.get("nb_annees_experience", 0)
    academic_exp = experience.get("experience_academique", False)
    modules_taught = experience.get("modules_enseignes", []) or []
    
    # 1. Education (25%)
    education_score = score_education_level(degree, offer.requiredLevel)
    
    # 2. Years of Experience (25%)
    exp_score = score_experience_years(exp_years, offer.minYearsExperience)
    
    # 3. Academic Experience (15%)
    academic_score = score_academic_experience(academic_exp, offer.academicExperience)
    
    # 4. Skills Match (20%)
    cv_skills_list = []
    comp = cv_json.get("competences", {}) or {}
    if isinstance(comp, dict):
        for val in comp.values():
            if isinstance(val, list):
                cv_skills_list.extend(val)
    
    skills_score, matched_skills, missing_skills = score_skills_match(
        cv_skills_list,
        offer.requiredSkills
    )
    
    # 5. Modules Alignment (15%)
    modules_score, matched_modules = score_modules_alignment(
        modules_taught,
        offer.modules
    )
    
    # Combine scores based on weights:
    weighted_score = round(
        0.25 * education_score +
        0.25 * exp_score +
        0.15 * academic_score +
        0.20 * skills_score +
        0.15 * modules_score,
        2
    )
    
    breakdown = {
        "educationScore": education_score,
        "experienceYearsScore": exp_score,
        "academicExperienceScore": academic_score,
        "skillsMatchScore": skills_score,
        "modulesAlignmentScore": modules_score,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "matchedModules": matched_modules
    }
    
    return weighted_score, breakdown


# ---------------------------------------------------------------------------
# Couche 4 — Score composite et grade
# ---------------------------------------------------------------------------

def compute_grade(score: float) -> str:
    if score >= 90: return "Excellent"
    if score >= 75: return "Très Bon"
    if score >= 60: return "Acceptable"
    if score >= 40: return "Faible"
    return "Non compatible"


def composite_score(
    semantic_score: float,
    structured_score: float,
    llm_score:      float,
) -> float:
    """
    Score composite pondéré.
    Les poids sont configurables via variables d'environnement.
    """
    return round(
        W_SEMANTIC * semantic_score
        + W_STRUCTURED * structured_score
        + W_LLM     * llm_score,
        2,
    )


# ---------------------------------------------------------------------------
# API principale
# ---------------------------------------------------------------------------

def evaluate_candidate(
    cv_text:        str,
    offer:          JobOffer,
    candidate_name: str = "Candidat inconnu",
    nlp_model = None,
) -> SmartEvaluationResult:
    """
    Évalue UN candidat par rapport à une offre.

    Pipeline :
      1. Score sémantique global (40% - SentenceTransformer)
      2. Score critères structurés (40% - LLM Qwen Hybrid + evaluation)
      3. Score LLM raisonnement expert (20% - Qwen)
      4. Score composite intelligent
    """
    logger.info(f"Évaluation de '{candidate_name}' pour '{offer.title}'")

    # --- Couche A : Extraction structurée du CV (Qwen + NER Hybride) ---
    cv_json = {}
    try:
        from utils import extract_information_hybrid, extract_information_llm
        if nlp_model is not None:
            logger.info("Using provided spaCy NER model for hybrid extraction...")
            cv_json = extract_information_hybrid(cv_text, nlp_model)
        else:
            # Essai de chargement dynamique
            try:
                import spacy
                model_dir = "./models/model_ner_cv"
                logger.info(f"Attempting to load spaCy model dynamically from {model_dir}...")
                local_nlp = spacy.load(model_dir)
                cv_json = extract_information_hybrid(cv_text, local_nlp)
            except Exception as load_err:
                logger.info(f"Could not load local spaCy model: {load_err}. Falling back to pure LLM extraction.")
                cv_json = extract_information_llm(cv_text)
    except Exception as e:
        logger.error(f"Error during structured CV extraction: {e}. Falling back to empty dict.")
        cv_json = {}

    # Extraction dynamique du nom du candidat s'il est inconnu ou générique
    if candidate_name in ["Candidat inconnu", "Candidat"] and cv_json.get("identification", {}).get("nom"):
        candidate_name = cv_json["identification"]["nom"]

    # Construction du texte de l'offre pour l'embedding sémantique
    offer_text = (
        f"{offer.title} {offer.department or ''} {offer.speciality or ''} "
        f"{' '.join(offer.requiredSkills)} {' '.join(offer.modules)} "
        f"{offer.description or ''}"
    )

    # --- Couche 1 : similarité sémantique globale (40%) ---
    sem_score = semantic_cv_offer_score(cv_text, offer_text)
    logger.info(f"  Semantic score : {sem_score}")

    # --- Couche 2 : critères structurés (40%) ---
    structured_score, breakdown = evaluate_structured_criteria(cv_json, offer)
    logger.info(f"  Structured score : {structured_score}")
    logger.info(f"  Structured Breakdown: {breakdown}")

    # --- Couche 3 : raisonnement LLM (20%) ---
    llm_result = llm_expert_evaluation(cv_text, offer)
    llm_score  = float(llm_result.get("llmScore", 50))
    logger.info(f"  LLM score      : {llm_score}")

    # --- Couche 4 : score composite pondéré ---
    global_score = composite_score(sem_score, structured_score, llm_score)
    grade        = compute_grade(global_score)
    logger.info(f"  Global score   : {global_score} -> {grade}")

    return SmartEvaluationResult(
        candidateName       = candidate_name,
        offerTitle          = offer.title,
        semanticScore       = sem_score,
        skillsScore         = breakdown.get("skillsMatchScore", 0.0), # pour compatibilité descendante
        structuredScore     = structured_score,
        llmScore            = llm_score,
        globalScore         = global_score,
        grade               = grade,
        matchedSkills       = breakdown.get("matchedSkills", []),
        missingSkills       = breakdown.get("missingSkills", []),
        llmAnalysis         = llm_result.get("llmAnalysis", ""),
        strengths           = llm_result.get("strengths", []),
        weaknesses          = llm_result.get("weaknesses", []),
        recommendation      = llm_result.get("recommendation", ""),
        structuredBreakdown = breakdown,
        cvJson              = cv_json
    )


def rank_candidates(
    cv_texts:         list[str],
    candidate_names:  list[str],
    offer:            JobOffer,
    top_k:            int = 10,
    nlp_model = None,
) -> list[RankingResult]:
    """
    Classe N candidats par rapport à une offre via FAISS (rapide)
    puis affine avec le score composite complet pour les top_k.

    Stratégie en deux passes :
      Passe 1 → FAISS sémantique : filtre rapide (O(n))
      Passe 2 → Score composite complet sur les top_k sélectionnés
    """
    if len(cv_texts) != len(candidate_names):
        raise ValueError("cv_texts et candidate_names doivent avoir la même longueur.")

    offer_text = (
        f"{offer.title} {offer.department or ''} {offer.speciality or ''} "
        f"{' '.join(offer.requiredSkills)} {' '.join(offer.modules)} "
        f"{offer.description or ''}"
    )

    # --- Passe 1 : pré-sélection rapide par FAISS ---
    logger.info(f"Ranking de {len(cv_texts)} candidats via FAISS...")
    idx = CandidateIndex()
    idx.build(cv_texts, candidate_names)
    preselection = idx.rank(offer_text, top_k=top_k)

    # --- Passe 2 : score composite complet sur les présélectionnés ---
    logger.info(f"Score composite sur les {len(preselection)} présélectionnés...")
    results = []
    for entry in preselection:
        name     = entry["candidateName"]
        pos      = candidate_names.index(name)
        cv_text  = cv_texts[pos]
        full_eval = evaluate_candidate(cv_text, offer, name, nlp_model)
        results.append(full_eval)

    # Tri final par score global décroissant
    results.sort(key=lambda r: r.globalScore, reverse=True)

    return [
        RankingResult(
            rank           = i + 1,
            candidateName  = r.candidateName,
            globalScore    = r.globalScore,
            grade          = r.grade,
            recommendation = r.recommendation,
        )
        for i, r in enumerate(results)
    ]


# ---------------------------------------------------------------------------
# Utilitaire : comparaison rapide sans LLM (pour tests / aperçu)
# ---------------------------------------------------------------------------

def quick_semantic_rank(
    cv_texts:        list[str],
    candidate_names: list[str],
    offer:           JobOffer,
) -> list[dict]:
    """
    Classement ultra-rapide basé uniquement sur la similarité sémantique.
    Pas de LLM → pas de coût API. Utile pour un premier filtre.
    """
    offer_text = (
        f"{offer.title} {offer.department or ''} {offer.speciality or ''} "
        f"{' '.join(offer.requiredSkills)} {' '.join(offer.modules)}"
    )
    idx = CandidateIndex()
    idx.build(cv_texts, candidate_names)
    return idx.rank(offer_text, top_k=len(cv_texts))


# ---------------------------------------------------------------------------
# Exemple d'utilisation
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    offer = JobOffer(
        title               = "Maître de Conférences en Intelligence Artificielle",
        department          = "Informatique",
        speciality          = "Intelligence Artificielle",
        requiredLevel       = "Doctorat",
        minYearsExperience  = 3,
        academicExperience  = True,
        requiredSkills      = [
            "machine learning", "deep learning", "python",
            "NLP", "pytorch", "tensorflow"
        ],
        modules             = [
            "Machine Learning", "Deep Learning",
            "Traitement du Langage Naturel", "Vision par Ordinateur"
        ],
        description         = (
            "Poste d'enseignant-chercheur en IA avec expérience "
            "en recherche et publications internationales."
        ),
    )

    cv_sample = """
    Dr. Ahmed Ben Salah
    Docteur en Informatique - Spécialité Intelligence Artificielle
    Université de Tunis El Manar | ahmed.bensalah@utm.tn

    FORMATION
    - Doctorat en Informatique, spécialité IA - 2019
      Thèse : "Apprentissage profond pour la détection d'objets en temps réel"
    - Master Recherche en Informatique - 2015

    EXPÉRIENCE ACADÉMIQUE (5 ans)
    - Maître Assistant - INSAT Tunis (2019 - présent)
      Modules : Machine Learning, Deep Learning, Python pour la Data Science
    - Vacataire - FST Tunis (2016 - 2019)

    PUBLICATIONS
    - "YOLO-based real-time detection" - IEEE Conference 2021
    - "Transfer Learning for Arabic NLP" - ACL Workshop 2022

    COMPÉTENCES
    Python, PyTorch, TensorFlow, Scikit-learn, OpenCV, NLP, BERT,
    traitement du langage naturel, vision par ordinateur, Docker, Git
    """

    print("=" * 60)
    print("ÉVALUATION INTELLIGENTE D'UN CANDIDAT")
    print("=" * 60)

    result = evaluate_candidate(cv_sample, offer, "Dr. Ahmed Ben Salah")

    print(f"\nCandidat    : {result.candidateName}")
    print(f"Offre       : {result.offerTitle}")
    print(f"\nScores détaillés :")
    print(f"  Sémantique  : {result.semanticScore}/100")
    print(f"  Compétences : {result.skillsScore}/100")
    print(f"  LLM Expert  : {result.llmScore}/100")
    print(f"  GLOBAL      : {result.globalScore}/100 -> {result.grade}")
    print(f"\nCompétences trouvées : {result.matchedSkills}")
    print(f"Compétences manquantes : {result.missingSkills}")
    print(f"\nAnalyse LLM :\n{result.llmAnalysis}")
    print(f"\nPoints forts : {result.strengths}")
    print(f"Faiblesses   : {result.weaknesses}")
    print(f"\nRecommandation : {result.recommendation}")