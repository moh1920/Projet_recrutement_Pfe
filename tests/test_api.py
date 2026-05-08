"""
Suite de tests pour le CV API — tourne sans modèle grâce à TESTING=true.
Couvre : health, models-info, match, rank-candidates, rank-offers,
         rank-profile-offers, et la logique métier (scores, seuils).
"""
import os
os.environ["TESTING"] = "true"          # doit être positionné AVANT l'import de main

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────
@pytest.fixture
def offer():
    return {
        "_id": "offer-001",
        "title": "Data Scientist",
        "description": "Analyse de données et modèles de machine learning",
        "speciality": "Data Science",
        "requiredSkills": ["python", "pandas", "scikit-learn"],
        "minYearsExperience": 2,
        "requiredLevel": "master",
    }

@pytest.fixture
def candidate():
    return {
        "_id": "cand-001",
        "notes": "Expérimenté en machine learning et traitement de données",
        "skills": ["python", "pandas", "tensorflow"],
        "experience": 3,
        "education": [{"degree": "master"}],
    }

@pytest.fixture
def profile():
    return {
        "userId": "user-001",
        "motivation": "Passionné par l'intelligence artificielle et la data",
        "langages": ["python", "r"],
        "frameworks": ["scikit-learn", "pytorch"],
        "niveauDiplome": "master",
        "nbAnneesExperience": 3,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints système
# ─────────────────────────────────────────────────────────────────────────────
def test_health_returns_200():
    r = client.get("/health")
    assert r.status_code == 200

def test_health_format():
    data = client.get("/health").json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "primary_model" in data

def test_docs_available():
    assert client.get("/docs").status_code == 200

def test_openapi_schema():
    data = client.get("/openapi.json").json()
    assert "openapi" in data
    assert "paths" in data

def test_models_info():
    data = client.get("/api/models-info").json()
    assert "primary_model" in data
    assert "models" in data
    assert data["testing_mode"] is True


# ─────────────────────────────────────────────────────────────────────────────
# /api/match
# ─────────────────────────────────────────────────────────────────────────────
def test_match_returns_200(offer, candidate, profile):
    r = client.post("/api/match", json={
        "offer": offer, "candidate": candidate, "profile": profile
    })
    assert r.status_code == 200

def test_match_response_fields(offer, candidate, profile):
    data = client.post("/api/match", json={
        "offer": offer, "candidate": candidate, "profile": profile
    }).json()
    assert "offerId" in data
    assert "candidateId" in data
    assert "globalScore" in data
    assert "isMatch" in data
    assert "details" in data

def test_match_score_range(offer, candidate, profile):
    data = client.post("/api/match", json={
        "offer": offer, "candidate": candidate, "profile": profile
    }).json()
    assert 0.0 <= data["globalScore"] <= 100.0

def test_match_ids(offer, candidate, profile):
    data = client.post("/api/match", json={
        "offer": offer, "candidate": candidate, "profile": profile
    }).json()
    assert data["offerId"] == "offer-001"
    assert data["candidateId"] == "cand-001"

def test_match_without_profile(offer, candidate):
    """profile est optionnel — ne doit pas lever d'erreur."""
    r = client.post("/api/match", json={"offer": offer, "candidate": candidate})
    assert r.status_code == 200

def test_match_details_keys(offer, candidate, profile):
    details = client.post("/api/match", json={
        "offer": offer, "candidate": candidate, "profile": profile
    }).json()["details"]
    for key in ("experienceScore", "educationScore", "skillsScore",
                "semanticScore", "matchingSkills", "missingSkills"):
        assert key in details

def test_match_skill_intersection(offer, candidate, profile):
    """python et pandas sont dans l'offre ET chez le candidat → matchingSkills non vide."""
    details = client.post("/api/match", json={
        "offer": offer, "candidate": candidate, "profile": profile
    }).json()["details"]
    assert len(details["matchingSkills"]) >= 2

def test_match_missing_skills(offer, candidate, profile):
    """scikit-learn est dans l'offre mais pas directement dans candidate.skills."""
    details = client.post("/api/match", json={
        "offer": offer, "candidate": candidate, "profile": profile
    }).json()["details"]
    # scikit-learn est dans profile.frameworks → peut être dans matching ou missing
    all_skills = set(details["matchingSkills"]) | set(details["missingSkills"])
    assert "scikit-learn" in all_skills


# ─────────────────────────────────────────────────────────────────────────────
# Logique expérience & éducation
# ─────────────────────────────────────────────────────────────────────────────
def test_experience_sufficient(offer, profile):
    """Candidat avec 5 ans > min 2 ans → experienceScore = 100."""
    cand = {"_id": "c", "skills": [], "experience": 5, "education": []}
    data = client.post("/api/match", json={
        "offer": offer, "candidate": cand, "profile": profile
    }).json()
    assert data["details"]["experienceScore"] == 100.0

def test_experience_insufficient(offer, profile):
    """Candidat avec 1 an < min 2 ans → experienceScore = 50."""
    cand = {"_id": "c", "skills": [], "experience": 1, "education": []}
    data = client.post("/api/match", json={
        "offer": offer, "candidate": cand, "profile": {"nbAnneesExperience": 1}
    }).json()
    assert data["details"]["experienceScore"] == pytest.approx(50.0)

def test_education_match(offer, candidate):
    """Candidat master, offre master → educationScore = 100.
    Profile vide pour isoler la source du niveau."""
    data = client.post("/api/match", json={
        "offer": offer,
        "candidate": candidate,
        "profile": {},
    }).json()
    assert data["details"]["educationScore"] == 100.0

def test_education_below_requirement(offer):
    """Candidat licence, offre master → educationScore = 50.
    Profile sans niveauDiplome pour ne pas écraser le niveau candidat."""
    cand = {
        "_id": "cand-low-edu",
        "skills": [],
        "experience": 3,
        "education": [{"degree": "licence"}],
    }
    data = client.post("/api/match", json={
        "offer": offer,
        "candidate": cand,
        "profile": {},
    }).json()
    assert data["details"]["educationScore"] == pytest.approx(50.0)


# ─────────────────────────────────────────────────────────────────────────────
# /api/rank-candidates
# ─────────────────────────────────────────────────────────────────────────────
def test_rank_candidates_returns_list(offer, candidate, profile):
    r = client.post("/api/rank-candidates", json={
        "offer": offer,
        "pairs": [
            {"candidate": candidate, "profile": profile},
            {"candidate": {**candidate, "_id": "cand-002", "experience": 0}, "profile": {}},
        ]
    })
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 2

def test_rank_candidates_sorted(offer, candidate, profile):
    """Les résultats doivent être triés par globalScore décroissant."""
    data = client.post("/api/rank-candidates", json={
        "offer": offer,
        "pairs": [
            {"candidate": {**candidate, "_id": "weak",  "experience": 0}, "profile": {}},
            {"candidate": {**candidate, "_id": "strong", "experience": 5}, "profile": profile},
        ]
    }).json()
    assert data[0]["globalScore"] >= data[1]["globalScore"]


# ─────────────────────────────────────────────────────────────────────────────
# /api/rank-offers
# ─────────────────────────────────────────────────────────────────────────────
def test_rank_offers_returns_list(offer, candidate, profile):
    r = client.post("/api/rank-offers", json={
        "candidate": candidate,
        "profile": profile,
        "offers": [offer, {**offer, "_id": "offer-002", "minYearsExperience": 10}],
    })
    assert r.status_code == 200
    assert len(r.json()) == 2

def test_rank_offers_sorted(offer, candidate, profile):
    data = client.post("/api/rank-offers", json={
        "candidate": candidate,
        "profile": profile,
        "offers": [
            {**offer, "_id": "hard",  "minYearsExperience": 10},
            {**offer, "_id": "easy",  "minYearsExperience": 0},
        ],
    }).json()
    assert data[0]["globalScore"] >= data[1]["globalScore"]


# ─────────────────────────────────────────────────────────────────────────────
# /api/rank-profile-offers
# ─────────────────────────────────────────────────────────────────────────────
def test_rank_profile_offers(offer, profile):
    r = client.post("/api/rank-profile-offers", json={
        "profile": profile,
        "offers": [offer, {**offer, "_id": "offer-002"}],
    })
    assert r.status_code == 200
    assert len(r.json()) == 2


# ─────────────────────────────────────────────────────────────────────────────
# /api/train (désactivé en mode TESTING)
# ─────────────────────────────────────────────────────────────────────────────
def test_train_skipped_in_testing_mode():
    r = client.post("/api/train", json={
        "examples": [{"offer_text": "dev", "candidate_text": "dev", "score": 0.9}],
        "epochs": 1,
    })
    assert r.status_code == 200
    assert r.json()["status"] == "skipped"