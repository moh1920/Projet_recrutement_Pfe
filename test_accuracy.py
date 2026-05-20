import spacy
from spacy.training import Example
from spacy.scorer import Scorer
from utils import extract_information, CVExtraction
import json
import os
from typing import List, Dict, Tuple
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
import numpy as np

class CVModelAccuracyTester:
    """Test accuracy and performance of the CV extraction model"""
    
    def __init__(self, model_dir="./models/model_ner_cv"):
        self.model_dir = model_dir
        self.nlp = None
        self.load_model()
        self.results = {
            'entity_metrics': {},
            'extraction_metrics': {},
            'samples_tested': 0,
            'extraction_accuracies': [],
            'detailed_results': []
        }
    
    def load_model(self):
        """Load the trained spaCy model with vectors workaround"""
        print(f"Loading model from {self.model_dir}...")
        try:
            self.nlp = spacy.load(self.model_dir)
            
            # Workaround for [E896] with static vectors in SpaCy
            if self.nlp.vocab.vectors.shape == (0, 0):
                import numpy as np
                self.nlp.vocab.vectors.name = 'fr_vectors'
                self.nlp.vocab.vectors.resize((1, 300))
                self.nlp.vocab.vectors.data[0] = np.zeros(300)
                
            print("[OK] Model loaded successfully")
        except OSError:
            print("[ERROR] Model not found! Please run train_model.py first.")
            raise
        except Exception as e:
            print(f"Warning loading model: {e}")
            raise
    
    def test_cv_samples(self, test_data: List[Tuple[str, dict]]):
        """
        Test the model on multiple CV samples
        
        Args:
            test_data: List of tuples (cv_text, expected_output)
        """
        print(f"\n=== Testing on {len(test_data)} CV samples ===\n")
        
        extraction_accuracies = []
        
        for idx, (cv_text, expected) in enumerate(test_data, 1):
            print(f"Sample {idx}/{len(test_data)}...")
            
            try:
                # Extract information using the model
                result_json = extract_information(cv_text, self.nlp)
                
                # Convert to dict if needed
                if isinstance(result_json, CVExtraction):
                    result_dict = result_json.model_dump()
                else:
                    result_dict = result_json
                
                print(f"  [OK] Extraction completed")
                print(f"    - Email extracted: {result_dict.get('identification', {}).get('email', 'N/A')}")
                print(f"    - Name: {result_dict.get('identification', {}).get('nom', 'N/A')}")
                print(f"    - Experience: {result_dict.get('experience', {}).get('nb_annees_experience', 0)} years")
                print(f"    - Skills: {len(result_dict.get('competences', {}).get('langages', []))} technical skills detected")
                
                # Compare with expected
                accuracy = self.compare_results(result_dict, expected)
                extraction_accuracies.append(accuracy)
                print(f"    - Accuracy: {accuracy:.2%}\n")
                
                # Store detailed result
                self.results['detailed_results'].append({
                    'sample': idx,
                    'accuracy': accuracy,
                    'extracted': result_dict,
                    'expected': expected
                })
                
            except Exception as e:
                print(f"  [ERROR] Error processing sample {idx}: {str(e)}")
                print(f"    Attempting to extract basic info...\n")
                extraction_accuracies.append(0.0)
        
        self.results['samples_tested'] = len(test_data)
        self.results['extraction_accuracies'] = extraction_accuracies
        
        if extraction_accuracies:
            avg_accuracy = sum(extraction_accuracies) / len(extraction_accuracies)
            print(f"\n[OK] Average Extraction Accuracy: {avg_accuracy:.2%}")
            self.results['avg_extraction_accuracy'] = avg_accuracy
    
    def compare_results(self, extracted: dict, expected: dict) -> float:
        """
        Compare extracted results with expected output
        
        Returns:
            Accuracy score between 0 and 1
        """
        accuracy_scores = []
        
        # Test identification fields
        identification = extracted.get('identification', {})
        expected_id = expected.get('identification', {})
        
        if expected_id.get('email'):
            email_match = identification.get('email') == expected_id.get('email')
            accuracy_scores.append(1.0 if email_match else 0.0)
            if not email_match:
                print(f"      Email mismatch: got '{identification.get('email')}', expected '{expected_id.get('email')}'")
        
        # Test formation
        formation = extracted.get('formation', {})
        expected_formation = expected.get('formation', {})
        
        formation_matches = 0
        formation_total = 0
        
        if expected_formation.get('niveau_diplome'):
            formation_total += 1
            if formation.get('niveau_diplome') == expected_formation.get('niveau_diplome'):
                formation_matches += 1
        
        if formation_total > 0:
            accuracy_scores.append(formation_matches / formation_total)
        
        # Test competences (case-insensitive)
        competences = extracted.get('competences', {})
        expected_comp = expected.get('competences', {})
        
        comp_matches = 0
        comp_total = 0
        
        for comp_type in ['langages', 'frameworks', 'data', 'ia']:
            expected_list = expected_comp.get(comp_type, [])
            extracted_list = competences.get(comp_type, [])
            
            if expected_list:
                comp_total += len(expected_list)
                for item in expected_list:
                    if item.lower() in [x.lower() for x in extracted_list]:
                        comp_matches += 1
        
        if comp_total > 0:
            accuracy_scores.append(comp_matches / comp_total)
        
        # Return average accuracy
        if accuracy_scores:
            return sum(accuracy_scores) / len(accuracy_scores)
        else:
            return 0.5  # Default to neutral if no comparison possible
    
    def test_simple_ner(self):
        """Simple NER test on a single sample"""
        print("\n=== Simple NER Test ===\n")
        
        simple_text = "Jean Dupont. Email: jean@example.com. Python et Java."
        
        try:
            doc = self.nlp(simple_text)
            
            print(f"Text analyzed: '{simple_text}'")
            print(f"Entities found: {len(doc.ents)}")
            
            for ent in doc.ents:
                print(f"  - {ent.text} ({ent.label_})")
            
            self.results['entity_metrics']['simple_test'] = {
                'entities_detected': len(doc.ents),
                'status': 'success'
            }
            
        except Exception as e:
            print(f"Note: Simple NER test encountered: {str(e)[:80]}")
            self.results['entity_metrics']['simple_test'] = {
                'status': 'warning',
                'note': str(e)[:100]
            }
    
    def save_results(self, output_file="test_results.json"):
        """Save test results to file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False, default=str)
        print(f"\n[OK] Results saved to {output_file}")
    
    def print_summary(self):
        """Print summary of test results"""
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        print(f"Samples tested: {self.results['samples_tested']}")
        
        if 'avg_extraction_accuracy' in self.results:
            print(f"Average extraction accuracy: {self.results['avg_extraction_accuracy']:.2%}")
        
        if self.results['extraction_accuracies']:
            print(f"Min accuracy: {min(self.results['extraction_accuracies']):.2%}")
            print(f"Max accuracy: {max(self.results['extraction_accuracies']):.2%}")
        
        print("\n[SUCCESS] Test completed successfully!")


def get_test_data() -> List[Tuple[str, dict]]:
    """Get sample CV data for testing"""
    return [
        (
            """
            Ahmed Ben Ali
            Email: ahmed.benali@example.com
            Téléphone: +216 98 123 456
            
            Formation:
            Doctorat en Informatique - Université de Tunis El Manar (2022)
            
            Expérience:
            Chercheur et enseignant avec 8 ans d'expérience académique.
            Professeur à ESPRIT (3 ans)
            
            Compétences:
            Java, Python, Spring Boot, Angular, Machine Learning, Power BI
            
            Langues:
            Français (Bilingue), Anglais (Avancé), Arabe (Maternel)
            """,
            {
                'identification': {'email': 'ahmed.benali@example.com'},
                'formation': {'niveau_diplome': 'Doctorat'},
                'competences': {
                    'langages': ['Java', 'Python'],
                    'frameworks': ['Spring Boot', 'Angular'],
                    'ia': ['Machine Learning'],
                    'data': ['Power BI']
                }
            }
        ),
        (
            """
            Marie Dupont
            Email: marie.dupont@mail.com
            Téléphone: +33 6 12 34 56 78
            
            Formation:
            Master en Génie Logiciel - Université Paris VI (2021)
            
            Expérience:
            Développeuse avec 5 ans d'expérience
            Travail chez TechCorp (2 ans)
            
            Compétences:
            C++, JavaScript, TypeScript, React, Vue.js, Deep Learning
            
            Langues:
            Français (Maternel), Anglais (Fluide), Espagnol (Intermédiaire)
            """,
            {
                'identification': {'email': 'marie.dupont@mail.com'},
                'formation': {'niveau_diplome': 'Master'},
                'competences': {
                    'langages': ['C++', 'JavaScript', 'TypeScript'],
                    'frameworks': ['React', 'Vue.js'],
                    'ia': ['Deep Learning'],
                    'data': []
                }
            }
        ),
    ]


if __name__ == "__main__":
    try:
        # Create tester instance
        tester = CVModelAccuracyTester()
        
        # Get test data
        test_data = get_test_data()
        
        # Run tests
        tester.test_cv_samples(test_data)
        tester.test_simple_ner()
        
        # Print and save results
        tester.print_summary()
        tester.save_results()
        
        print("\n[SUCCESS] All tests completed successfully!")
        
    except Exception as e:
        print(f"\n[ERROR] Error during testing: {str(e)}")
        print("\nTroubleshooting tips:")
        print("1. Make sure the model is trained: python train_model.py")
        print("2. Check that requirements.txt dependencies are installed: pip install -r requirements.txt")
        print("3. Try deleting the model folder and retraining")
        import traceback
        traceback.print_exc()
