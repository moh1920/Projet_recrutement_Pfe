from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy
import json
from utils import (
    extract_information, CVExtraction, extract_text_from_file, 
    extract_information_llm, extract_information_hybrid,
    EvaluationRequest, EvaluationResult, evaluate_cv_against_offer
)
import os
from dotenv import load_dotenv

from contextlib import asynccontextmanager

load_dotenv() # Load environment variables from .env file

# Global variable to hold our model
nlp_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global nlp_model
    model_dir = "./models/model_ner_cv"
    if not os.path.exists(model_dir):
        print(f"Warning: Modèle non trouvé dans {model_dir}. Utilisation du modèle de base fr_core_news_lg.")
        try:
            nlp_model = spacy.load("fr_core_news_lg")
        except OSError:
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "fr_core_news_lg"])
            nlp_model = spacy.load("fr_core_news_lg")
    else:
        print(f"Loading custom NER model from {model_dir}...")
        nlp_model = spacy.load(model_dir)
    yield

app = FastAPI(
    title="API d'Extraction CV - Modele NER",
    description="API permettant d'extraire les données d'un CV texte au format JSON à l'aide d'un modèle SpaCy personnalisé.",
    version="1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lifespan and model initialization are now defined above.

class CVTextInput(BaseModel):
    texte_brut: str

@app.post("/api/v1/extract-cv", response_model=CVExtraction)
async def extract_cv(payload: CVTextInput):
    if not payload.texte_brut or not payload.texte_brut.strip():
        raise HTTPException(status_code=400, detail="Le texte du CV est vide.")
    
    try:
        # Extract information using our logic and model
        result_dict = extract_information(payload.texte_brut, nlp_model)
        return result_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction: {str(e)}")

@app.post("/api/v1/extract-cv-file", response_model=CVExtraction)
async def extract_cv_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=415, detail="Format non supporté. Veuillez uploader un PDF, DOCX ou Image (PNG/JPG).")
        
    try:
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Le fichier est trop volumineux (max 5 Mo).")
            
        extracted_text = extract_text_from_file(content, file.filename)
        
        if not extracted_text.strip():
             raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")
             
        # Process the extracted text
        result_dict = extract_information(extracted_text, nlp_model)
        return result_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du fichier: {str(e)}")

@app.post("/api/v2/extract-cv-llm", response_model=CVExtraction)
async def extract_cv_llm(payload: CVTextInput):
    """Extraction de CV via un LLM (LangChain + OpenAI) pour des résultats plus fins."""
    if not payload.texte_brut or not payload.texte_brut.strip():
        raise HTTPException(status_code=400, detail="Le texte du CV est vide.")
    
    try:
        result_dict = extract_information_llm(payload.texte_brut)
        return result_dict
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction LLM: {str(e)}")

@app.post("/api/v2/extract-cv-file-llm", response_model=CVExtraction)
async def extract_cv_file_llm(file: UploadFile = File(...)):
    """Extraction de CV depuis un PDF/DOCX en utilisant un LLM (LangChain + OpenAI)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=415, detail="Format non supporté. Veuillez uploader un PDF, DOCX ou Image (PNG/JPG).")
        
    try:
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Le fichier est trop volumineux (max 5 Mo).")
            
        extracted_text = extract_text_from_file(content, file.filename)
        
        if not extracted_text.strip():
             raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")
             
        result_dict = extract_information_llm(extracted_text)
        return result_dict
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement LLM du fichier: {str(e)}")

@app.post("/api/v3/extract-cv-hybrid", response_model=CVExtraction)
async def extract_cv_hybrid(payload: CVTextInput):
    """Extraction Hybride V3 (SpaCy NER -> Traitement LLM)."""
    if not payload.texte_brut or not payload.texte_brut.strip():
        raise HTTPException(status_code=400, detail="Le texte du CV est vide.")
    
    try:
        result_dict = extract_information_hybrid(payload.texte_brut, nlp_model)
        return result_dict
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction hybride: {str(e)}")

@app.post("/api/v3/extract-cv-file-hybrid", response_model=CVExtraction)
async def extract_cv_file_hybrid(file: UploadFile = File(...)):
    """Extraction Hybride V3 depuis un PDF/DOCX."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=415, detail="Format non supporté. Veuillez uploader un PDF, DOCX ou Image (PNG/JPG).")
        
    try:
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Le fichier est trop volumineux (max 5 Mo).")
            
        extracted_text = extract_text_from_file(content, file.filename)
        
        if not extracted_text.strip():
             raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")
             
        result_dict = extract_information_hybrid(extracted_text, nlp_model)
        return result_dict
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement hybride du fichier: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": nlp_model is not None}

@app.post("/api/v2/evaluate-cv", response_model=EvaluationResult)
async def evaluate_cv(payload: EvaluationRequest):
    """
    Évaluation d'un CV par rapport à une offre d'emploi (Academic Teacher Matching).
    Prend en entrée l'offre et les données du CV (texte ou JSON) et génère un score détaillé.
    """
    if not payload.cvText and not payload.cvData:
        raise HTTPException(status_code=400, detail="Vous devez fournir au moins cvText ou cvData du candidat.")
        
    try:
        result_dict = evaluate_cv_against_offer(payload)
        return result_dict
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'évaluation du CV par le LLM: {str(e)}")

@app.post("/api/v2/evaluate-cv-file", response_model=EvaluationResult)
async def evaluate_cv_file(
    file: UploadFile = File(...),
    offer_json: str = Form(...)
):
    """
    Évaluation d'un CV (fichier PDF/DOCX) par rapport à une offre d'emploi.
    L'offre doit être envoyée en tant que string JSON dans un champ 'offer_json' (multipart/form-data).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=415, detail="Format non supporté. Veuillez uploader un PDF, DOCX ou Image (PNG/JPG).")
        
    try:
        from utils import JobOffer
        # 1. Parser l'offre depuis le string JSON form-data
        offer_dict = json.loads(offer_json)
        job_offer = JobOffer(**offer_dict)
        
        # 2. Extraire le texte du CV
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Le fichier est trop volumineux (max 5 Mo).")
        extracted_text = extract_text_from_file(content, file.filename)
        
        if not extracted_text.strip():
             raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")
             
        # 3. Construire la payload
        payload = EvaluationRequest(
            jobOffer=job_offer,
            cvText=extracted_text
        )
        
        # 4. Évaluer via LLM
        result_dict = evaluate_cv_against_offer(payload)
        return result_dict
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="offer_json field must be a valid JSON string.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du fichier ou de l'évaluation: {str(e)}")

