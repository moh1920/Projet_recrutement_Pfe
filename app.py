from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils_azure import download_model_from_blob
import spacy
import json
import os
import re
from utils import (
    extract_information, CVExtraction, extract_text_from_file,
    extract_information_llm, extract_information_hybrid,
    EvaluationRequest, EvaluationResult, evaluate_cv_against_offer
)
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from smart_engine import evaluate_candidate, rank_candidates, JobOffer


load_dotenv()

nlp_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global nlp_model

    # ✅ Plus besoin de download_model_from_blob ici
    # Le modèle est déjà dans l'image Docker
    # download_model_from_blob("./models/model_ner_cv")  ← SUPPRIMER cette ligne

    model_dir = "./models/model_ner_cv"
    print(f"Chargement du modèle NER depuis {model_dir}...")
    nlp_model = spacy.load(model_dir)
    
    # Workaround pour l'erreur [E896] avec les vecteurs statiques SpaCy
    if nlp_model.vocab.vectors.shape == (0, 0):
        import numpy as np
        nlp_model.vocab.vectors.name = 'fr_vectors'
        nlp_model.vocab.vectors.resize((1, 300))
        nlp_model.vocab.vectors.data[0] = np.zeros(300)

    print("Modèle NER chargé.")
    yield

app = FastAPI(
    title="API d'Extraction CV - Modele NER",
    description="API permettant d'extraire les données d'un CV texte au format JSON à l'aide d'un modèle SpaCy personnalisé.",
    version="1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "https://pfe-frontend.graymoss-d46652df.francecentral.azurecontainerapps.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CVTextInput(BaseModel):
    texte_brut: str

@app.post("/api/v1/extract-cv", response_model=CVExtraction)
async def extract_cv(payload: CVTextInput):
    if not payload.texte_brut or not payload.texte_brut.strip():
        raise HTTPException(status_code=400, detail="Le texte du CV est vide.")
    try:
        result_dict = extract_information(payload.texte_brut, nlp_model)
        return result_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction: {str(e)}")
@app.post("/api/v4/smart-evaluate")
async def smart_evaluate(payload: EvaluationRequest):
    offer  = JobOffer(**payload.jobOffer.dict())
    result = evaluate_candidate(payload.cvText, offer, "Candidat", nlp_model)
    return result.model_dump()

@app.post("/api/v4/extract-cv-file", response_model=CVExtraction)
async def extract_cv_file_v4(file: UploadFile = File(...)):
    """
    Extraction pure d'un CV depuis un fichier (PDF, DOCX, image, TXT).
    Aucune offre d'emploi requise. Retourne les données structurées du CV.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp', '.tiff', '.txt']:
        raise HTTPException(status_code=415, detail="Format non supporté.")
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
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'extraction du CV: {str(e)}")

@app.post("/api/v4/smart-evaluate-file")
async def smart_evaluate_file(
    file: UploadFile = File(...),
    jobOffer: str = Form(...)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp', '.tiff', '.txt']:
        raise HTTPException(status_code=415, detail="Format non supporté.")
    try:
        offer_dict = json.loads(jobOffer)
        if isinstance(offer_dict, dict) and "jobOffer" in offer_dict:
            offer_dict = offer_dict["jobOffer"]
        job_offer = JobOffer(**offer_dict)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Le fichier est trop volumineux (max 5 Mo).")
        extracted_text = extract_text_from_file(content, file.filename)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")
        
        result = evaluate_candidate(extracted_text, job_offer, "Candidat", nlp_model)
        return result.model_dump()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="jobOffer field must be a valid JSON string.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du fichier ou de l'évaluation intelligente: {str(e)}")

@app.post("/api/v1/extract-cv-file", response_model=CVExtraction)
async def extract_cv_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=415, detail="Format non supporté.")
    try:
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Le fichier est trop volumineux (max 5 Mo).")
        extracted_text = extract_text_from_file(content, file.filename)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")
        result_dict = extract_information(extracted_text, nlp_model)
        return result_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du fichier: {str(e)}")

@app.post("/api/v2/extract-cv-llm", response_model=CVExtraction)
async def extract_cv_llm(payload: CVTextInput):
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
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=415, detail="Format non supporté.")
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
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=415, detail="Format non supporté.")
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
    if not file.filename:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']:
        raise HTTPException(status_code=415, detail="Format non supporté.")
    try:
        from utils import JobOffer
        offer_dict = json.loads(offer_json)
        if isinstance(offer_dict, dict) and "jobOffer" in offer_dict:
            offer_dict = offer_dict["jobOffer"]
        elif isinstance(offer_dict, dict) and "offer" in offer_dict:
            offer_dict = offer_dict["offer"]
        job_offer = JobOffer(**offer_dict)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Le fichier est trop volumineux (max 5 Mo).")
        extracted_text = extract_text_from_file(content, file.filename)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")
        payload = EvaluationRequest(jobOffer=job_offer, cvText=extracted_text)
        result_dict = evaluate_cv_against_offer(payload)
        return result_dict
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="offer_json field must be a valid JSON string.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du traitement du fichier ou de l'évaluation: {str(e)}")