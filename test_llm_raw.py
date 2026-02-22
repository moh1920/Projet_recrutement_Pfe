import asyncio
from utils import CVExtraction
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
import os
from dotenv import load_dotenv

load_dotenv()

def test_llm_raw():
    text = """
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

    parser = PydanticOutputParser(pydantic_object=CVExtraction)
    
    llm_endpoint = HuggingFaceEndpoint(
        repo_id="Qwen/Qwen2.5-7B-Instruct",
        temperature=0.01,
        max_new_tokens=2048,
        return_full_text=False
    )
    llm = ChatHuggingFace(llm=llm_endpoint)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Tu es un expert RH et un système IA. Ton rôle est d'analyser un CV et d'en extraire les informations au format JSON strict.\n\n"
                   "OBJECTIF : Analyser le texte du CV fourni et structurer automatiquement TOUTES les informations importantes.\n\n"
                   "CONTRAINTES OBLIGATOIRES :\n"
                   "1. N'invente jamais d'information. Extraire uniquement ce qui est présent.\n"
                   "2. Si une information n'est pas dans le CV, retourne null ou [] (selon le type).\n"
                   "3. Sépare bien les compétences : (Langages vs Frameworks vs Data vs IA vs ERP/DevOps).\n"
                   "4. LA RÉPONSE DOIT ÊTRE UNIQUEMENT LE JSON VALIDE. Ne commence pas par \"Voici le JSON\", n'ajoute pas de texte. Uniquement des accolades {{ et }}.\n\n"
                   "INSTRUCTIONS DE FORMATAGE :\n{format_instructions}"),
        ("user", "TEXTE DU CV :\n{cv_text}")
    ])
    
    chain = prompt | llm
    
    print("Generating raw output...")
    try:
        result = chain.invoke({
            "cv_text": text,
            "format_instructions": parser.get_format_instructions()
        })
        print("\n--- RAW OUTPUT ---")
        print(result.content)
        print("-------------------")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_llm_raw()
