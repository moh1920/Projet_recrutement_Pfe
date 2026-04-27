import spacy
from spacy.training import Example
import random
import os

def create_and_train_model():
    print("Loading base French model (lg)...")
    try:
        nlp = spacy.load("fr_core_news_lg")
    except OSError:
        import subprocess
        print("Downloading fr_core_news_lg...")
        subprocess.run(["python", "-m", "spacy", "download", "fr_core_news_lg"])
        nlp = spacy.load("fr_core_news_lg")

    # 1. Add Entity Ruler for high-precision extraction (Skills, Diplomas)
    print("Adding rules for Entities...")
    if "entity_ruler" not in nlp.pipe_names:
        ruler = nlp.add_pipe("entity_ruler", before="ner")
    else:
        ruler = nlp.get_pipe("entity_ruler")
    
    # Define our manual dictionary for skills, languages and diplomas
    # ADAPTÉ POUR LE PROFIL "ENSEIGNANT DE FACULTÉ / CHERCHEUR / IT"
    patterns = [
        # ─── Langages de programmation ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "java"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "python"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "c++"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "c#"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "javascript"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "typescript"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "kotlin"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "scala"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "r"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "matlab"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "php"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "go"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "rust"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "swift"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "dart"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "assembly"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "prolog"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "haskell"}]},

        # ─── Frameworks web & mobile ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "angular"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "react"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "vue"}, {"lower": ".js"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "vuejs"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "node"}, {"lower": ".js"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "nodejs"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "next"}, {"lower": ".js"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "spring"}, {"lower": "boot"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "django"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "flask"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "fastapi"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "laravel"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "symfony"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "flutter"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "react"}, {"lower": "native"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "express"}, {"lower": ".js"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "expressjs"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": ".net"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "asp"}, {"lower": ".net"}]},

        # ─── Intelligence Artificielle & Data Science ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "machine"}, {"lower": "learning"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "deep"}, {"lower": "learning"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "intelligence"}, {"lower": "artificielle"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "artificial"}, {"lower": "intelligence"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "nlp"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "traitement"}, {"lower": "du"}, {"lower": "langage"}, {"lower": "naturel"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "computer"}, {"lower": "vision"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "vision"}, {"lower": "par"}, {"lower": "ordinateur"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "tensorflow"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "pytorch"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "keras"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "scikit"}, {"lower": "-"}, {"lower": "learn"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "scikit-learn"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "hugging"}, {"lower": "face"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "transformers"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "llm"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "large"}, {"lower": "language"}, {"lower": "model"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "generative"}, {"lower": "ai"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "ia"}, {"lower": "générative"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "reinforcement"}, {"lower": "learning"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "apprentissage"}, {"lower": "par"}, {"lower": "renforcement"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "opencv"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "yolo"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "pandas"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "numpy"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "matplotlib"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "seaborn"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "data"}, {"lower": "mining"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "fouille"}, {"lower": "de"}, {"lower": "données"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "data"}, {"lower": "science"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "big"}, {"lower": "data"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "hadoop"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "spark"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "apache"}, {"lower": "spark"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "kafka"}]},

        # ─── Bases de données ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "sql"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "nosql"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "mysql"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "postgresql"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "oracle"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "mongodb"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "redis"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "elasticsearch"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "neo4j"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "cassandra"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "sqlite"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "mariadb"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "data"}, {"lower": "warehouse"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "entrepôt"}, {"lower": "de"}, {"lower": "données"}]},

        # ─── DevOps & Cloud ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "docker"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "kubernetes"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "git"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "github"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "gitlab"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "jenkins"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "ci"}, {"lower": "/cd"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "ci/cd"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "ansible"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "terraform"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "aws"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "azure"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "google"}, {"lower": "cloud"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "gcp"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "linux"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "bash"}]},

        # ─── Architecture logicielle ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "microservices"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "architecture"}, {"lower": "microservices"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "api"}, {"lower": "rest"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "restful"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "graphql"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "uml"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "design"}, {"lower": "patterns"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "solid"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "mvc"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "tdd"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "test"}, {"lower": "driven"}, {"lower": "development"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "agile"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "scrum"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "merise"}]},

        # ─── Réseaux & Sécurité ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "cybersécurité"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "cybersecurity"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "sécurité"}, {"lower": "informatique"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "réseaux"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "tcp"}, {"lower": "/ip"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "tcp/ip"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "cryptographie"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "blockchain"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "iot"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "internet"}, {"lower": "of"}, {"lower": "things"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "objets"}, {"lower": "connectés"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "mqtt"}]},

        # ─── Outils BI & Visualisation ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "power"}, {"lower": "bi"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "tableau"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "qlik"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "looker"}]},

        # ─── Compétences pédagogiques & académiques ───
        {"label": "SKILL_TECH", "pattern": [{"lower": "pédagogie"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "ingénierie"}, {"lower": "pédagogique"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "conception"}, {"lower": "de"}, {"lower": "cours"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "élaboration"}, {"lower": "de"}, {"lower": "programmes"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "e-learning"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "moodle"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "enseignement"}, {"lower": "à"}, {"lower": "distance"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "encadrement"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "encadrement"}, {"lower": "de"}, {"lower": "thèses"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "encadrement"}, {"lower": "pfe"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "recherche"}, {"lower": "scientifique"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "publication"}, {"lower": "scientifique"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "rédaction"}, {"lower": "scientifique"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "revue"}, {"lower": "par"}, {"lower": "les"}, {"lower": "pairs"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "peer"}, {"lower": "review"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "veille"}, {"lower": "technologique"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "montage"}, {"lower": "de"}, {"lower": "projets"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "coordination"}, {"lower": "pédagogique"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "jury"}]},
        {"label": "SKILL_TECH", "pattern": [{"lower": "évaluation"}, {"lower": "des"}, {"lower": "étudiants"}]},

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

    # Patterns entity_ruler — Universités tunisiennes
    university_patterns = [
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "ut"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "tunis"}, {"lower": "el"}, {"lower": "manar"}]},
        {"label": "ORG", "pattern": [{"lower": "utm"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "carthage"}]},
        {"label": "ORG", "pattern": [{"lower": "uc"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "la"}, {"lower": "manouba"}]},
        {"label": "ORG", "pattern": [{"lower": "uma"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "us"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "sousse"}]},
        {"label": "ORG", "pattern": [{"lower": "uss"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "monastir"}]},
        {"label": "ORG", "pattern": [{"lower": "um"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "gabès"}]},
        {"label": "ORG", "pattern": [{"lower": "ug"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "gafsa"}]},
        {"label": "ORG", "pattern": [{"lower": "ugaf"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "kairouan"}]},
        {"label": "ORG", "pattern": [{"lower": "uk"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "jendouba"}]},
        {"label": "ORG", "pattern": [{"lower": "uj"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "de"}, {"lower": "mahdia"}]},
        {"label": "ORG", "pattern": [{"lower": "umah"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "virtuelle"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "uvt"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "nationale"}, {"lower": "d'ingénieurs"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "enit"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "nationale"}, {"lower": "d'ingénieurs"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "enis"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "nationale"}, {"lower": "d'ingénieurs"}, {"lower": "de"}, {"lower": "sousse"}]},
        {"label": "ORG", "pattern": [{"lower": "eniso"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "nationale"}, {"lower": "d'ingénieurs"}, {"lower": "de"}, {"lower": "monastir"}]},
        {"label": "ORG", "pattern": [{"lower": "enim"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "nationale"}, {"lower": "d'ingénieurs"}, {"lower": "de"}, {"lower": "gafsa"}]},
        {"label": "ORG", "pattern": [{"lower": "enig"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "nationale"}, {"lower": "d'ingénieurs"}, {"lower": "de"}, {"lower": "bizerte"}]},
        {"label": "ORG", "pattern": [{"lower": "enib"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "nationale"}, {"lower": "d'ingénieurs"}, {"lower": "de"}, {"lower": "carthage"}]},
        {"label": "ORG", "pattern": [{"lower": "enicarthage"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "national"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "appliquées"}, {"lower": "et"}, {"lower": "de"}, {"lower": "technologie"}]},
        {"label": "ORG", "pattern": [{"lower": "insat"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "supérieur"}, {"lower": "d'informatique"}]},
        {"label": "ORG", "pattern": [{"lower": "isi"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "supérieur"}, {"lower": "d'informatique"}, {"lower": "de"}, {"lower": "mahdia"}]},
        {"label": "ORG", "pattern": [{"lower": "isima"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "supérieur"}, {"lower": "d'informatique"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "isims"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "supérieur"}, {"lower": "d'informatique"}, {"lower": "et"}, {"lower": "de"}, {"lower": "multimedia"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "isims"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "fst"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "fss"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "de"}, {"lower": "monastir"}]},
        {"label": "ORG", "pattern": [{"lower": "fsm"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "de"}, {"lower": "bizerte"}]},
        {"label": "ORG", "pattern": [{"lower": "fsb"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "de"}, {"lower": "gabès"}]},
        {"label": "ORG", "pattern": [{"lower": "fsg"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "de"}, {"lower": "gafsa"}]},
        {"label": "ORG", "pattern": [{"lower": "fsgaf"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "économiques"}, {"lower": "et"}, {"lower": "de"}, {"lower": "gestion"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "fsegt"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "économiques"}, {"lower": "et"}, {"lower": "de"}, {"lower": "gestion"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "fsegs"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "des"}, {"lower": "lettres"}, {"lower": "et"}, {"lower": "sciences"}, {"lower": "humaines"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "flsht"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "de"}, {"lower": "médecine"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "fmt"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "de"}, {"lower": "médecine"}, {"lower": "de"}, {"lower": "monastir"}]},
        {"label": "ORG", "pattern": [{"lower": "fmm"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "de"}, {"lower": "médecine"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "fms"}]},
        {"label": "ORG", "pattern": [{"lower": "faculté"}, {"lower": "de"}, {"lower": "droit"}, {"lower": "et"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "politiques"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "fdspt"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "préparatoire"}, {"lower": "aux"}, {"lower": "études"}, {"lower": "d'ingénieur"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "ipeis"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "préparatoire"}, {"lower": "aux"}, {"lower": "études"}, {"lower": "d'ingénieur"}, {"lower": "de"}, {"lower": "monastir"}]},
        {"label": "ORG", "pattern": [{"lower": "ipeim"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "préparatoire"}, {"lower": "aux"}, {"lower": "études"}, {"lower": "d'ingénieur"}, {"lower": "de"}, {"lower": "nabeul"}]},
        {"label": "ORG", "pattern": [{"lower": "ipein"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "nationale"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "de"}, {"lower": "l'informatique"}]},
        {"label": "ORG", "pattern": [{"lower": "ensi"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "supérieure"}, {"lower": "des"}, {"lower": "communications"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "sup'com"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "supérieur"}, {"lower": "des"}, {"lower": "études"}, {"lower": "technologiques"}, {"lower": "de"}, {"lower": "sfax"}]},
        {"label": "ORG", "pattern": [{"lower": "isets"}]},
        {"label": "ORG", "pattern": [{"lower": "riadi"}]},
        {"label": "ORG", "pattern": [{"lower": "laboratoire"}, {"lower": "larodec"}]},
        {"label": "ORG", "pattern": [{"lower": "larodec"}]},
        {"label": "ORG", "pattern": [{"lower": "laboratoire"}, {"lower": "miracle"}]},
        {"label": "ORG", "pattern": [{"lower": "miracle"}]},
        {"label": "ORG", "pattern": [{"lower": "laboratoire"}, {"lower": "lisi"}]},
        {"label": "ORG", "pattern": [{"lower": "lisi"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "privée"}, {"lower": "de"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "upt"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "esprit"}]},
        {"label": "ORG", "pattern": [{"lower": "esprit"}]},
        {"label": "ORG", "pattern": [{"lower": "université"}, {"lower": "centrale"}]},
        {"label": "ORG", "pattern": [{"lower": "uc"}]},
        {"label": "ORG", "pattern": [{"lower": "école"}, {"lower": "supérieure"}, {"lower": "privée"}, {"lower": "d'ingénierie"}, {"lower": "et"}, {"lower": "de"}, {"lower": "technologies"}]},
        {"label": "ORG", "pattern": [{"lower": "esprit"}]},
        {"label": "ORG", "pattern": [{"lower": "mediterranean"}, {"lower": "school"}, {"lower": "of"}, {"lower": "business"}]},
        {"label": "ORG", "pattern": [{"lower": "msb"}]},
        {"label": "ORG", "pattern": [{"lower": "business"}, {"lower": "school"}, {"lower": "of"}, {"lower": "tunis"}]},
        {"label": "ORG", "pattern": [{"lower": "bst"}]},
        {"label": "ORG", "pattern": [{"lower": "institut"}, {"lower": "libre"}, {"lower": "des"}, {"lower": "sciences"}, {"lower": "technologiques"}]},
        {"label": "ORG", "pattern": [{"lower": "ilst"}]},
        {"label": "ORG", "pattern": [{"lower": "ihec"}, {"lower": "carthage"}]},
        {"label": "ORG", "pattern": [{"lower": "ihec"}]}
    ]

    ruler.add_patterns(university_patterns)
    
    # 2. Add some training data to fine-tune standard NER pipes
    # For example, training to recognize a new custom 'JOB' or 'ORG' context better
    # SPÉCIFIQUE AU RECRUTEMENT D'ENSEIGNANTS UNIVERSITAIRES
    TRAIN_DATA = [

    # ─── Organisations : Universités & Écoles tunisiennes ───
    ("Je suis un développeur Java avec 5 ans d'expérience à ESPRIT.",
     {"entities": [(54, 61, "ORG")]}),

    ("J'ai obtenu mon Master à l'Université de Tunis El Manar en 2020.",
     {"entities": [(27, 55, "ORG"), (59, 63, "DATE")]}),

    ("Enseignant chercheur à la Faculté des Sciences de Sfax depuis 2018.",
     {"entities": [(26, 54, "ORG"), (62, 66, "DATE")]}),

    ("Professeur assistant à l'Institut Supérieur d'Informatique de Tunis.",
     {"entities": [(26, 67, "ORG")]}),

    ("Doctorant au sein du laboratoire RIADI de l'ENSI.",
     {"entities": [(33, 38, "ORG"), (44, 48, "ORG")]}),

    ("J'enseigne à l'École Nationale d'Ingénieurs de Tunis depuis 2019.",
     {"entities": [(15, 52, "ORG"), (60, 64, "DATE")]}),

    ("Maître de conférences à l'Université de Sfax, département informatique.",
     {"entities": [(26, 44, "ORG")]}),

    ("Ancien élève de l'École Polytechnique de Tunisie, promotion 2015.",
     {"entities": [(18, 48, "ORG"), (59, 63, "DATE")]}),

    ("Chercheur associé à l'Institut National des Sciences Appliquées et de Technologie.",
     {"entities": [(21, 82, "ORG")]}),

    ("J'ai effectué ma thèse à la Faculté des Sciences de Tunis entre 2016 et 2020.",
     {"entities": [(28, 52, "ORG"), (59, 63, "DATE"), (67, 71, "DATE")]}),

    ("Coordinateur pédagogique à l'Université Privée de Tunis depuis 2021.",
     {"entities": [(28, 54, "ORG"), (62, 66, "DATE")]}),

    ("Responsable de filière à l'IHEC Carthage depuis septembre 2020.",
     {"entities": [(26, 38, "ORG"), (55, 62, "DATE")]}),

    ("Enseignant vacataire à l'Université Centrale de Tunis en 2022.",
     {"entities": [(24, 52, "ORG"), (56, 60, "DATE")]}),

    ("Titulaire d'un poste à l'École Supérieure des Communications de Tunis.",
     {"entities": [(24, 69, "ORG")]}),

    ("Professeur à l'Institut Supérieur d'Informatique de Sfax.",
     {"entities": [(14, 56, "ORG")]}),

    ("Stage de recherche effectué à l'Université de Monastir en juillet 2019.",
     {"entities": [(31, 53, "Q"), (64, 71, "DATE")]}),

    ("Laboratoire LISI, Université de la Manouba, Tunisie.",
     {"entities": [(12, 16, "ORG"), (18, 42, "ORG")]}),

    ("Membre du laboratoire RIADI-GDL rattaché à l'ENSI.",
     {"entities": [(22, 31, "ORG"), (45, 49, "ORG")]}),

    # ─── Organisations : Revues & Éditeurs scientifiques ───
    ("Publication dans la revue IEEE Transactions on Software Engineering en 2021.",
     {"entities": [(27, 67, "ORG"), (71, 75, "DATE")]}),

    ("Article accepté dans la conférence internationale ICML 2023.",
     {"entities": [(50, 54, "ORG"), (55, 59, "DATE")]}),

    ("Auteur du livre d'algorithmique paru chez Springer.",
     {"entities": [(41, 49, "ORG")]}),

    ("Co-auteur d'un article publié dans Elsevier, journal Pattern Recognition.",
     {"entities": [(35, 43, "ORG")]}),

    ("Présentation d'un poster à la conférence NeurIPS 2022 à New Orleans.",
     {"entities": [(41, 48, "ORG"), (49, 53, "DATE")]}),

    ("Mes travaux ont été publiés dans IEEE Access et ACM Computing Surveys.",
     {"entities": [(33, 44, "ORG"), (48, 69, "ORG")]}),

    ("Reviewer pour la revue Journal of Artificial Intelligence Research.",
     {"entities": [(24, 65, "ORG")]}),

    ("Communication orale à la conférence TALN 2021 organisée à Paris.",
     {"entities": [(36, 40, "ORG"), (41, 45, "DATE")]}),

    # ─── Personnes : Noms tunisiens complexes ───
    ("Ahmed Ben Ali est chercheur en intelligence artificielle.",
     {"entities": [(0, 13, "PER")]}),

    ("Le Dr. Mohamed Trabelsi a publié 3 articles indexés Scopus.",
     {"entities": [(7, 23, "PER")]}),

    ("Curriculum Vitae de Sana Ben Youssef, experte en Machine Learning.",
     {"entities": [(20, 36, "PER")]}),

    ("Profil académique de l'ingénieur Karim Haddad.",
     {"entities": [(33, 45, "PER")]}),

    ("Encadré par le Professeur Ridha Bouallegue, directeur de thèse.",
     {"entities": [(26, 42, "PER")]}),

    ("Thèse dirigée par Mme Fatma Zahra Berbiche, MCF à l'ENIT.",
     {"entities": [(22, 42, "PER"), (52, 56, "ORG")]}),

    ("Rapport signé par M. Bilel Marzouki, ingénieur de recherche.",
     {"entities": [(21, 34, "PER")]}),

    ("Co-encadrement assuré par Dr. Ines Slimane et Pr. Nabil Hamrouni.",
     {"entities": [(29, 40, "PER"), (50, 64, "PER")]}),

    ("Dossier déposé par Rania Ben Romdhane pour le poste de MCF.",
     {"entities": [(19, 37, "PER")]}),

    ("Les travaux de Leila Ammar ont été récompensés par le prix national.",
     {"entities": [(15, 26, "PER")]}),

    ("Candidature soumise par Mohamed Amine Khelil, docteur en informatique.",
     {"entities": [(24, 44, "PER")]}),

    ("Jury présidé par Pr. Habib Hamam de l'Université de Gabès.",
     {"entities": [(21, 32, "PER"), (37, 57, "ORG")]}),

    # ─── Grades & Rôles académiques ───
    ("J'enseigne actuellement en tant que Maître de Conférences classe A.",
     {"entities": []}),

    ("Poste actuel : Professeur d'Enseignement Supérieur depuis 2017.",
     {"entities": [(57, 61, "DATE")]}),

    ("Je suis Maître-Assistant en informatique à l'Université de Sousse.",
     {"entities": [(43, 65, "ORG")]}),

    ("Recrutée en tant qu'Assistante Hospitalo-Universitaire en 2020.",
     {"entities": [(57, 61, "DATE")]}),

    ("Habilité à diriger des recherches (HDR) depuis 2021.",
     {"entities": [(47, 51, "DATE")]}),

    ("Nommé Professeur Ordinaire par le Ministère de l'Enseignement Supérieur.",
     {"entities": []}),

    ("Chargé de cours vacataire à raison de 6 heures par semaine.",
     {"entities": []}),

    # ─── Modules & Matières enseignées ───
    ("Responsable du module Base de Données pour les classes de 2ème année.",
     {"entities": []}),

    ("Encadrement de 5 projets de fin d'études (PFE) en architectures micro-services.",
     {"entities": []}),

    ("J'assure le cours d'Algorithmes et Structures de Données en L2 informatique.",
     {"entities": []}),

    ("Cours magistral de Génie Logiciel dispensé en 3ème année cycle ingénieur.",
     {"entities": []}),

    ("TD et TP de Programmation Orientée Objet en Java pour les classes de 1ère année.",
     {"entities": []}),

    ("Enseignement du module Réseaux Informatiques et Protocoles de Communication.",
     {"entities": []}),

    ("Module Sécurité des Systèmes d'Information assuré depuis 2020.",
     {"entities": [(57, 61, "DATE")]}),

    ("Cours de Machine Learning dispensé en Master 2 Data Science.",
     {"entities": []}),

    ("Responsable de l'UE Développement Web en Licence Informatique.",
     {"entities": []}),

    ("Initiation à la recherche pour les étudiants en Master Recherche.",
     {"entities": []}),

    # ─── Diplômes & Formations ───
    ("J'ai soutenu ma thèse de doctorat en informatique en décembre 2019.",
     {"entities": [(62, 74, "DATE")]}),

    ("Titulaire d'un Master Recherche en Systèmes Intelligents obtenu en 2016.",
     {"entities": [(67, 71, "DATE")]}),

    ("Diplômé ingénieur en génie logiciel de l'ENIT, promotion 2014.",
     {"entities": [(40, 44, "ORG"), (55, 59, "DATE")]}),

    ("Habilitation Universitaire obtenue en 2022 à l'Université de Sfax.",
     {"entities": [(37, 41, "DATE"), (45, 63, "ORG")]}),

    ("Licence fondamentale en informatique, Faculté des Sciences de Tunis, 2012.",
     {"entities": [(38, 66, "ORG"), (68, 72, "DATE")]}),

    ("Préparation d'une thèse de doctorat en co-tutelle avec l'Université de Bordeaux.",
     {"entities": [(57, 79, "ORG")]}),

    # ─── Projets de recherche & Financements ───
    ("Chef de projet du programme PHC Utique financé par le ministère.",
     {"entities": []}),

    ("Participation au projet européen Horizon 2020 sur la cybersécurité.",
     {"entities": [(33, 44, "ORG")]}),

    ("Coordinateur du projet PRIMA financé par l'Union Européenne.",
     {"entities": [(41, 56, "ORG")]}),

    ("Chercheur principal dans un projet ANR franco-tunisien depuis 2021.",
     {"entities": [(35, 38, "ORG"), (62, 66, "DATE")]}),

    # ─── Activités administratives & institutionnelles ───
    ("Membre du conseil scientifique de la Faculté des Sciences de Sfax.",
     {"entities": [(37, 65, "ORG")]}),

    ("Chef du département informatique depuis janvier 2022.",
     {"entities": [(40, 52, "DATE")]}),

    ("Doyen de la Faculté des Sciences de Gabès entre 2018 et 2023.",
     {"entities": [(12, 40, "ORG"), (47, 51, "DATE"), (55, 59, "DATE")]}),

    ("Membre du comité de programme de la conférence ACIT 2023.",
     {"entities": [(47, 51, "ORG"), (52, 56, "DATE")]}),

    ("Responsable des relations internationales à l'Université de Kairouan.",
     {"entities": [(44, 68, "ORG")]}),
    ]
    
    from spacy.training import offsets_to_biluo_tags
    from spacy.util import minibatch, compounding
    from spacy.scorer import Scorer
    import warnings

    print("Valider les offsets...")
    valid_train_data = []
    for text, annotations in TRAIN_DATA:
        doc = nlp.make_doc(text)
        try:
            with warnings.catch_warnings(record=True) as w:
                warnings.simplefilter("always")
                tags = offsets_to_biluo_tags(doc, annotations.get("entities", []))
                if "-" in tags:
                    print(f"Attention: Entités mal alignées ignorées dans: '{text}'")
                    # On ignore les exemples mal alignés pour ne pas corrompre le modèle
                    continue
            valid_train_data.append((text, annotations))
        except BaseException as e:
            print(f"Erreur offset sur: {text} - {str(e)}")

    print(f"Data validée: {len(valid_train_data)}/{len(TRAIN_DATA)} exemples conservés.")

    # On prépare un petit set de validation (20%) pour évaluer l'accuracy
    random.shuffle(valid_train_data)
    split_index = int(len(valid_train_data) * 0.8)
    train_set = valid_train_data[:split_index]
    val_set = valid_train_data[split_index:]

    print("Fine-tuning standard NER...")
    ner = nlp.get_pipe("ner")
    # Assurer que tous les labels sont connus
    for _, annotations in train_set:
        for ent in annotations.get("entities"):
            ner.add_label(ent[2])
            
    unaffected_pipes = [pipe for pipe in nlp.pipe_names if pipe not in ["ner"]]
    
    with nlp.disable_pipes(*unaffected_pipes):
        optimizer = nlp.resume_training()
        
        n_iter = 40
        print(f"Début de l'entraînement sur {n_iter} époques...")
        for itn in range(n_iter):
            random.shuffle(train_set)
            losses = {}
            # Batch up the examples using spaCy's minibatch
            batches = minibatch(train_set, size=compounding(4.0, 32.0, 1.001))
            for batch in batches:
                examples = []
                for text, annotations in batch:
                    doc = nlp.make_doc(text)
                    example = Example.from_dict(doc, annotations)
                    examples.append(example)
                # Drop progressif (0.5->0.2 pour plus de stabilité vers la fin)
                current_drop = 0.5 - (0.3 * (itn / n_iter))
                nlp.update(examples, drop=current_drop, sgd=optimizer, losses=losses)
            
            # Calcul du F1 score sur le set de validation à intervalles réguliers
            if itn % 5 == 0 or itn == n_iter - 1:
                scorer = Scorer()
                examples_val = []
                for text, annot in val_set:
                    doc = nlp.make_doc(text)
                    pred_doc = nlp(text)
                    example = Example(pred_doc, Example.from_dict(doc, annot).reference)
                    examples_val.append(example)
                
                scores = scorer.score(examples_val)
                f1_score = scores.get('ents_f', 0) * 100
                print(f"Epoch {itn}/{n_iter} - Loss: {losses['ner']:.2f} - Val F1: {f1_score:.2f}%")
            
    # Save the model
    output_dir = "./models/model_ner_cv"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    print(f"Saving tuned NER model to {output_dir}")
    nlp.to_disk(output_dir)
    print("Training finished successfully.")

if __name__ == "__main__":
    create_and_train_model()
