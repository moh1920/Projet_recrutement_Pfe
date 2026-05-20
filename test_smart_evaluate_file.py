import json
import os
import requests

def test_smart_evaluate_file_api():
    print("="*60)
    print("TESTING SMART EVALUATE FILE ENDPOINT (/api/v4/smart-evaluate-file)")
    print("="*60)
    
    url = "http://127.0.0.1:8000/api/v4/smart-evaluate-file"
    
    # Check if cv_text.txt exists in current directory
    cv_filename = "cv_text.txt"
    if not os.path.exists(cv_filename):
        print(f"Error: {cv_filename} not found in the current directory.")
        return
        
    job_offer_data = {
        "title": "Maître de Conférences en Intelligence Artificielle et Génie Logiciel",
        "department": "Département Informatique",
        "speciality": "Intelligence Artificielle / NLP / Génie Logiciel",
        "requiredLevel": "Ingénieur ou Doctorat",
        "minYearsExperience": 2,
        "academicExperience": True,
        "requiredSkills": ["Java", "Python", "Machine Learning", "NLP", "Angular", "Spring Boot"],
        "modules": ["Génie Logiciel", "Intelligence Artificielle", "Développement Web"],
        "description": "Recherche enseignant-chercheur pour animer des cours de développement web et IA."
    }
    
    # Prepare files and data for multipart upload
    files = {
        "file": (cv_filename, open(cv_filename, "rb"), "text/plain")
    }
    data = {
        "jobOffer": json.dumps(job_offer_data)
    }
    
    try:
        print(f"Sending POST request to {url} with file: {cv_filename}...")
        response = requests.post(url, files=files, data=data, timeout=120)
        
        print(f"HTTP Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("\n--- SMART EVALUATION FILE RESPONSE ---")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print("---------------------------------------")
        else:
            print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Failed to connect or process request: {e}")

if __name__ == "__main__":
    test_smart_evaluate_file_api()
