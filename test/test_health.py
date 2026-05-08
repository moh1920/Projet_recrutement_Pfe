"""
Tests minimaux pour le CV API.
Vérifie que l'application FastAPI démarre et répond correctement.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_returns_200():
    """Le endpoint /health doit retourner HTTP 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_format():
    """Le endpoint /health doit retourner un JSON avec une clé 'status'."""
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert data["status"] in ("ok", "healthy", "ready")


def test_docs_available():
    """La documentation OpenAPI doit être accessible."""
    response = client.get("/docs")
    assert response.status_code == 200


def test_openapi_schema():
    """Le schéma OpenAPI JSON doit être accessible."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "paths" in data