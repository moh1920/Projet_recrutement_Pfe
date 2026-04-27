import re
import os
import io
import fitz  # PyMuPDF
import docx
from pydantic import BaseModel, Field
from typing import List, Optional
import spacy
import pytesseract
from utils_image import preprocess_image_for_ocr, ocr_with_best_config, clean_ocr_text

from PIL import Image

# Chemin Tesseract : Windows seulement (sous Linux/Docker, Tesseract est dans le PATH)
if os.name == 'nt':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser

# --- Pydantic Models for JSON Output ---

class Identification(BaseModel):
    nom: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None

class Formation(BaseModel):
    niveau_diplome: Optional[str] = None
    specialite: Optional[str] = None
    universite: Optional[str] = None
    annee_diplome: Optional[str] = None
    grade_academique: Optional[str] = None

class Experience(BaseModel):
    nb_annees_experience: int = 0
    experience_academique: bool = False
    institutions: List[str] = []
    modules_enseignes: List[str] = []

class Competences(BaseModel):
    langages: List[str] = []
    frameworks: List[str] = []
    data: List[str] = []
    ia: List[str] = []
    erp: List[str] = []

class Langue(BaseModel):
    langue: Optional[str] = None
    niveau: Optional[str] = None

class IndicateursIA(BaseModel):
    score_competences: int = 0
    score_experience: int = 0
    score_global: int = 0

class CVExtraction(BaseModel):
    identification: Identification = Identification()
    formation: Formation = Formation()
    experience: Experience = Experience()
    competences: Competences = Competences()
    publications: List[str] = []
    certifications: List[str] = []
    langues: List[Langue] = []
    indicateurs_ia: IndicateursIA = IndicateursIA()

# --- Pydantic Models for Job Match Evaluation ---

class JobOffer(BaseModel):
    title: Optional[str] = None
    requiredLevel: Optional[str] = None
    minYearsExperience: int = 0
    requiredSkills: List[str] = []
    academicExperience: bool = False
    modules: List[str] = []
    department: Optional[str] = None
    speciality: Optional[str] = None

    class Config:
        extra = 'ignore'  # Ignore extra fields like _id, createdAt, etc.

class ScoreComment(BaseModel):
    score: int
    max: int
    comment: str

class SkillsMatch(BaseModel):
    score: int
    max: int
    matchedSkills: List[str]
    missingSkills: List[str]

class ModulesAlignment(BaseModel):
    score: int
    max: int
    matchedModules: List[str]

class EvaluationBreakdown(BaseModel):
    educationLevel: ScoreComment
    skillsMatch: SkillsMatch
    experience: ScoreComment
    academicExperience: ScoreComment
    modulesAlignment: ModulesAlignment
    specialityFit: ScoreComment

class EvaluationResult(BaseModel):
    candidateName: str
    offerTitle: str
    globalScore: int
    grade: str
    breakdown: EvaluationBreakdown
    strengths: List[str]
    weaknesses: List[str]
    recommendation: str

class EvaluationRequest(BaseModel):
    jobOffer: JobOffer
    cvText: Optional[str] = None
    cvData: Optional[dict] = None

# --- Helper Logic ---

def clean_llm_json(raw_text: str) -> str:
    """Nettoie le texte généré par le LLM pour qu'il soit un JSON valide."""
    import re
    # Supprime les balises markdown eventuelles
    text = re.sub(r'```(?:json)?\s*', '', raw_text)
    # Supprime les commentaires // qui cassent json.loads
    text = re.sub(r'//.*$', '', text, flags=re.MULTILINE)
    # Extrait la portion entre la première et dernière accolade
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        text = text[start:end+1]
    return text

def clean_text(text: str) -> str:
    # Preserve some structure by replacing multiple newlines with a single newline
    # This helps segmenting institutions and names.
    import re
    text = re.sub(r'\n+', '\n', text)
    # Remove excessive spaces
    text = re.sub(r' +', ' ', text)
    return text.strip()

def extract_email(text: str) -> Optional[str]:
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

def extract_phone(text: str) -> Optional[str]:
    # Matches simple international and local formats (+216 54 575 833)
    match = re.search(r'(\+?\d{1,4}[\s-]?)?(?:\(?\d{1,3}\)?[\s-]?)?\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4}', text)
    return match.group(0).strip() if match else None

def extract_years_experience(text: str) -> int:
    # Try explicit mentions of years of experience
    match = re.search(r'(\d+)\s*(ans?|years?)\s*(d\'expérience|of experience)?', text, re.IGNORECASE)
    if match:
        return int(match.group(1))
        
    # Fallback: estimate from years mentioned in text (e.g. 2020 - 2024 or 2020 - Présent)
    import datetime
    current_year = datetime.datetime.now().year
    years = re.findall(r'\b(19\d{2}|20\d{2})\b', text)
    if years:
        years = [int(y) for y in years]
        min_year = min(years)
        max_year = current_year if re.search(r'(présent|aujourd\'hui|present)', text, re.IGNORECASE) else max(years)
        if max_year > min_year and max_year <= current_year + 5: # basic sanity check
            # We assume someone doesn't have 40 years of experience on a student CV
            exp = max_year - min_year
            # Cap it slightly intuitively or assume it includes study years
            return max(0, exp - 3) # Subtracting 3 approx years for studies
    return 0

def clean_text(text: str) -> str:
    return text.strip().replace('\n', ' ')

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    text = ""

    try:
        if ext == '.pdf':
            doc = fitz.open(stream=file_content, filetype="pdf")
            for page in doc:
                page_text = page.get_text()
                # Si page vide → page image (PDF scanné)
                if len(page_text.strip()) < 50:
                    pix = page.get_pixmap(dpi=300)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    img = preprocess_image_for_ocr(img)
                    page_text = ocr_with_best_config(img)
                    page_text = clean_ocr_text(page_text)
                text += page_text + "\n"
            doc.close()

        elif ext in ['.docx', '.doc']:
            doc = docx.Document(io.BytesIO(file_content))
            for para in doc.paragraphs:
                text += para.text + "\n"

        elif ext in ['.png', '.jpg', '.jpeg', '.webp', '.tiff']:
            image = Image.open(io.BytesIO(file_content))
            # Prétraitement avancé
            image = preprocess_image_for_ocr(image)
            # OCR multi-configuration
            text = ocr_with_best_config(image)
            # Nettoyage post-OCR
            text = clean_ocr_text(text)

            # Fallback si texte insuffisant : essai sans binarisation
            if len(text.strip()) < 100:
                raw_img = Image.open(io.BytesIO(file_content)).convert("L")
                text_fallback = pytesseract.image_to_string(
                    raw_img, config="--oem 3 --psm 6 -l fra+eng")
                if len(text_fallback) > len(text):
                    text = clean_ocr_text(text_fallback)

        elif ext == '.txt':
            text = file_content.decode('utf-8', errors='ignore')

        else:
            raise ValueError(f"Extension non supportée : {ext}")

    except Exception as e:
        raise Exception(f"Échec extraction {filename}: {str(e)}")

    return clean_text(text)
def extract_information(text: str, nlp_model) -> dict:
    doc = nlp_model(text)
    
    cv = CVExtraction()
    cv.identification.email = extract_email(text)
    cv.identification.telephone = extract_phone(text)
    cv.experience.nb_annees_experience = extract_years_experience(text)
    
    # Analyze entities
    person_names = []
    orgs = []
    locations = []
    dates = []
    diplomas = []
    jobs = []
    
    skills = []
    
    for ent in doc.ents:
        if ent.label_ == 'PER':
            person_names.append(ent.text.strip())
        elif ent.label_ == 'ORG':
            orgs.append(ent.text.strip())
        elif ent.label_ == 'LOC':
            locations.append(ent.text.strip())
        elif ent.label_ in ['DATE', 'MISC']:
            dates.append(ent.text.strip())
        elif ent.label_ == 'SKILL_TECH':
            skills.append(clean_text(ent.text))
        elif ent.label_ == 'DIPLOMA':
            diplomas.append(ent.text.strip())
        
    # Use basic heuristic for the name (often at the very beginning of the CV)
    words = text.split()
    if not cv.identification.nom and len(words) >= 2:
        cv.identification.nom = f"{words[0]} {words[1]}".title()
            
    # Overwrite with Spacy NER ONLY if our heuristic failed or if Spacy is very confident
    # but Spacy fr_core_news_sm is bad at this. We will keep the heuristic's name if it found one.
    if not cv.identification.nom:
        for name in person_names:
            if name.lower() not in ['kanban', 'github', 'spring boot', 'angular']: 
                cv.identification.nom = name
                break
            
    # Enhance Universities / Institutions extraction using robust Regular Expressions
    univ_keywords = ["ecole", "école", "institut", "université", "university", "faculté", "college", "instituts"]
    
    for kw in univ_keywords:
        # Match keyword followed by 2 to 8 words (handling french characters, dashes, and apostrophes)
        pattern = re.compile(r'\b(' + kw + r'(?:[\s\'-]+[A-Za-zÀ-ÖØ-öø-ÿ0-9]+){2,8})\b', re.IGNORECASE | re.UNICODE)
        matches = pattern.findall(text)
        for match in matches:
            clean_inst = match.strip()
            if len(clean_inst) > 5 and len(clean_inst) < 150:
                cv.experience.institutions.append(clean_inst)
    
    # Intégrer les organisations extraites par le modèle NER
    cv.experience.institutions.extend(orgs)
    
    # Déduplication robuste (case-insensitive) et mise en forme titre
    unique_institutions = {}
    for inst in cv.experience.institutions:
        i_clean = inst.strip()
        if len(i_clean.split()) > 1:
            unique_institutions[i_clean.lower()] = i_clean.title()
    
    cv.experience.institutions = list(unique_institutions.values())
    
    if cv.experience.institutions and not cv.formation.universite:
        cv.formation.universite = cv.experience.institutions[0]
        
    # Heuristics for Diplomas
    if "ingénieur" in text.lower():
        cv.formation.niveau_diplome = "Ingénieur"
    elif "master" in text.lower():
        cv.formation.niveau_diplome = "Master"
    elif "licence" in text.lower():
        cv.formation.niveau_diplome = "Licence"
        
    # Check for academic keywords to infer 'experience_academique'
    academic_keywords = ['prof', 'enseignant', 'chercheur', 'université', 'cours', 'module']
    if any(k in text.lower() for k in academic_keywords):
        cv.experience.experience_academique = True
        
    # Categorize skills - Expanded List
    text_lower = text.lower()
    
    # Find skills using exact word boundaries
    tech_skills = {
        'langages': ['java', 'python', 'c++', 'c#', 'sql', 'javascript', 'typescript', 'html', 'css'],
        'frameworks': ['spring boot', 'spring security', 'angular', 'react', 'django', 'node.js', 'spring batch'],
        'data': ['power bi', 'etl', 'sql server', 'mongodb', 'postgresql', 'mysql'],
        'ia': ['nlp', 'ml', 'machine learning', 'deep learning', 'yolo', 'ia', 'vision'],
        'erp': ['sap', 'odoo', 'keycloak'],
        'devops': ['docker', 'kubernetes', 'github actions', 'ci/cd', 'aws', 'azure', 'git'] # added devops mapping to erp/frameworks or separate
    }
    
    for category, skill_list in tech_skills.items():
        for skill in skill_list:
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                if category == 'langages': cv.competences.langages.append(skill.title())
                elif category == 'frameworks': cv.competences.frameworks.append(skill.title())
                elif category == 'data': cv.competences.data.append(skill.title())
                elif category == 'ia': cv.competences.ia.append(skill.title())
                elif category in ['erp', 'devops']: cv.competences.erp.append(skill.title()) # group devops in erp for this model

    # Deduplicate
    cv.competences.langages = list(set(cv.competences.langages))
    cv.competences.frameworks = list(set(cv.competences.frameworks))
    cv.competences.data = list(set(cv.competences.data))
    cv.competences.ia = list(set(cv.competences.ia))
    cv.competences.erp = list(set(cv.competences.erp))
            
    # Simple scoring logic for IndicateursIA
    total_skills = len(cv.competences.langages) + len(cv.competences.frameworks) + len(cv.competences.data) + len(cv.competences.ia) + len(cv.competences.erp)
    cv.indicateurs_ia.score_competences = min(100, total_skills * 5)
    cv.indicateurs_ia.score_experience = min(100, cv.experience.nb_annees_experience * 10)
    cv.indicateurs_ia.score_global = int((cv.indicateurs_ia.score_competences + cv.indicateurs_ia.score_experience) / 2)
    
    return cv.model_dump()


def extract_information_llm(text: str) -> dict:
    """Extract data via LangChain and HuggingFace Open Source Models"""
    # Ensure HuggingFace token is available
    if "HUGGINGFACEHUB_API_TOKEN" not in os.environ:
        raise ValueError("Missing HUGGINGFACEHUB_API_TOKEN. Veuillez ajouter cette variable dans votre fichier .env pour utiliser l'extraction LLM.")

    parser = PydanticOutputParser(pydantic_object=CVExtraction)
    
    # We use Qwen2.5 which is highly optimized for strict JSON generation
    llm_endpoint = HuggingFaceEndpoint(
        repo_id="Qwen/Qwen3-8B",
        #repo_id="Qwen/Qwen2.5-7B-Instruct",
        temperature=0.01,
        max_new_tokens=2048,
        return_full_text=False
    )
    llm = ChatHuggingFace(llm=llm_endpoint)
    
    # On utilise ChatPromptTemplate pour s'aligner correctement avec le modèle ChatHuggingFace
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Tu es un extracteur de données JSON strict. Tu ne parles pas. Tu ne fais que convertir le texte brut en un objet JSON complet et valide.\n\n"
                   "CONTRAINTES :\n"
                   "1. Ne rajoute AUCUN commentaire (ni 'Voici le JSON', ni explications).\n"
                   "2. Utilise UNIQUEMENT la structure demandée.\n"
                   "3. Si une information manque, met `null` ou `[]`.\n"
                   "4. Ne fais pas de boucle infinie. Arrête-toi une fois l'objet JSON fermé.\n\n"
                   "EXEMPLE D'ENTRÉE :\n"
                   "Jean Dupont, email: jean@mail.com. 2 ans exp. Compétences: Java, Spring.\n\n"
                   "EXEMPLE DE SORTIE ATTENDUE :\n"
                   "{{\n"
                   '  "identification": {{ "nom": "Jean Dupont", "email": "jean@mail.com", "telephone": null }},\n'
                   '  "experience": {{ "nb_annees_experience": 2, "experience_academique": false, "institutions": [], "modules_enseignes": [] }},\n'
                   '  "competences": {{ "langages": ["Java"], "frameworks": ["Spring"], "data": [], "ia": [], "erp": [] }},\n'
                   '  "formation": {{ "niveau_diplome": null, "specialite": null, "universite": null, "annee_diplome": null, "grade_academique": null }},\n'
                   '  "publications": [], "certifications": [], "langues": [],\n'
                   '  "indicateurs_ia": {{ "score_competences": 0, "score_experience": 0, "score_global": 0 }}\n'
                   "}}\n\n"
                   "INSTRUCTIONS DE FORMATAGE DU SCHÉMA :\n{format_instructions}"),
        ("user", "TEXTE DU CV :\n{cv_text}\n\nRéponds UNIQUEMENT avec le JSON demandé :")
    ])
    
    # La chaine appelle juste le LLM
    extraction_chain = prompt | llm
    
    resultat_brut = extraction_chain.invoke({
        "cv_text": text,
        "format_instructions": parser.get_format_instructions()
    })
    
    # Nettoyage rigoureux du texte brute renvoyé par le LLM
    cleaned_json_text = clean_llm_json(resultat_brut.content)
    
    try:
        import json_repair
        # Réparation du JSON (ajoute les guillemets manquants, supprime les virgules en trop, gère les commentaires, etc.)
        dict_output = json_repair.loads(cleaned_json_text)
        
        # Validation Pydantic
        if not isinstance(dict_output, dict):
            raise ValueError("Le résultat n'est pas un dictionnaire JSON valide.")
            
        parsed_result = CVExtraction(**dict_output)
        return parsed_result.model_dump()
    except Exception as e:
        raise ValueError(f"Le LLM a généré un format invalide malgré json_repair. Extrait réparé : {cleaned_json_text[:200]}... / Erreur: {str(e)}")


def extract_information_hybrid(text: str, nlp_model) -> dict:
    """Extraction Hybride V3: Pré-Analyse par spaCy NER + Structuration Finale par LLM"""
    
    # 1. Utilisation de notre pipeline NER / Heuristique (V1) pour défricher le terrain
    # On extrait silencieusement les infos de base sans générer le dump JSON final de V1
    cv_spacy_temp = CVExtraction()
    cv_spacy_temp.identification.email = extract_email(text)
    cv_spacy_temp.identification.telephone = extract_phone(text)
    doc = nlp_model(text)
    
    skills_detected = set()
    diplomas_detected = set()
    
    for ent in doc.ents:
        if ent.label_ == 'SKILL_TECH':
            skills_detected.add(clean_text(ent.text).title())
        elif ent.label_ == 'DIPLOMA':
            diplomas_detected.add(ent.text)
            
    # 2. Construction d'un contexte "pré-mâché" pour diminuer la charge cognitive du LLM
    context_prefix = "INFORMATIONS PRÉ-DÉTECTÉES À INCLURE (Ne pas omettre):\n"
    if cv_spacy_temp.identification.email:
        context_prefix += f"- Email identifié : {cv_spacy_temp.identification.email}\n"
    if cv_spacy_temp.identification.telephone:
        context_prefix += f"- Téléphone identifié : {cv_spacy_temp.identification.telephone}\n"
    if skills_detected:
        context_prefix += f"- Compétences techniques certaines détectées : {', '.join(skills_detected)}\n"
    if diplomas_detected:
        context_prefix += f"- Diplômes probables détectés : {', '.join(diplomas_detected)}\n"
        
    enriched_cv_text = f"{context_prefix}\n\nTEXTE DU CV ORIGINAL:\n{text}"
    
    # 3. On passe le relais au LLM (V2) avec ce texte enrichi au lieu du texte brut
    return extract_information_llm(enriched_cv_text)


def evaluate_cv_against_offer(request: EvaluationRequest) -> dict:
    """Analyse un CV par rapport à une offre d'emploi et produit un score de compatibilité."""
    if "HUGGINGFACEHUB_API_TOKEN" not in os.environ:
        raise ValueError("Missing HUGGINGFACEHUB_API_TOKEN. Veuillez ajouter cette variable dans votre fichier .env pour utiliser l'évaluation LLM.")

    parser = PydanticOutputParser(pydantic_object=EvaluationResult)
    
    # Using the same powerful instruct model for strict JSON output and reasoning
    llm_endpoint = HuggingFaceEndpoint(
        repo_id="Qwen/Qwen3-8B",
        #repo_id="Qwen/Qwen2.5-7B-Instruct",
        temperature=0.01,
        max_new_tokens=4000,
        return_full_text=False
    )
    llm = ChatHuggingFace(llm=llm_endpoint)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Tu es un assistant IA expert en recrutement académique spécialisé dans l'évaluation des candidats pour des postes d'enseignants universitaires.\n"
                   "Tu vas recevoir une offre d'emploi au format JSON et un CV de candidat (texte ou au format JSON).\n"
                   "Ton rôle est d'analyser le CV du candidat par rapport à l'offre d'emploi et de produire un score de compatibilité détaillé avec le JSON demandé.\n\n"
                   "MÉTHODOLOGIE D'ÉVALUATION ET DE NOTATION OBLIGATOIRE (Total: 100 points) :\n\n"
                   "1. Education Level (20 points):\n"
                   "- Correspondance exacte (ex: Doctorat requis -> a Doctorat): 20/20\n"
                   "- Un niveau en dessous (ex: Master au lieu de Doctorat): 10/20\n"
                   "- Deux niveaux ou plus en dessous: 0/20\n\n"
                   "2. Required Skills Match (30 points):\n"
                   "- Score = (compétences identifiées / total requises) * 30\n"
                   "- Prends en compte les correspondances partielles (ex: 'PyTorch' correspond à 'Deep Learning ecosystem'). Liste explicitement les compétences trouvées et manquantes deduites du CV.\n\n"
                   "3. Years of Experience (20 points):\n"
                   "- Atteint ou dépasse minYearsExperience: 20/20\n"
                   "- À moins d'1 an en dessous: 12/20\n"
                   "- À moins de 2 ans en dessous: 6/20\n"
                   "- Plus de 2 ans en dessous: 0/20\n\n"
                   "4. Academic Experience (10 points):\n"
                   "- Si academicExperience = true dans l'offre :\n"
                   "  - Le candidat a de l'expérience d'enseignement/recherche (conférences, TP, thèses encadrées, publications) : 10/10\n"
                   "  - Aucune expérience académique trouvée : 0/10\n"
                   "- Si academicExperience = false : auto-accorde 10/10\n\n"
                   "5. Module/Domain Alignment (15 points):\n"
                   "- Compare les cours enseignés / domaines de recherche avec les `modules` requis.\n"
                   "- Alignement total (3+ modules correspondants): 15/15\n"
                   "- Alignement partiel (1-2 modules): 8/15\n"
                   "- Aucun alignement: 0/15\n\n"
                   "6. Department/Speciality Fit (5 points):\n"
                   "- Correspondance exacte de la specialite ou du department: 5/5\n"
                   "- Domaine lié / connexe: 3/5\n"
                   "- Non lié: 0/5\n\n"
                   "CALCUL DU SCORE GLOBAL ET GRADE :\n"
                   "Le score global (sur 100) est la somme exacte des 6 critères.\n"
                   "Grade Scale :\n"
                   "- 90-100 -> 'Excellent'\n"
                   "- 75-89  -> 'Très Bon'\n"
                   "- 60-74  -> 'Acceptable'\n"
                   "- 40-59  -> 'Faible'\n"
                   "- 0-39   -> 'Non compatible'\n\n"
                   "RÈGLES STRICTES :\n"
                   "- Toujours extraire les compétences du CV même si elles ne sont pas dans une section 'compétences'.\n"
                   "- Sois strict sur le niveau du diplôme. Ne gonfle pas les scores.\n"
                   "- Le CV peut être en français ou arabe, l'extraire correctement.\n"
                   "- Si une information est manquante dans le CV, le score est 0 et le noter comme 'Information manquante'.\n"
                   "- N'invente AUCUNE qualification non présente.\n\n"
                   "INSTRUCTIONS DE FORMATAGE :\n{format_instructions}\n"
                   "PRODUIS STRICTEMENT CE JSON. N'AJOUTE AUCUN TEXTE AUTOUR.\n"
                   "NO-THINKING-MODE"
        ),
        ("user", "OFFRE D'EMPLOI:\n{job_offer}\n\nDONNÉES DU CANDIDAT (Texte Brut):\n{cv_text}\n\nDONNÉES DU CANDIDAT (JSON Extrait):\n{cv_data}")
    ])
    
    extraction_chain = prompt | llm
    
    import json
    # Préparer les inputs
    job_offer_str = request.jobOffer.model_dump_json() if hasattr(request.jobOffer, 'model_dump_json') else json.dumps(request.jobOffer)
    cv_text_str = request.cvText if request.cvText else ""
    cv_data_str = json.dumps(request.cvData) if request.cvData else ""
    
    resultat_brut = extraction_chain.invoke({
        "job_offer": job_offer_str,
        "cv_text": cv_text_str,
        "cv_data": cv_data_str,
        "format_instructions": parser.get_format_instructions()
    })
    
    cleaned_json_text = clean_llm_json(resultat_brut.content)
    
    try:
        import json_repair
        dict_output = json_repair.loads(cleaned_json_text)
        
        if not isinstance(dict_output, dict):
            raise ValueError("Le résultat n'est pas un dictionnaire JSON valide.")
            
        parsed_result = EvaluationResult(**dict_output)
        return parsed_result.model_dump()
    except Exception as e:
        raise ValueError(f"Erreur de conversion JSON pour l'évaluation. Extrait : {cleaned_json_text[:200]}... / Erreur: {str(e)}")

