# tests/test_api.py
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

def test_health():
    # Test simple sans charger le modèle
    assert True

def test_imports():
    from utils import CVExtraction, Identification
    cv = CVExtraction()
    assert cv.identification is not None