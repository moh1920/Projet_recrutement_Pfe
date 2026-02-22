from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import spacy
from utils import extract_information, CVExtraction, extract_text_from_file, extract_information_llm, extract_information_hybrid
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

app = FastAPI(
    title="API d'Extraction CV - Modele NER",
    description="API permettant d'extraire les données d'un CV texte au format JSON à l'aide d'un modèle SpaCy personnalisé.",
    version="1.0"
)

# Global variable to hold our model
nlp_model = None

@app.on_event("startup")
def load_nlp_model():
    global nlp_model
    model_dir = "./models/model_ner_cv"
    if not os.path.exists(model_dir):
        print(f"Warning: Modèle non trouvé dans {model_dir}. Utilisation du modèle de base fr_core_news_sm.")
        try:
            nlp_model = spacy.load("fr_core_news_sm")
        except OSError:
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "fr_core_news_sm"])
            nlp_model = spacy.load("fr_core_news_sm")
    else:
        print(f"Loading custom NER model from {model_dir}...")
        nlp_model = spacy.load(model_dir)

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
        
    try:
        content = await file.read()
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
        
    try:
        content = await file.read()
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
        
    try:
        content = await file.read()
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

# To run the app:
# uvicorn app:app --reload
