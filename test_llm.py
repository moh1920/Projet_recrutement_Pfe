import asyncio
from utils import extract_information_llm
from dotenv import load_dotenv

load_dotenv()

def test_llm():
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
    Langages : Java, HTML, CSS, JavaScript, TypeScript, SQL.
    Frameworks : Spring Boot, Spring Security, Angular.
    Outils/Devops : Docker, Git, Keycloak, MySQL, PostgreSQL.
    
    Langues:
    Français (B2), Anglais (B2)
    """

    print("Analyzing CV with LLM...")
    try:
        result_json = extract_information_llm(cv_text)
        import json
        print("\n--- JSON OUTPUT ---")
        print(json.dumps(result_json, indent=2, ensure_ascii=False))
        print("-------------------")
    except Exception as e:
        print(f"Error during LLM extraction:")
        print(e)

if __name__ == "__main__":
    test_llm()
