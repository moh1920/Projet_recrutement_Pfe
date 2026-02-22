import spacy
from utils import extract_information

def test_model():
    model_dir = "./models/model_ner_cv"
    print(f"Loading trained NLP model from {model_dir}...")
    try:
        nlp = spacy.load(model_dir)
    except OSError:
        print("Model not found! Please run train_model.py first.")
        return
        
    cv_text = """
    Ahmed Ben Ali
    Email: ahmed.benali@example.com
    Téléphone: +216 98 123 456
    
    Formation:
    J'ai obtenu mon Doctorat en Informatique à l'Université de Tunis El Manar en 2022.
    
    Expérience:
    Je suis chercheur et enseignant avec 8 ans d'expérience académique. J'enseigne les modules de Base de données et Développement Web.
    J'ai travaillé comme professeur à ESPRIT.
    
    Compétences:
    Je maitrise Java, Spring Boot, Angular, et j'ai une grande passion pour le Machine Learning et Power BI.
    
    Langues:
    Français (Bilingue), Anglais (Avancé), Arabe (Maternel).
    """

    print("Analyzing CV...")
    result_json = extract_information(cv_text, nlp)
    
    import json
    print("\n--- JSON OUTPUT ---")
    print(json.dumps(result_json, indent=2, ensure_ascii=False))
    print("-------------------")

if __name__ == "__main__":
    test_model()
