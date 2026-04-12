import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

offer_data = {
  "_id": "OFF-1",
  "title": "Ingénieur Data Science",
  "description": "Poste pour un expert en Machine Learning.",
  "requiredLevel": "Ingénieur",
  "modules": ["Python", "Machine Learning"],
  "minYearsExperience": 2,
  "requiredSkills": ["Python", "Machine Learning", "SQL"]
}

offer_data_2 = {
  "_id": "OFF-2",
  "title": "Développeur Web",
  "description": "Recrutement d’un développeur Web React Node.js.",
  "requiredLevel": "Licence",
  "modules": ["React", "Node.js"],
  "minYearsExperience": 1,
  "requiredSkills": ["React", "Node.js", "CSS"]
}

candidate_data = {
  "_id": "CAND-1",
  "firstName": "Alice",
  "experience": 3,
  "education": [{"degree": "Ingénieur"}],
  "skills": ["Python", "Machine Learning", "SQL", "Pandas"],
  "notes": "Passionnée par la data."
}

profile_data = {
  "userId": "PROF-1",
  "niveauDiplome": "Ingénieur",
  "nbAnneesExperience": 3,
  "langages": ["Python"],
  "iaSkills": ["Machine Learning"],
  "motivation": "Très motivée."
}

def test_match_simple():
    response = client.post("/api/match", json={
        "offer": offer_data,
        "candidate": candidate_data,
        "profile": profile_data
    })
    assert response.status_code == 200
    data = response.json()
    assert data["offerId"] == "OFF-1"
    assert data["candidateId"] == "CAND-1"
    assert "globalScore" in data
    assert "details" in data
    assert data["details"]["experienceScore"] >= 100

def test_rank_candidates():
    candidate_data_2 = {
        "_id": "CAND-2",
        "firstName": "Bob",
        "experience": 0,
        "education": [{"degree": "Licence"}],
        "skills": ["HTML", "CSS"],
        "notes": "Débutant."
    }
    profile_data_2 = {
        "userId": "PROF-2",
        "niveauDiplome": "Licence",
        "nbAnneesExperience": 0,
    }
    
    response = client.post("/api/rank-candidates", json={
        "offer": offer_data,
        "pairs": [
            {"candidate": candidate_data, "profile": profile_data},
            {"candidate": candidate_data_2, "profile": profile_data_2}
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Alice should score higher than Bob for the Data Science offer
    assert data[0]["candidateId"] == "CAND-1"
    assert data[1]["candidateId"] == "CAND-2"

def test_rank_offers():
    response = client.post("/api/rank-offers", json={
        "candidate": candidate_data,
        "profile": profile_data,
        "offers": [offer_data, offer_data_2]
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # OFF-1 (Data Science) should be ranked higher than OFF-2 for Alice
    assert data[0]["offerId"] == "OFF-1"

def test_rank_profile_offers():
    response = client.post("/api/rank-profile-offers", json={
        "profile": profile_data,
        "offers": [offer_data, offer_data_2]
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["offerId"] == "OFF-1"

def test_train_model_error_no_data():
    response = client.post("/api/train", json={
        "examples": [],
        "epochs": 1
    })
    # Devrait retourner une erreur 400 ou 500 car pas d'exemples
    assert response.status_code in [400, 422, 500]
