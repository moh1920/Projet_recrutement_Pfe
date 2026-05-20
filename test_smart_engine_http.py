import json
import requests

def test_smart_engine_api():
    print("="*60)
    print("TESTING SMART ENGINE ENDPOINT (/api/v4/smart-evaluate)")
    print("="*60)
    
    url = "http://127.0.0.1:8000/api/v4/smart-evaluate"
    
    payload = {
        "jobOffer": {
            "title": "Maître de Conférences en Intelligence Artificielle et Génie Logiciel",
            "department": "Département Informatique",
            "speciality": "Intelligence Artificielle / NLP / Génie Logiciel",
            "requiredLevel": "Doctorat",
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

if __name__ == "__main__":
    test_smart_engine_api()
