import json
import requests
import os
from dotenv import load_dotenv

load_dotenv()

def test_smart_engine_direct():
    print("="*60)
    print("1. DIRECT TEST OF SMART ENGINE (Python API)")
    print("="*60)
    
    from smart_engine import evaluate_candidate, JobOffer
    
    # 1. Define job offer
    offer = JobOffer(
        title="Maître de Conférences en Intelligence Artificielle et Génie Logiciel",
        department="Département Informatique",
        speciality="Intelligence Artificielle / NLP / Génie Logiciel",
        requiredLevel="Doctorat ou Licence/Master avec forte expérience",
        minYearsExperience=2,
        academicExperience=True,
        requiredSkills=["Java", "Python", "Machine Learning", "NLP", "Angular", "Spring Boot"],
        modules=["Génie Logiciel", "Intelligence Artificielle", "Développement Web"],
        description="Recherche enseignant-chercheur pour animer des cours de développement web et IA."
    )
    
    # 2. Define Candidate CV
    cv_text = """
    Mohamed Sayari
    Email: sayari.mohamed@esprit.tn
    Téléphone: +216 50 123 456
    
    Formation:
    Licence en génie logiciel de l'Ecole Supérieure des Etudes de Technologies.
    
    Expérience:
    - 2 ans d'expérience dans la création d'application web avec Spring Boot et Angular.
    - Projets académiques : SpeedyGo (Plateforme de gestion de mobilité urbaine avec Java, Spring Boot, Google Maps API).
    
    Compétences:
    Langages : Java, HTML, CSS, JavaScript, TypeScript, SQL, Python.
    Frameworks : Spring Boot, Spring Security, Angular, PyTorch.
    Outils/Devops : Docker, Git, Keycloak, MySQL, PostgreSQL.
    
    Langues:
    Français (B2), Anglais (B2)
    """
    
    print("Running evaluate_candidate...")
    result = evaluate_candidate(cv_text, offer, "Mohamed Sayari")
    
    print("\n--- RESULTS ---")
    print(f"Candidat       : {result.candidateName}")
    print(f"Offre          : {result.offerTitle}")
    print(f"Score Sémantique: {result.semanticScore}/100")
    print(f"Score Compétences: {result.skillsScore}/100")
    print(f"Score LLM      : {result.llmScore}/100")
    print(f"SCORE GLOBAL   : {result.globalScore}/100 -> Grade: {result.grade}")
    print(f"Compétences Matched  : {result.matchedSkills}")
    print(f"Compétences Manquantes: {result.missingSkills}")
    print(f"Points Forts   : {result.strengths}")
    print(f"Faiblesses     : {result.weaknesses}")
    print(f"Recommandation : {result.recommendation}")
    print(f"Analyse LLM :\n{result.llmAnalysis}")
    print("="*60)

def test_smart_engine_api():
    print("\n" + "="*60)
    print("2. END-TO-END HTTP API TEST (/api/v4/smart-evaluate)")
    print("="*60)
    
    url = "http://127.0.0.1:8000/api/v4/smart-evaluate"
    
    payload = {
        "jobOffer": {
            "title": "Maître de Conférences en Intelligence Artificielle et Génie Logiciel",
            "department": "Département Informatique",
            "speciality": "Intelligence Artificielle / NLP / Génie Logiciel",
            "requiredLevel": "Doctorat ou Licence/Master avec forte expérience",
            "minYearsExperience": 2,
            "academicExperience": True,
            "requiredSkills": ["Java", "Python", "Machine Learning", "NLP", "Angular", "Spring Boot"],
            "modules": ["Génie Logiciel", "Intelligence Artificielle", "Développement Web"],
            "description": "Recherche enseignant-chercheur pour animer des cours de développement web et IA."
        },
        "cvText": """
        Mohamed Sayari
        Email: sayari.mohamed@esprit.tn
        Téléphone: +216 50 123 456
        
        Formation:
        Licence en génie logiciel de l'Ecole Supérieure des Etudes de Technologies.
        
        Expérience:
        - 2 ans d'expérience dans la création d'application web avec Spring Boot et Angular.
        - Projets académiques : SpeedyGo (Plateforme de gestion de mobilité urbaine avec Java, Spring Boot, Google Maps API).
        
        Compétences:
        Langages : Java, HTML, CSS, JavaScript, TypeScript, SQL, Python.
        Frameworks : Spring Boot, Spring Security, Angular, PyTorch.
        Outils/Devops : Docker, Git, Keycloak, MySQL, PostgreSQL.
        
        Langues:
        Français (B2), Anglais (B2)
        """
    }
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        print(f"HTTP Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("\n--- API JSON RESPONSE ---")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print("-------------------------")
        else:
            print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Failed to connect to the server: {e}")
        print("Please make sure your uvicorn server is running on http://127.0.0.1:8000")

if __name__ == "__main__":
    test_smart_engine_direct()
    test_smart_engine_api()
