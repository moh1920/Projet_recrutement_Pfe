import asyncio
from utils import evaluate_cv_against_offer, EvaluationRequest, JobOffer
from dotenv import load_dotenv
import pprint

load_dotenv()

def test_evaluation():
    offer = JobOffer(
        offerTitle="Enseignant Chercheur en Intelligence Artificielle",
        requiredEducationLevel="Doctorat",
        minYearsExperience=3,
        requiredSkills=["Python", "Deep Learning ecosystem", "TensorFlow", "NLP", "Machine Learning"],
        academicExperience=True,
        requiredModules=["Machine Learning", "Deep Learning", "Traitement du Langage Naturel"],
        departmentSpeciality="Informatique / Intelligence Artificielle"
    )

    cv_text = """
Mohamed Alili
Email: mohamed.alili@email.com
Téléphone: +33 6 12 34 56 78

Formation:
- Doctorat en Informatique (Spécialité IA), Université de Paris, 2023. Titre: "Modèles d'apprentissage profond pour NLP".
- Master en Mathématiques Appliquées et IA, 2019.

Expérience Académique:
- Enseignant Vacataire, Université de Paris (2020-2023) - 3 ans.
  Modules enseignés: Machine Learning, Algorithmique Avancée, Traitement du Signal.
- Chercheur Post-Doc en NLP profond, CNRS (2023-2024) - 1 an.

Compétences Techniques:
- Langages: Python, C++
- Frameworks IA: PyTorch, Keras, HuggingFace, Scikit-learn
- Base de données: PostgreSQL, MongoDB

Langues:
- Arabe: Maternelle
- Français: Courant
- Anglais: Professionnel courant
"""

    request = EvaluationRequest(
        jobOffer=offer,
        cvText=cv_text
    )

    print("Evaluating CV...")
    result = evaluate_cv_against_offer(request)
    print("\nÉvaluation Résultat :")
    pprint.pprint(result)

if __name__ == "__main__":
    test_evaluation()
