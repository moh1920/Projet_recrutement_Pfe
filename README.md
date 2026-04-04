# AI Matching Service - PFE

Un microservice basé sur l'Intelligence Artificielle et le Traitement du Langage Naturel (NLP) pour évaluer la pertinence entre les candidats et les offres d'emploi.

Ce service s'intègre avec une architecture backend (ex: Spring Boot) pour fournir des scores de correspondance précis ("Matching Score").

## 🚀 Fonctionnalités Principales

- **Matching Simple** (`/api/match`) : Compare 1 Candidat avec 1 Offre.
- **Ranking de Candidats** (`/api/rank-candidates`) : Filtre et classe simultanément une liste de Candidats pour 1 Offre (Trié du plus compatible au moins compatible).
- **Ranking d'Offres** (`/api/rank-offers`) : Filtre et classe simultanément une liste d'Offres pour 1 Candidat (Trié du plus compatible au moins compatible).
- **Entraînement du Modèle** (`/api/train`) : Permet de Fine-Tuner le modèle NLP avec des exemples historiques d'adéquation (Offres/Candidats).

### 🔍 L'algorithme (Score sur 100%)

Le calcul du score (`globalScore`) est pondéré sur 4 critères d'évaluation :
1. **Similarité Sémantique (40%)** : Utilise le modèle Transformer NLP de HuggingFace (`paraphrase-multilingual-MiniLM-L12-v2`). Il convertit les textes en vecteurs pour analyser le *sens* du profil par rapport à la description de l'offre (NLP).
2. **Compétences Techniques (30%)** : Matching exact des compétences exigées (Langages de programmation, Outils, Frameworks).
3. **Niveau d'Études (15%)** : Vérification de la hiérarchie académique (Licence, Master, Ingénieur, Doctorat).
4. **Expérience (15%)** : Minimum d'années d'expérience confronté au profil du candidat.

---

## 🛠️ Installation & Démarrage

### Pré-requis
- Python 3.9 ou plus récent.
- Un backend Spring Boot (ou NodeJS) prêt à consommer l'API.

### Installation
1. Placer vous dans le dossier du microservice et installer les dépendances (idéalement dans un Virtual Environment `venv`) :
   ```bash
   pip install -r requirements.txt
   ```
2. Lancer le serveur local (avec rechargement à chaud) en utilisant `uvicorn` :
   ```bash
   python -m uvicorn main:app --port 8001 --reload
   ```
   > **Note :** Lors du 1er lancement, le modèle linguistique NLP sera téléchargé manuellement d'Internet (environ 470 Mo) la console peut donc rester bloquée pendant un moment avant d'afficher `Application startup complete`.

---

## 🔌 Comment l'intégrer dans Spring Boot (Java) ?

L'intégration se fait très simplement : le Spring Boot se sert de FastAPI comme d'une calculatrice avancée en lui envoyant la donnée et en réceptionnant le classement final.

### 1. Créer les DTOs
Vous devez structurer vos envois JSON (Data Transfer Objects) sous la forme :
- Le payload pour `/api/rank-candidates` :
  ```json
  {
      "offer": { /* Entité Java Offer */ },
      "pairs": [
          {
              "candidate": { /* Entité Java Candidate 1 */ },
              "profile": { /* Profil rattaché au candidat 1 */ }
          },
          { /* ... pairs suivantes ... */ }
      ]
  }
  ```
- Le payload pour `/api/train` (pour entraîner le modèle NLP) :
  ```json
  {
      "examples": [
          {
              "offer_text": "Développeur Java Spring Boot...",
              "candidate_text": "Ingénieur en développement 5 ans d'expérience...",
              "score": 0.95
          }
      ],
      "epochs": 2
  }
  ```

### 2. Service Spring Boot (RestTemplate)
Créez un simple Service Java qui va interroger FastAPI via HTTP POST.
```java
@Service
public class AiMatchingService {
    @Value("${ai.matching.api.url:http://127.0.0.1:8001}")
    private String pythonApiBaseUrl;

    private final RestTemplate restTemplate;

    public AiMatchingService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<MatchResult> rankCandidatesForOffer(Object offer, List<CandidateProfilePair> candidatesPairs) {
        MatchMultipleRequest request = new MatchMultipleRequest();
        request.setOffer(offer);
        request.setPairs(candidatesPairs);

        ResponseEntity<MatchResult[]> response = restTemplate.postForEntity(
            pythonApiBaseUrl + "/api/rank-candidates", request, MatchResult[].class
        );
        return Arrays.asList(response.getBody());
    }
}
```

### 3. Contrôleur REST
Appelez ce service dans votre `RestController` Spring Boot pour renvoyer le `List<MatchResult>` propre et trié à votre interface Angular !

---

## 🧪 Tests Unitaires Rapides

Un fichier Python nommé `test_matching.py` a été créé pour permettre de simuler les différents envoies sans allumer le serveur Spring Boot.

Assurez vous que le serveur Uvicorn FastAPI tourne. Puis exécutez le script :
```bash
python test_matching.py
```
Ce script exécutera trois tests grandeur nature qui s'afficheront en console : 
1. Un Matching simple.
2. Le classement de deux candidats pour le poste d'Enseignant.
3. Le classement de deux offres différentes pour un même enseignant.
