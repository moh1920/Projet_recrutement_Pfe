import json
import requests

# URL de l'API locale
API_URL_MATCH = "http://127.0.0.1:8001/api/match"
API_URL_RANK = "http://127.0.0.1:8001/api/rank-candidates"
API_URL_RANK_OFFERS = "http://127.0.0.1:8001/api/rank-offers"
API_URL_RANK_PROFILE_OFFERS = "http://127.0.0.1:8001/api/rank-profile-offers"

# Les données exactes fournies par l'utilisateur
offer_data = {
  "_id": "OFF-DEV-2026-03",
  "title": "Enseignant Développement Web (Spring Boot / Angular)",
  "description": "Recrutement d’un enseignant pour assurer les modules de développement Web Full Stack.",
  "department": "Informatique",
  "speciality": "Développement Web",
  "type": "Permanent",
  "workload": 14,
  "requiredLevel": "Master",
  "modules": ["Spring Boot", "Angular", "Microservices", "REST API"],
  "minYearsExperience": 4,
  "academicExperience": True,
  "requiredSkills": ["Java", "Spring Boot", "Angular", "REST", "Docker"],
  "status": "OPEN",
  "candidateCount": 0
}

offer_data_2 = {
  "_id": "OFF-DATA-2026-04",
  "title": "Ingénieur Data Science & IA",
  "description": "Poste pour un expert en Machine Learning, Deep Learning et NLP.",
  "department": "IA",
  "speciality": "Data Science",
  "requiredLevel": "Ingénieur",
  "modules": ["Python", "Machine Learning", "Deep Learning", "NLP", "TensorFlow"],
  "minYearsExperience": 2,
  "requiredSkills": ["Python", "Machine Learning", "Deep Learning", "NLP", "SQL"]
}

candidate_data = {
  "_id": "eca634cb-e01d-429a-987d-509f9ba4675f",
  "idProfile": "69ac470a3fc84419bb27e8d9",
  "idOffre": "OFF-IA-2026-01",
  "firstName": "maryem sayari",
  "lastName": "sayari",
  "experience": 5,
  "education": [
    {
      "degree": "Licence",
      "institution": "insat",
      "field": "GL",
      "endDate": "2020-01-01",
      "current": False
    }
  ],
  "skills": [
    "Java", "Python", "JavaScript", "Spring Boot", "Angular", "React", "Vue.js",
    "SQL", "MongoDB", "PostgreSQL", "MySQL", "Machine Learning", "Deep Learning",
    "NLP", "Computer Vision", "SAP", "Oracle", "Odoo"
  ],
  "appliedPosition": "Enseignant",
  "status": "NOUVEAU",
  "notes": "Au cours de mes projets académiques et professionnels, j’ai développé plusieurs applications complètes basées sur :\n\nSpring Boot / Angular, architectures REST sécurisées (JWT, Keycloak),\n\nPostgreSQL, Redis, WebSocket/SSE pour le temps réel,\n\nDocker, GitHub Actions, CI/CD et déploiements cloud-ready,\n\nIntégration d’IA : OCR automatisé, modèles de vision YOLO, détection d’anomalies."
}

profile_data = {
  "_id": {"$oid": "69a314f700c76b75456af21e"},
  "userId": "1adc2113-d723-407e-8737-73c96d2d578b",
  "nom": "Ahmed Ben Ali", # Note: Different from Maryem, but we'll use it to test ProfileDetails integration
  "niveauDiplome": "Doctorat",
  "specialite": "Intelligence Artificielle",
  "nbAnneesExperience": 8,
  "modulesEnseignes": ["Machine Learning", "Deep Learning", "NLP"],
  "langages": ["Python", "Java"],
  "frameworks": ["TensorFlow", "Spring Boot"],
  "dataSkills": ["SQL", "Power BI"],
  "iaSkills": ["Machine Learning", "Deep Learning", "NLP"],
  "erpSkills": [],
  "motivation": "Passionné par la recherche et l’enseignement en IA, je souhaite contribuer au développement académique et scientifique."
}

payload_single = {
    "offer": offer_data,
    "candidate": candidate_data,
    "profile": profile_data
}

candidate_data_2 = {
  "_id": "cand-2-id",
  "firstName": "Jean",
  "lastName": "Dupont",
  "experience": 2,
  "education": [{"degree": "Licence"}],
  "skills": ["HTML", "CSS", "JavaScript", "React"],
  "notes": "Développeur frontend junior",
  "status": "NOUVEAU"
}

profile_data_2 = {
   "nbAnneesExperience": 2,
   "niveauDiplome": "Licence",
   "langages": ["JavaScript", "Typescript"],
   "frameworks": ["React"],
   "motivation": "Passionné par le web UI."
}

payload_multiple = {
    "offer": offer_data,
    "pairs": [
        {"candidate": candidate_data, "profile": profile_data},
        {"candidate": candidate_data_2, "profile": profile_data_2}
    ]
}

payload_offers = {
    "candidate": candidate_data,
    "profile": profile_data,
    "offers": [offer_data, offer_data_2]
}

payload_profile_offers = {
    "profile": profile_data,
    "offers": [offer_data, offer_data_2]
}

if __name__ == "__main__":
    print("=== TEST 1: MATCHING SIMPLE ===")
    try:
        response = requests.post(API_URL_MATCH, json=payload_single)
        response.raise_for_status()
        
        result = response.json()
        print(f"Candidate: {candidate_data['firstName']} Score: {result['globalScore']}%")
    except requests.exceptions.ConnectionError:
        print("\nERREUR: Impossible de se connecter à l'API.")
        print("Veuillez d'abord démarrer le serveur FastAPI avec la commande :")
        print("  uvicorn main:app --port 8001 --reload")
    except Exception as e:
        print(f"Erreur : {e}")

    print("\n=== TEST 2: RANKING MULTIPLE CANDIDATS ===")
    try:
        response2 = requests.post(API_URL_RANK, json=payload_multiple)
        response2.raise_for_status()
        
        results2 = response2.json()
        print(f"Offre : {offer_data['title']}")
        print(f"Candidats classés ({len(results2)}) :")
        for i, res in enumerate(results2, 1):
            cand_id = res['candidateId']
            name = candidate_data['firstName'] if cand_id == candidate_data['_id'] else candidate_data_2['firstName']
            print(f"{i}. {name} (ID: {cand_id}) - Score Global: {res['globalScore']}%")
            print(f"   Détails: Exp: {res['details']['experienceScore']} | Edu: {res['details']['educationScore']} | Compétences: {res['details']['skillsScore']} | Semantique: {res['details']['semanticScore']}")
    except Exception as e:
        print(f"Erreur : {e}")

    print("\n=== TEST 3: RANKING MULTIPLE OFFRES ===")
    try:
        response3 = requests.post(API_URL_RANK_OFFERS, json=payload_offers)
        response3.raise_for_status()
        
        results3 = response3.json()
        print(f"Candidat : {candidate_data['firstName']} {candidate_data['lastName']}")
        print(f"Offres classées ({len(results3)}) :")
        for i, res in enumerate(results3, 1):
            off_id = res['offerId']
            title = offer_data['title'] if off_id == offer_data['_id'] else offer_data_2['title']
            print(f"{i}. {title} (ID: {off_id}) - Score Global: {res['globalScore']}%")
            print(f"   Détails: Exp: {res['details']['experienceScore']} | Edu: {res['details']['educationScore']} | Compétences: {res['details']['skillsScore']} | Semantique: {res['details']['semanticScore']}")
    except Exception as e:
        print(f"Erreur : {e}")

    print("\n=== TEST 4: RANKING OFFRES PAR PROFIL SEUL ===")
    try:
        response4 = requests.post(API_URL_RANK_PROFILE_OFFERS, json=payload_profile_offers)
        response4.raise_for_status()
        
        results4 = response4.json()
        print(f"Profil ID : {profile_data.get('userId') or profile_data.get('_id')}")
        print(f"Offres classées ({len(results4)}) :")
        for i, res in enumerate(results4, 1):
            off_id = res['offerId']
            title = offer_data['title'] if off_id == offer_data['_id'] else offer_data_2['title']
            print(f"{i}. {title} (ID: {off_id}) - Score Global: {res['globalScore']}%")
            print(f"   Détails: Exp: {res['details']['experienceScore']} | Edu: {res['details']['educationScore']} | Compétences: {res['details']['skillsScore']} | Semantique: {res['details']['semanticScore']}")
    except Exception as e:
        print(f"Erreur : {e}")
