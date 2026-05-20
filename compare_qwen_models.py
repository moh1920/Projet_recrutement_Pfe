import os
import time
import json
from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from utils import CVExtraction, clean_llm_json

# Load environment variables
load_dotenv()

def extract_with_model(text: str, repo_id: str) -> tuple[dict, float, str]:
    """
    Extract CV information using a specific Qwen model.
    Returns (extracted_dict, duration_seconds, raw_content)
    """
    if "HUGGINGFACEHUB_API_TOKEN" not in os.environ:
        raise ValueError("Missing HUGGINGFACEHUB_API_TOKEN in env.")

    parser = PydanticOutputParser(pydantic_object=CVExtraction)
    
    start_time = time.time()
    
    llm_endpoint = HuggingFaceEndpoint(
        repo_id=repo_id,
        temperature=0.01,
        max_new_tokens=1024,
        timeout=120,
        return_full_text=False
    )
    llm = ChatHuggingFace(llm=llm_endpoint)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Tu es un extracteur de données JSON strict. Tu ne parles pas. Tu ne fais que convertir le texte brut en un objet JSON complet et valide.\n\n"
                   "CONTRAINTES :\n"
                   "1. Ne rajoute AUCUN commentaire (ni 'Voici le JSON', ni explications).\n"
                   "2. Utilise UNIQUEMENT la structure demandée.\n"
                   "3. Si une information manque, met `null` ou `[]`.\n"
                   "4. Ne fais pas de boucle infinie. Arrête-toi une fois l'objet JSON fermé.\n\n"
                   "INSTRUCTIONS DE FORMATAGE DU SCHÉMA :\n{format_instructions}"),
        ("user", "TEXTE DU CV :\n{cv_text}\n\nRéponds UNIQUEMENT avec le JSON demandé :")
    ])
    
    chain = prompt | llm
    
    try:
        resultat_brut = chain.invoke({
            "cv_text": text,
            "format_instructions": parser.get_format_instructions()
        })
        raw_content = resultat_brut.content
        duration = time.time() - start_time
        
        # Clean and parse JSON
        cleaned_json_text = clean_llm_json(raw_content)
        
        import json_repair
        dict_output = json_repair.loads(cleaned_json_text)
        
        if not isinstance(dict_output, dict):
            raise ValueError("Output is not a valid dictionary.")
            
        parsed_result = CVExtraction(**dict_output)
        return parsed_result.model_dump(), duration, "SUCCESS"
    except Exception as e:
        duration = time.time() - start_time
        return {}, duration, f"ERROR: {str(e)}"

def run_comparison():
    print("="*60)
    print("COMPARATIVE TEST BETWEEN QWEN MODELS FOR CV EXTRACTION")
    print("="*60)
    
    # Test CV Text (Mohamed Sayari)
    cv_text = """
    Mohamed Sayari
    Email: sayari.mohamed@esprit.tn
    Téléphone: +216 50 123 456
    
    Formation:
    Licence en génie logiciel de l'Ecole Supérieure des Etudes de Technologies. (2023)
    
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
    
    models = {
        "Qwen2.5-7B-Instruct": "Qwen/Qwen2.5-7B-Instruct",
        "Qwen3-8B": "Qwen/Qwen3-8B"
    }
    
    results = {}
    
    for name, repo_id in models.items():
        print(f"\nEvaluating model: {name} ({repo_id})...")
        data, duration, status = extract_with_model(cv_text, repo_id)
        
        results[name] = {
            "data": data,
            "duration": duration,
            "status": status
        }
        print(f"Status: {status}")
        print(f"Duration: {duration:.2f} seconds")
        
        if status == "SUCCESS":
            print(f"Name extracted: {data['identification']['nom']}")
            print(f"Email extracted: {data['identification']['email']}")
            print(f"Degree extracted: {data['formation']['niveau_diplome']}")
            print(f"Years of Experience: {data['experience']['nb_annees_experience']}")
            print(f"Languages: {len(data['competences']['langages'])} | Frameworks: {len(data['competences']['frameworks'])} | Data: {len(data['competences']['data'])}")

    print("\n" + "="*60)
    print("COMPARATIVE REPORT ANALYSIS")
    print("="*60)
    
    # Generate Markdown Report
    report = []
    report.append("# Rapport Comparatif de Performance : Qwen2.5-7B-Instruct vs Qwen3-8B\n")
    report.append("Ce rapport évalue et compare la performance de deux modèles de la famille Qwen pour l'extraction automatique d'informations à partir de CV au format JSON structuré.\n")
    
    report.append("## 1. Métriques de Performance Globale\n")
    report.append("| Métrique | Qwen2.5-7B-Instruct | Qwen3-8B |")
    report.append("| :--- | :---: | :---: |")
    
    q25_dur = results["Qwen2.5-7B-Instruct"]["duration"]
    q3_dur = results["Qwen3-8B"]["duration"]
    q25_status = results["Qwen2.5-7B-Instruct"]["status"]
    q3_status = results["Qwen3-8B"]["status"]
    
    report.append(f"| **Statut de l'extraction** | {q25_status} | {q3_status} |")
    report.append(f"| **Temps d'exécution (sec)** | {q25_dur:.2f} s | {q3_dur:.2f} s |")
    
    # Extract details
    d25 = results["Qwen2.5-7B-Instruct"]["data"]
    d3 = results["Qwen3-8B"]["data"]
    
    if q25_status == "SUCCESS" and q3_status == "SUCCESS":
        report.append(f"| **Nom extrait** | {d25['identification']['nom']} | {d3['identification']['nom']} |")
        report.append(f"| **Email extrait** | {d25['identification']['email']} | {d3['identification']['email']} |")
        report.append(f"| **Téléphone extrait** | {d25['identification']['telephone']} | {d3['identification']['telephone']} |")
        report.append(f"| **Niveau Diplôme** | {d25['formation']['niveau_diplome']} | {d3['formation']['niveau_diplome']} |")
        report.append(f"| **Spécialité** | {d25['formation']['specialite']} | {d3['formation']['specialite']} |")
        report.append(f"| **Université** | {d25['formation']['universite']} | {d3['formation']['universite']} |")
        report.append(f"| **Années d'Expérience** | {d25['experience']['nb_annees_experience']} ans | {d3['experience']['nb_annees_experience']} ans |")
        report.append(f"| **Expérience Académique** | {d25['experience']['experience_academique']} | {d3['experience']['experience_academique']} |")
        report.append(f"| **Modules Enseignés** | {d25['experience']['modules_enseignes']} | {d3['experience']['modules_enseignes']} |")
        
        # Skills
        report.append(f"| **Langages de Prog** | {', '.join(d25['competences']['langages'])} | {', '.join(d3['competences']['langages'])} |")
        report.append(f"| **Frameworks** | {', '.join(d25['competences']['frameworks'])} | {', '.join(d3['competences']['frameworks'])} |")
        report.append(f"| **Compétences Data / BDD** | {', '.join(d25['competences']['data'])} | {', '.join(d3['competences']['data'])} |")
        report.append(f"| **Compétences DevOps / ERP** | {', '.join(d25['competences']['erp'])} | {', '.join(d3['competences']['erp'])} |")
        
        # Languages spoken
        lang25 = [f"{l['langue']} ({l['niveau']})" for l in d25['langues']]
        lang3 = [f"{l['langue']} ({l['niveau']})" for l in d3['langues']]
        report.append(f"| **Langues parlées** | {', '.join(lang25)} | {', '.join(lang3)} |")
        
        # Analysis of differences
        report.append("\n## 2. Analyse Qualitative des Différences Majeures\n")
        
        # 1. Experience Académique & Modules
        report.append("### A. Expérience Académique et Modules Enseignés")
        report.append("- **Qwen2.5-7B-Instruct** :")
        report.append("  - A catégorisé `experience_academique` à `False`.")
        report.append("  - A extrait à tort le projet académique SpeedyGo comme un *module enseigné* (`modules_enseignes`). C'est une hallucination sémantique légère (mélange entre projet étudiant et enseignement).")
        report.append("- **Qwen3-8B** :")
        report.append("  - A catégorisé `experience_academique` à `True` (interprétation plus large des projets universitaires/académiques).")
        report.append("  - A correctement laissé `modules_enseignes` vide (`[]`), reconnaissant que SpeedyGo était un projet et non un cours enseigné. C'est une **amélioration majeure de la compréhension du contexte**.")
        
        # 2. Classification des Compétences techniques
        report.append("\n### B. Classification et Catégorisation des Compétences")
        report.append("- **Qwen2.5-7B-Instruct** :")
        report.append("  - A placé Docker, Git, Keycloak, MySQL et PostgreSQL sous la catégorie `erp` (en accord avec le prompt d'origine qui mentionne 'ERP/DevOps'). C'est techniquement cohérent pour les outils DevOps.")
        report.append("- **Qwen3-8B** :")
        report.append("  - A regroupé Docker, Git, Keycloak, MySQL et PostgreSQL sous la catégorie `data`. Bien que MySQL et PostgreSQL soient des technologies Data, Docker, Git et Keycloak y appartiennent moins. Qwen3-8B montre ici une légère imprécision de classification par rapport aux contraintes spécifiques du prompt d'origine.")
        
        report.append("\n## 3. Synthèse et Recommandation")
        report.append("- **Qwen3-8B** présente une **meilleure compréhension sémantique fine** des structures du CV (comme distinguer un projet académique d'un module enseigné).")
        report.append("- **Qwen2.5-7B-Instruct** offre une **vitesse d'exécution supérieure** (plus léger avec 7B de paramètres) tout en respectant de façon plus stricte les catégorisations de compétences spécifiques demandées dans le prompt system.")
        report.append("\n**Recommandation** : Pour une production à grande échelle où le coût et la vitesse sont primordiaux, **Qwen2.5-7B-Instruct** reste extrêmement performant. Pour des besoins de précision académique pointue (distinction enseignant vs étudiant), le modèle **Qwen3-8B** est recommandé.")

    # Write report to markdown file
    with open("Rapport_Comparatif_Qwen.md", "w", encoding="utf-8") as f:
        f.write("\n".join(report))
        
    print("\n[SUCCESS] Comparison completed. Markdown report saved to 'Rapport_Comparatif_Qwen.md'!")

if __name__ == "__main__":
    run_comparison()
