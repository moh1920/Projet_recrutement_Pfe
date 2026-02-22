import spacy
from spacy.training import Example
import random
import os

def create_and_train_model():
    print("Loading base French model...")
    try:
        nlp = spacy.load("fr_core_news_sm")
    except OSError:
        import subprocess
        print("Downloading fr_core_news_sm...")
        subprocess.run(["python", "-m", "spacy", "download", "fr_core_news_sm"])
        nlp = spacy.load("fr_core_news_sm")

    # 1. Add Entity Ruler for high-precision extraction (Skills, Diplomas)
    print("Adding rules for Entities...")
    if "entity_ruler" not in nlp.pipe_names:
        ruler = nlp.add_pipe("entity_ruler", before="ner")
    else:
        ruler = nlp.get_pipe("entity_ruler")
    
    # Define our manual dictionary for skills, languages and diplomas
    # ADAPTÉ POUR LE PROFIL "ENSEIGNANT DE FACULTÉ / CHERCHEUR / IT"
    patterns = [
        # Technical skills (IT & Data)
        {"label": "SKILL_TECH", "pattern": [{"lower": "java"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "python"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "c++"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "c#"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "javascript"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "typescript"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "angular"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "react"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "spring"}, {"lower": "boot"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "machine"}, {"lower": "learning"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "deep"}, {"lower": "learning"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "intelligence"}, {"lower": "artificielle"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "nlp"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "power"}, {"lower": "bi"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "sql"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "nosql"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "docker"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "kubernetes"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "git"}]},
        
        # Pedagogical / Academic Skills
        {"label": "SKILL_TECH", "pattern": [{"lower": "pédagogie"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "recherche"}, {"lower": "scientifique"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "encadrement"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "conception"}, {"lower": "de"}, {"lower": "cours"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "e-learning"}]},
        
        # Diplomas (Academic focus)
        {"label": "DIPLOMA", "pattern": [{"lower": "doctorat"}]},
        {"label": "DIPLOMA", "pattern": [{"lower": "phd"}]},
        {"label": "DIPLOMA", "pattern": [{"lower": "master"}]},
        {"label": "DIPLOMA", "pattern": [{"lower": "ingénieur"}]},
        {"label": "DIPLOMA", "pattern": [{"lower": "habilitation"}, {"lower": "universitaire"}]},
        {"label": "DIPLOMA", "pattern": [{"lower": "agrégation"}]},
        {"label": "DIPLOMA", "pattern": [{"lower": "licence"}]},
        
        # Languages
        {"label": "LANG", "pattern": [{"lower": "français"}]},
        {"label": "LANG", "pattern": [{"lower": "anglais"}]},
        {"label": "LANG", "pattern": [{"lower": "arabe"}]},
        {"label": "LANG", "pattern": [{"lower": "espagnol"}]},
        {"label": "LANG", "pattern": [{"lower": "allemand"}]}
    ]
    
    ruler.add_patterns(patterns)
    
    # 2. Add some training data to fine-tune standard NER pipes
    # For example, training to recognize a new custom 'JOB' or 'ORG' context better
    # SPÉCIFIQUE AU RECRUTEMENT D'ENSEIGNANTS UNIVERSITAIRES
    TRAIN_DATA = [
        # Reconnaissance d'organisations (Universités, Écoles)
        ("Je suis un développeur Java avec 5 ans d'expérience à ESPRIT.", {"entities": [(47, 53, "ORG")]}),
        ("J'ai obtenu mon Master à Université de Tunis El Manar en 2020.", {"entities": [(25, 53, "ORG"), (57, 61, "DATE")]}),
        ("Enseignant chercheur à la Faculté des Sciences de Sfax depuis 2018.", {"entities": [(26, 54, "ORG"), (62, 66, "DATE")]}),
        ("Professeur assistant à l'Institut Supérieur d'Informatique.", {"entities": [(25, 58, "ORG")]}),
        ("Doctorant au sein du laboratoire RIADI de l'ENSI.", {"entities": [(44, 48, "ORG")]}),
        
        # Reconnaissance de personnes (noms souvent complexes)
        ("Ahmed Ben Ali chercheur en IA.", {"entities": [(0, 13, "PER")]}),
        ("Le Dr. Mohamed Trabelsi a publié 3 articles.", {"entities": [(7, 23, "PER")]}),
        ("Curriculum Vitae de Sana Ben Youssef, experte en Machine Learning.", {"entities": [(20, 36, "PER")]}),
        ("Profil académique de l'ingénieur Karim Haddad.", {"entities": [(31, 43, "PER")]}),
        
        # Reconnaissance de métiers / rôles (sera taggé par défaut ou ignoré, mais aide la structure)
        ("J'enseigne actuellement en tant que Maître de Conférences.", {"entities": []}),
        ("Poste actuel : Professeur d'Enseignement Supérieur.", {"entities": []}),
        
        # Phrases de publications
        ("Publication dans la revue IEEE Transactions on Software Engineering en 2021.", {"entities": [(26, 67, "ORG"), (71, 75, "DATE")]}),
        ("Auteur du livre d'algorithmique paru chez Springer.", {"entities": [(42, 50, "ORG")]}),
        
        # Expériences complexes
        ("Responsable du module Base de Données pour les classes de 2ème année Cycle Ingénieur.", {"entities": []}),
        ("Encadrement de 5 projets de fin d'études (PFE) en architectures micro-services.", {"entities": []})
    ]
    
    print("Fine-tuning standard NER...")
    ner = nlp.get_pipe("ner")
    # Tell NER to learn about standard labels just in case
    for _, annotations in TRAIN_DATA:
        for ent in annotations.get("entities"):
            ner.add_label(ent[2])
            
    # Disable other pipes during training to focus on NER
    unaffected_pipes = [pipe for pipe in nlp.pipe_names if pipe not in ["ner"]]
    
    with nlp.disable_pipes(*unaffected_pipes):
        optimizer = nlp.resume_training()
        for itn in range(15): # Augmented number of epochs due to more data
            random.shuffle(TRAIN_DATA)
            losses = {}
            for text, annotations in TRAIN_DATA:
                doc = nlp.make_doc(text)
                example = Example.from_dict(doc, annotations)
                nlp.update([example], drop=0.5, sgd=optimizer, losses=losses)
            print(f"Epoch {itn+1}/10, Losses: {losses}")
            
    # Save the model
    output_dir = "./models/model_ner_cv"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    print(f"Saving tuned NER model to {output_dir}")
    nlp.to_disk(output_dir)
    print("Training finished successfully.")

if __name__ == "__main__":
    create_and_train_model()
