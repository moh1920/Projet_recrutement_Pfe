const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, VerticalAlign, Header, Footer
} = require('docx');
const fs = require('fs');

const PRIMARY = "1E3A5F";
const ACCENT  = "2E75B6";
const LIGHT_BLUE = "D6E4F0";
const MID_BLUE  = "BDD7EE";
const LIGHT_GREEN = "E2EFDA";
const LIGHT_RED   = "FCE4D6";
const LIGHT_YELLOW= "FFF2CC";
const WHITE = "FFFFFF";
const GRAY_BG = "F2F2F2";

const border1 = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border1, bottom: border1, left: border1, right: border1 };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 30, color: PRIMARY, font: "Arial" })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 26, color: ACCENT, font: "Arial" })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: "444444", font: "Arial" })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}

function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial", bold })]
  });
}

function subbullet(text) {
  return new Paragraph({
    numbering: { reference: "subbullets", level: 0 },
    spacing: { before: 30, after: 30 },
    children: [new TextRun({ text, size: 20, font: "Arial" })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function cell(text, fill = WHITE, bold = false, color = "000000", align = AlignmentType.LEFT, size = 20) {
  return new TableCell({
    borders,
    width: { size: 1, type: WidthType.AUTO },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, color, size, font: "Arial" })]
    })]
  });
}

function headerCell(text, fill = PRIMARY) {
  return cell(text, fill, true, WHITE, AlignmentType.CENTER, 20);
}

// ─── Tables ────────────────────────────────────────────────────────────────

function buildArchTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 2200, 2500, 2460],
    rows: [
      new TableRow({ children: [
        headerCell("Couche"),
        headerCell("Technologie"),
        headerCell("Rôle"),
        headerCell("Version / Remarque"),
      ]}),
      new TableRow({ children: [
        cell("Extraction Texte", LIGHT_BLUE, true),
        cell("PyMuPDF (fitz)"),
        cell("Lecture PDF natif & scanné"),
        cell("Fallback OCR si < 50 chars/page"),
      ]}),
      new TableRow({ children: [
        cell("Extraction Texte", LIGHT_BLUE, true),
        cell("python-docx"),
        cell("Lecture fichiers DOCX/DOC"),
        cell("Itération sur paragraphes"),
      ]}),
      new TableRow({ children: [
        cell("OCR", MID_BLUE, true),
        cell("Tesseract + OpenCV"),
        cell("Reconnaissance optique scans"),
        cell("OEM 3, PSM 3/4/6, fra+eng"),
      ]}),
      new TableRow({ children: [
        cell("NER Heuristique", LIGHT_BLUE, true),
        cell("spaCy fr_core_news_lg"),
        cell("Entités : PER, ORG, DATE, DIPLOMA"),
        cell("Fine-tuné 40 époques"),
      ]}),
      new TableRow({ children: [
        cell("NER Règles", LIGHT_BLUE, true),
        cell("spaCy EntityRuler"),
        cell("Compétences tech, universités TN"),
        cell("200+ patterns manuels"),
      ]}),
      new TableRow({ children: [
        cell("Extraction LLM", MID_BLUE, true),
        cell("Qwen3-8B via HuggingFace"),
        cell("Structuration JSON fine du CV"),
        cell("LangChain + json_repair"),
      ]}),
      new TableRow({ children: [
        cell("Évaluation", MID_BLUE, true),
        cell("Qwen3-8B via HuggingFace"),
        cell("Scoring CV vs offre (100 pts)"),
        cell("6 critères pondérés"),
      ]}),
      new TableRow({ children: [
        cell("API", LIGHT_BLUE, true),
        cell("FastAPI"),
        cell("Exposition des endpoints REST"),
        cell("v1 / v2 / v3 + CORS"),
      ]}),
      new TableRow({ children: [
        cell("Validation", LIGHT_BLUE, true),
        cell("Pydantic v2"),
        cell("Schémas d'entrée/sortie"),
        cell("CVExtraction, EvaluationResult"),
      ]}),
    ]
  });
}

function buildLLMCompareTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1700, 1200, 1200, 1200, 1200, 1200, 1660],
    rows: [
      new TableRow({ children: [
        headerCell("Modèle"),
        headerCell("Taille"),
        headerCell("JSON Strict"),
        headerCell("Qualité FR"),
        headerCell("Vitesse"),
        headerCell("Coût"),
        headerCell("Choix Projet"),
      ]}),
      new TableRow({ children: [
        cell("Qwen3-8B ✅", LIGHT_GREEN, true),
        cell("8B"),
        cell("⭐⭐⭐⭐⭐", false, false, "276221"),
        cell("⭐⭐⭐⭐", false, false, "276221"),
        cell("Rapide", false, false, "276221"),
        cell("Gratuit HF", false, false, "276221"),
        cell("Retenu (prod)", LIGHT_GREEN, true, "276221"),
      ]}),
      new TableRow({ children: [
        cell("Qwen2.5-7B"),
        cell("7B"),
        cell("⭐⭐⭐⭐⭐"),
        cell("⭐⭐⭐⭐"),
        cell("Rapide"),
        cell("Gratuit HF"),
        cell("Alternative"),
      ]}),
      new TableRow({ children: [
        cell("Mistral-7B"),
        cell("7B"),
        cell("⭐⭐⭐"),
        cell("⭐⭐⭐⭐"),
        cell("Moyen"),
        cell("Gratuit HF"),
        cell("Non retenu"),
      ]}),
      new TableRow({ children: [
        cell("LLaMA-3-8B"),
        cell("8B"),
        cell("⭐⭐⭐"),
        cell("⭐⭐⭐"),
        cell("Moyen"),
        cell("Gratuit HF"),
        cell("Non retenu"),
      ]}),
      new TableRow({ children: [
        cell("GPT-4o"),
        cell("~200B"),
        cell("⭐⭐⭐⭐⭐"),
        cell("⭐⭐⭐⭐⭐"),
        cell("Rapide"),
        cell("Payant $$"),
        cell("Non retenu"),
      ]}),
      new TableRow({ children: [
        cell("Claude 3.5 Sonnet"),
        cell("~70B"),
        cell("⭐⭐⭐⭐⭐"),
        cell("⭐⭐⭐⭐⭐"),
        cell("Rapide"),
        cell("Payant $$"),
        cell("Non retenu"),
      ]}),
    ]
  });
}

function buildOCRCompareTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1900, 1200, 1400, 1200, 1300, 2360],
    rows: [
      new TableRow({ children: [
        headerCell("Solution OCR"),
        headerCell("Précision FR"),
        headerCell("Langues"),
        headerCell("Coût"),
        headerCell("Vitesse"),
        headerCell("Décision Projet"),
      ]}),
      new TableRow({ children: [
        cell("Tesseract 5 ✅", LIGHT_GREEN, true),
        cell("Bonne"),
        cell("fra+eng+ara"),
        cell("Open-source"),
        cell("Rapide"),
        cell("Retenu — libre, multi-config PSM", LIGHT_GREEN),
      ]}),
      new TableRow({ children: [
        cell("EasyOCR"),
        cell("Très bonne"),
        cell("80+ langues"),
        cell("Open-source"),
        cell("Lent (GPU)"),
        cell("Non retenu — trop lent sans GPU"),
      ]}),
      new TableRow({ children: [
        cell("Google Vision API"),
        cell("Excellente"),
        cell("Toutes"),
        cell("Payant"),
        cell("Très rapide"),
        cell("Non retenu — coût & dépendance cloud"),
      ]}),
      new TableRow({ children: [
        cell("Azure OCR"),
        cell("Excellente"),
        cell("Toutes"),
        cell("Payant"),
        cell("Très rapide"),
        cell("Non retenu — coût & dépendance cloud"),
      ]}),
      new TableRow({ children: [
        cell("PaddleOCR"),
        cell("Très bonne"),
        cell("Multi"),
        cell("Open-source"),
        cell("Moyen"),
        cell("Non retenu — setup complexe"),
      ]}),
    ]
  });
}

function buildEndpointsTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [800, 3200, 1600, 3760],
    rows: [
      new TableRow({ children: [
        headerCell("Méthode"),
        headerCell("Endpoint"),
        headerCell("Version"),
        headerCell("Description"),
      ]}),
      new TableRow({ children: [
        cell("GET", LIGHT_GREEN, true, "276221"),
        cell("/health"),
        cell("v1"),
        cell("Statut API + modèle chargé"),
      ]}),
      new TableRow({ children: [
        cell("POST", LIGHT_BLUE, true, "1F4E79"),
        cell("/api/v1/extract-cv"),
        cell("v1"),
        cell("Extraction CV depuis texte brut (SpaCy)"),
      ]}),
      new TableRow({ children: [
        cell("POST", LIGHT_BLUE, true, "1F4E79"),
        cell("/api/v1/extract-cv-file"),
        cell("v1"),
        cell("Extraction CV depuis PDF/DOCX/Image (SpaCy)"),
      ]}),
      new TableRow({ children: [
        cell("POST", MID_BLUE, true, "1F3864"),
        cell("/api/v2/extract-cv-llm"),
        cell("v2"),
        cell("Extraction CV texte via LLM (Qwen3-8B)"),
      ]}),
      new TableRow({ children: [
        cell("POST", MID_BLUE, true, "1F3864"),
        cell("/api/v2/extract-cv-file-llm"),
        cell("v2"),
        cell("Extraction CV fichier via LLM"),
      ]}),
      new TableRow({ children: [
        cell("POST", MID_BLUE, true, "1F3864"),
        cell("/api/v2/evaluate-cv"),
        cell("v2"),
        cell("Évaluation CV vs offre — score 100 pts"),
      ]}),
      new TableRow({ children: [
        cell("POST", MID_BLUE, true, "1F3864"),
        cell("/api/v2/evaluate-cv-file"),
        cell("v2"),
        cell("Évaluation CV fichier + offre JSON (multipart)"),
      ]}),
      new TableRow({ children: [
        cell("POST", LIGHT_YELLOW, true, "7D6608"),
        cell("/api/v3/extract-cv-hybrid"),
        cell("v3"),
        cell("Extraction hybride SpaCy → LLM (texte)"),
      ]}),
      new TableRow({ children: [
        cell("POST", LIGHT_YELLOW, true, "7D6608"),
        cell("/api/v3/extract-cv-file-hybrid"),
        cell("v3"),
        cell("Extraction hybride SpaCy → LLM (fichier)"),
      ]}),
    ]
  });
}

function buildScoreTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 800, 3360, 2800],
    rows: [
      new TableRow({ children: [
        headerCell("Critère"),
        headerCell("Points"),
        headerCell("Barème"),
        headerCell("Source"),
      ]}),
      new TableRow({ children: [
        cell("Niveau d'éducation", LIGHT_BLUE, true),
        cell("20", false, false, "000000", AlignmentType.CENTER),
        cell("Exact: 20 | -1 niveau: 10 | -2+: 0"),
        cell("formation.niveau_diplome"),
      ]}),
      new TableRow({ children: [
        cell("Compétences requises", LIGHT_BLUE, true),
        cell("30", false, false, "000000", AlignmentType.CENTER),
        cell("(compétences trouvées / total requises) × 30"),
        cell("competences.*"),
      ]}),
      new TableRow({ children: [
        cell("Années d'expérience", LIGHT_BLUE, true),
        cell("20", false, false, "000000", AlignmentType.CENTER),
        cell("≥ min: 20 | -1 an: 12 | -2 ans: 6 | +2 ans: 0"),
        cell("experience.nb_annees_experience"),
      ]}),
      new TableRow({ children: [
        cell("Expérience académique", LIGHT_BLUE, true),
        cell("10", false, false, "000000", AlignmentType.CENTER),
        cell("Trouvée: 10 | Absente si requise: 0"),
        cell("experience.experience_academique"),
      ]}),
      new TableRow({ children: [
        cell("Alignement modules", LIGHT_BLUE, true),
        cell("15", false, false, "000000", AlignmentType.CENTER),
        cell("3+ modules: 15 | 1-2 modules: 8 | 0: 0"),
        cell("experience.modules_enseignes"),
      ]}),
      new TableRow({ children: [
        cell("Adéquation spécialité", LIGHT_BLUE, true),
        cell("5", false, false, "000000", AlignmentType.CENTER),
        cell("Exacte: 5 | Connexe: 3 | Non liée: 0"),
        cell("formation.specialite"),
      ]}),
      new TableRow({
        tableHeader: true,
        children: [
          cell("TOTAL", PRIMARY, true, WHITE),
          cell("100", PRIMARY, true, WHITE, AlignmentType.CENTER),
          cell("Grade: Excellent ≥ 90 | Très Bon ≥ 75 | Acceptable ≥ 60", PRIMARY, false, WHITE),
          cell("Agrégation automatique LLM", PRIMARY, false, WHITE),
        ]
      }),
    ]
  });
}

function buildStrengthsWeaknessesTable() {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      new TableRow({ children: [
        headerCell("✅  Points Forts", "276221"),
        headerCell("⚠️  Points à Améliorer", "C00000"),
      ]}),
      new TableRow({ children: [
        new TableCell({
          borders, shading: { fill: LIGHT_GREEN, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          width: { size: 4680, type: WidthType.DXA },
          children: [
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Architecture multi-versionnée (v1/v2/v3) progressive", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Pipeline hybride SpaCy + LLM unique en son genre", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "OCR multi-config avec preprocessing OpenCV avancé", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Fine-tuning NER spécialisé contexte tunisien", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "200+ patterns EntityRuler (compétences + universités)", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Grille de scoring transparente sur 100 points", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Validation Pydantic stricte sur tous les schémas", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "LLM open-source gratuit (Qwen3-8B)", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Réparation automatique JSON via json_repair", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Support multiformat : PDF, DOCX, PNG, JPG, TXT", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets2", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Spécialisation recrutement académique (enseignants)", size: 20, font: "Arial" })] }),
          ]
        }),
        new TableCell({
          borders, shading: { fill: LIGHT_RED, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          width: { size: 4680, type: WidthType.DXA },
          children: [
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Pas d'authentification/sécurité sur les endpoints", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Latence LLM élevée sur HuggingFace (cold start)", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "CV en arabe peu couverts par le NER spaCy", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Pas de cache ni de file d'attente (queue) pour les LLMs", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Score_competences basé sur un comptage simple (non pondéré)", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Pas de tests unitaires/intégration automatisés", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Nombre d'années d'expérience estimé par heuristique fragile", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Pas de logging/monitoring centralisé (ELK, Prometheus…)", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Dépendance à une seule clé HuggingFace (SPOF)", size: 20, font: "Arial" })] }),
            new Paragraph({ numbering: { reference: "bullets3", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: "Pas de gestion de versioning du modèle NER entraîné", size: 20, font: "Arial" })] }),
          ]
        }),
      ]}),
    ]
  });
}

// ─── Document ──────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "✓", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 280 } } } }] },
      { reference: "bullets3", levels: [{ level: 0, format: LevelFormat.BULLET, text: "➜", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 280 } } } }] },
      { reference: "subbullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: PRIMARY },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "444444" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Rapport Technique — Système d'Extraction & Évaluation de CV", size: 18, color: "666666", font: "Arial" })
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
            spacing: { before: 80 },
            children: [
              new TextRun({ text: "Page ", size: 18, color: "888888", font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888", font: "Arial" }),
              new TextRun({ text: " | Projet NLP/IA — Extraction CV Académique", size: 18, color: "888888", font: "Arial" }),
            ]
          })
        ]
      })
    },
    children: [

      // ── Cover Block ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 80 },
        children: [new TextRun({ text: "RAPPORT TECHNIQUE", bold: true, size: 48, color: PRIMARY, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "Système d'Extraction & Évaluation de CV", bold: true, size: 36, color: ACCENT, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: "Basé sur NLP (spaCy) + OCR (Tesseract) + LLM (Qwen3-8B)", size: 24, color: "555555", font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 600 },
        children: [new TextRun({ text: "Contexte : Recrutement d'Enseignants Universitaires — Tunisie", italic: true, size: 22, color: "777777", font: "Arial" })]
      }),

      // ── 1. Introduction ──
      heading1("1. Introduction & Contexte"),
      para("Ce projet développe une API intelligente de traitement automatique de Curriculum Vitæ, spécialement conçue pour le recrutement d'enseignants et chercheurs universitaires en Tunisie. Il combine plusieurs briques d'intelligence artificielle pour offrir une solution complète : extraction de texte, reconnaissance d'entités nommées, et évaluation automatique des candidatures."),
      spacer(),
      para("L'objectif principal est de fournir aux établissements d'enseignement supérieur un outil capable de :"),
      bullet("Extraire automatiquement les informations pertinentes depuis tout type de fichier CV (PDF, DOCX, image scanné)"),
      bullet("Structurer ces informations en JSON normalisé pour exploitation par des systèmes tiers"),
      bullet("Évaluer objectivement l'adéquation d'un candidat à une offre d'emploi académique avec un score sur 100"),
      spacer(),

      // ── 2. Architecture ──
      heading1("2. Architecture Technique Globale"),
      para("Le système est organisé en couches fonctionnelles distinctes, chacune apportant une valeur ajoutée spécifique :"),
      spacer(),
      buildArchTable(),
      spacer(),

      // ── 3. Modules ──
      heading1("3. Description Détaillée des Modules"),

      heading2("3.1  Module d'Extraction de Texte (utils.py)"),
      para("La fonction extract_text_from_file prend en charge tous les formats courants :"),
      bullet("PDF natif : lecture via PyMuPDF (fitz) avec fallback OCR automatique si le contenu textuel d'une page est inférieur à 50 caractères — détection intelligente des PDF scannés"),
      bullet("DOCX/DOC : lecture paragraphe par paragraphe via python-docx"),
      bullet("Images (PNG, JPG, WEBP, TIFF) : pipeline OCR complet avec preprocessing, multi-config, et fallback sans binarisation"),
      bullet("TXT : lecture directe UTF-8"),
      spacer(),

      heading2("3.2  Module OCR (utils_image.py)"),
      para("Le pipeline OCR est structuré en 5 étapes séquentielles :"),
      bullet("Upscale : redimensionnement si la résolution est inférieure à 2000px (facteur auto)"),
      bullet("Amélioration contraste : algorithme CLAHE (Contrast Limited Adaptive Histogram Equalization)"),
      bullet("Débruitage : filtre fastNlMeansDenoising d'OpenCV"),
      bullet("Binarisation adaptative : seuillage gaussien adaptatif pour gérer les fonds colorés"),
      bullet("Deskew : correction d'inclinaison par analyse de la boîte englobante des pixels sombres"),
      para("Trois configurations Tesseract sont testées en parallèle (PSM 3, 4, 6) et le résultat le plus riche est sélectionné automatiquement."),
      spacer(),

      heading2("3.3  Module NER SpaCy (train_model.py)"),
      para("Le modèle NER est construit sur fr_core_news_lg avec deux enrichissements :"),
      bullet("EntityRuler : 200+ patterns pour les compétences techniques (SKILL_TECH), les diplômes (DIPLOMA) et les universités tunisiennes (ORG)"),
      bullet("Fine-tuning supervisé : 60+ exemples annotés couvrant les organisations académiques, les noms tunisiens, les grades et les modules enseignés — entraînement sur 40 époques avec drop progressif 0.5→0.2"),
      para("Les labels personnalisés ajoutés : SKILL_TECH, DIPLOMA, LANG."),
      spacer(),

      heading2("3.4  Module Extraction LLM (utils.py — extract_information_llm)"),
      para("L'extraction LLM utilise LangChain avec ChatPromptTemplate structuré en deux messages :"),
      bullet("System prompt : définit le rôle, les contraintes strictes (NO commentaire, NO boucle), et un exemple complet de JSON attendu"),
      bullet("User prompt : le texte brut du CV suivi d'instructions de formatage Pydantic"),
      para("La sortie brute est nettoyée par clean_llm_json (suppression markdown, commentaires //) puis réparée par json_repair avant validation Pydantic."),
      spacer(),

      heading2("3.5  Module Hybride V3 (extract_information_hybrid)"),
      para("L'extraction hybride combine les deux approches en séquence :"),
      bullet("Phase 1 — SpaCy : extraction silencieuse des emails, téléphones, compétences SKILL_TECH et diplômes DIPLOMA"),
      bullet("Phase 2 — Enrichissement : construction d'un préfixe contextuel listant les informations pré-détectées"),
      bullet("Phase 3 — LLM : traitement du texte enrichi par le LLM pour une structuration JSON complète"),
      para("Cette approche réduit la charge cognitive du LLM et améliore la précision des compétences extraites."),
      spacer(),

      heading2("3.6  Module d'Évaluation (evaluate_cv_against_offer)"),
      para("Ce module évalue la compatibilité d'un CV avec une offre d'emploi académique selon une grille structurée :"),
      spacer(),
      buildScoreTable(),
      spacer(),
      para("Le LLM reçoit l'offre en JSON et les données CV (texte brut + JSON extrait) pour produire un EvaluationResult complet incluant forces, faiblesses et recommandation."),
      spacer(),

      // ── 4. API ──
      heading1("4. API REST — Endpoints Disponibles"),
      para("L'API FastAPI expose 10 endpoints organisés en trois versions :"),
      spacer(),
      buildEndpointsTable(),
      spacer(),
      para("CORS configuré pour http://localhost:4200 et http://127.0.0.1:4200 (Angular). Taille maximale des fichiers : 5 Mo."),
      spacer(),

      // ── 5. Comparatif LLM ──
      heading1("5. Tableau Comparatif — Choix du LLM"),
      para("Le choix du LLM a été guidé par quatre critères principaux : capacité à générer un JSON strict, qualité du français, coût d'utilisation et vitesse de réponse."),
      spacer(),
      buildLLMCompareTable(),
      spacer(),
      para("Qwen3-8B a été retenu car il représente le meilleur compromis qualité/coût pour ce cas d'usage : génération JSON stricte, bonne compréhension du français académique, accessible gratuitement via l'API HuggingFace Inference, et compatible avec LangChain. Qwen2.5-7B reste une alternative de référence (mentionnée en commentaire dans le code)."),
      spacer(),

      // ── 6. Comparatif OCR ──
      heading1("6. Tableau Comparatif — Choix de la Solution OCR"),
      para("L'OCR doit fonctionner sur des CVs francophones et arabes, parfois scannés, sans dépendance à des services cloud payants."),
      spacer(),
      buildOCRCompareTable(),
      spacer(),
      para("Tesseract 5 avec preprocessing OpenCV a été retenu pour sa gratuité, sa flexibilité (configurations PSM multiples), son support natif du français et de l'arabe, et son intégration simple dans un environnement Python/Docker."),
      spacer(),

      // ── 7. Points forts / à améliorer ──
      heading1("7. Analyse : Points Forts & Points à Améliorer"),
      spacer(),
      buildStrengthsWeaknessesTable(),
      spacer(),

      // ── 8. Recommandations ──
      heading1("8. Recommandations d'Amélioration Prioritaires"),

      heading2("8.1  Court terme (0–3 mois)"),
      bullet("Sécurité : ajouter une authentification JWT ou API Key sur tous les endpoints"),
      bullet("Cache LLM : mettre en place un cache Redis sur les extractions identiques pour réduire la latence"),
      bullet("Tests : implémenter une suite pytest avec des CVs de référence annotés (golden dataset)"),
      bullet("Logging : intégrer un système de logs structurés (JSON logs + Prometheus metrics)"),
      spacer(),

      heading2("8.2  Moyen terme (3–6 mois)"),
      bullet("Support arabe : intégrer un modèle spaCy ou CamelBERT pour le NER en arabe"),
      bullet("File d'attente : implémenter Celery + Redis pour gérer les requêtes LLM en asynchrone"),
      bullet("Scoring amélioré : pondérer les compétences par niveau (débutant/intermédiaire/expert) plutôt que par comptage"),
      bullet("Versioning modèles : versionner les modèles NER entraînés avec MLflow ou DVC"),
      spacer(),

      heading2("8.3  Long terme (6–12 mois)"),
      bullet("LLM local : déployer Qwen3-8B en self-hosted (Ollama, vLLM) pour éliminer la dépendance HuggingFace"),
      bullet("Interface admin : tableau de bord pour visualiser les scores et comparer les candidats"),
      bullet("Apprentissage continu : pipeline de ré-entraînement du modèle NER sur de nouvelles données corrigées"),
      bullet("Conformité RGPD : anonymisation des données personnelles (PII) avant traitement LLM"),
      spacer(),

      // ── 9. Modèles de données ──
      heading1("9. Modèles de Données Pydantic"),

      heading2("9.1  CVExtraction — Schéma de sortie principal"),
      bullet("identification : nom, email, téléphone"),
      bullet("formation : niveau_diplome, specialite, universite, annee_diplome, grade_academique"),
      bullet("experience : nb_annees_experience (int), experience_academique (bool), institutions (list), modules_enseignes (list)"),
      bullet("competences : langages, frameworks, data, ia, erp (toutes des listes)"),
      bullet("publications, certifications : listes de chaînes"),
      bullet("langues : liste de Langue(langue, niveau)"),
      bullet("indicateurs_ia : score_competences, score_experience, score_global (sur 100)"),
      spacer(),

      heading2("9.2  EvaluationResult — Schéma de l'évaluation"),
      bullet("candidateName, offerTitle : identification de la paire"),
      bullet("globalScore (int), grade (str) : résultat synthétique"),
      bullet("breakdown : objet détaillé avec 6 critères (ScoreComment, SkillsMatch, ModulesAlignment)"),
      bullet("strengths, weaknesses : listes des points forts et faibles identifiés"),
      bullet("recommendation : texte de recommandation généré par le LLM"),
      spacer(),

      // ── 10. Conclusion ──
      heading1("10. Conclusion"),
      para("Ce projet constitue une solution NLP/IA complète et innovante pour le recrutement académique universitaire en Tunisie. Son architecture tri-couche (SpaCy heuristique → LLM → Hybride) permet à chaque établissement de choisir le compromis vitesse/précision adapté à ses besoins."),
      spacer(),
      para("La spécialisation sur le contexte tunisien (universités, terminologie académique, langues fr+ar) représente une valeur ajoutée concrète par rapport aux solutions génériques. L'utilisation exclusive de composants open-source (spaCy, Tesseract, Qwen3-8B, FastAPI) garantit une maîtrise totale des coûts et de la confidentialité des données."),
      spacer(),
      para("Les axes d'amélioration prioritaires — sécurité, support arabe, cache LLM et tests automatisés — permettront de faire évoluer ce prototype vers un système de production robuste et scalable."),
      spacer(),

      // ── Fin ──
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 8 } },
        children: [new TextRun({ text: "— Fin du rapport —", italic: true, color: "888888", size: 20, font: "Arial" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/user-data/outputs/rapport_projet_cv_ia.docx", buffer);
  console.log("✅ Rapport généré : rapport_projet_cv_ia.docx");
}).catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});