import math
from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        # Arial bold 15
        self.set_font('helvetica', 'B', 15)
        # Calculate width of title and position
        # Title
        self.cell(0, 10, 'Rapport : Modeles et Outils IA du Systeme de Recrutement', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('helvetica', 'I', 8)
        # Page number
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

def generate_pdf():
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font('helvetica', '', 12)

    # Introduction
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, 'Introduction', 0, 1)
    pdf.set_font('helvetica', '', 12)
    intro = ("Ce rapport presente en detail les modeles d'Intelligence Artificielle (IA) et "
             "les outils de Traitement du Langage Naturel (NLP) utilises dans le systeme "
             "intelligent de recrutement de l'universite. L'objectif est de decrire les modeles "
             "choisis, leur role specifique et les donnees qu'ils traitent pour assurer "
             "l'extraction, l'analyse automatique des CVs et le calcul des scores de compatibilite.")
    pdf.multi_cell(0, 8, intro)
    pdf.ln(5)

    # Models Section
    # 1. spaCy
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, "1. spaCy (Modeles: fr_core_news_sm, fr_core_news_lg)", 0, 1)
    pdf.set_font('helvetica', '', 12)
    spacy_text = (
        "Role Principal: Moteur de base du traitement linguistique et extraction d'entites nommees (NER).\n\n"
        "Fonctionnement:\n"
        "- Tokenisation et Lemmatisation : Decoupe et reduit les mots a leur racine.\n"
        "- Reconnaissance d'Entites Nommees (NER) : Detecte de maniere pre-entrainee les noms, "
        "universites, dates et organismes dans le CV.\n"
        "- Personnalisation (EntityRuler / SpanRuler) : Utilise pour detecter, a laide de regles metier, "
        "les competences techniques (Java, Angular, etc.) et les titres ou diplomes academiques."
    )
    pdf.multi_cell(0, 8, spacy_text)
    pdf.ln(5)

    # 2. Sentence-BERT et Hugging Face Transformers
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, "2. Sentence-BERT et Hugging Face Transformers", 0, 1)
    pdf.set_font('helvetica', '', 12)
    sbert_text = (
        "Role Principal: Analyse semantique et correspondance de competences (Skill Matching).\n\n"
        "Fonctionnement:\n"
        "- Plonge les competences extraites dans un espace vectoriel dense (Semantic Embeddings).\n"
        "- Permet de detecter les similarites contextuelles meme si les mots ne sont pas des correspondances "
        "exactes (ex. reconnait 'Machine Learning' et 'Apprentissage Automatique' comme similaires).\n"
        "- Construit un profil de competences hybride combinant dictionnaire et sens semantique."
    )
    pdf.multi_cell(0, 8, sbert_text)
    pdf.ln(5)

    # 3. TF-IDF et Cosine Similarity
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, "3. TF-IDF et Similarite Cosinus (Cosine Similarity)", 0, 1)
    pdf.set_font('helvetica', '', 12)
    tfidf_text = (
        "Role Principal: Calcul des indicateurs RH et ranking des candidats.\n\n"
        "Fonctionnement:\n"
        "- Transformation des extractions de texte du CV en un vecteur mathematique representatif (vecteur_CV).\n"
        "- Compare les occurrences de termes (Term Frequency-Inverse Document Frequency).\n"
        "- Calcule un score global et un score de competences de chaque candidat par rapport a l'offre d'emploi."
    )
    pdf.multi_cell(0, 8, tfidf_text)
    pdf.ln(5)

    # 4. NLTK (Natural Language Toolkit)
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, "4. NLTK (Natural Language Toolkit)", 0, 1)
    pdf.set_font('helvetica', '', 12)
    nltk_text = (
        "Role Principal: Nettoyage et pre-traitement fin du texte brut.\n\n"
        "Fonctionnement:\n"
        "- Enlevement des mots vides (Stop-words) peu informatifs, avec une configuration specialisee.\n"
        "- Fonctionnement de maniere complementaire avec spaCy pendant l'etape de normalisation textuelle."
    )
    pdf.multi_cell(0, 8, nltk_text)
    pdf.ln(5)

    # 5. Extracteurs Documentaires (PyMuPDF, python-docx, Tesseract OCR)
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, "5. Modeles d'Extraction OCR et Documentaire", 0, 1)
    pdf.set_font('helvetica', '', 12)
    ocr_text = (
        "Role Principal: Conversion des formats complexes en texte brut exploitable.\n\n"
        "Fonctionnement:\n"
        "- PyMuPDF / PDFPlumber extraient le texte numerique cache dans les PDF standards.\n"
        "- Tesseract OCR (Optical Character Recognition) reconnait et lit le texte dans les CV qui sont "
        "des images scannees (pixels).\n"
        "- python-docx traite de maniere fluide les fichiers Word classiques."
    )
    pdf.multi_cell(0, 8, ocr_text)
    pdf.ln(5)

    # Conclusion
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, 'Conclusion', 0, 1)
    pdf.set_font('helvetica', '', 12)
    conc = ("Le developpement de l'IA repose sur ce pipeline multicouche (OCR -> NLP basique -> Analyse semantique). "
            "Grâce a cette combinaison heterogene, la solution peut capturer l'ensemble du profil candidat "
            "pour generer une evaluation equitable et pertinente automatisee.")
    pdf.multi_cell(0, 8, conc)

    pdf.output("Rapport_Modeles_IA.pdf")
    print("PDF Report generated successfully at Rapport_Modeles_IA.pdf")

if __name__ == "__main__":
    generate_pdf()
