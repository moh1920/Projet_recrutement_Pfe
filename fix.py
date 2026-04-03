import sys
filepath = r'c:\Users\Adminn\Desktop\extraction automatique de CV\train_model.py'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_patterns = '''    patterns = [
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
    ]\n'''

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.startswith('patterns = ['):
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        # We know the specific bracket position in the file as it is right before `    ruler.add_patterns(patterns)`
        if lines[i] == '    ]    \n' or lines[i] == '    ]    \r\n' or lines[i] == '    ]\n' or 'ruler.add_patterns(patterns)' in lines[i+1]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + [new_patterns] + lines[end_idx+1:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('Patterns replaced successfully.')
else:
    print(f'Error finding bounds: start={start_idx}, end={end_idx}')
