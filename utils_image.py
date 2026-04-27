import cv2
import numpy as np
from PIL import Image
from typing import Optional
import os
import pytesseract

# Chemin Tesseract : Windows seulement (sous Linux/Docker, Tesseract est dans le PATH)
if os.name == 'nt':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """Prétraitement complet d'une image CV pour améliorer l'OCR."""
    img = np.array(image.convert("RGB"))

    # 1. Upscale si résolution trop faible (min 300 DPI estimé)
    h, w = img.shape[:2]
    if max(h, w) < 2000:
        scale = 2000 / max(h, w)
        img = cv2.resize(img, None, fx=scale, fy=scale,
                         interpolation=cv2.INTER_CUBIC)

    # 2. Conversion en niveaux de gris
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    # 3. Amélioration du contraste (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # 4. Débruitage
    gray = cv2.fastNlMeansDenoising(gray, h=10)

    # 5. Binarisation adaptative (robuste aux fonds colorés)
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )

    # 6. Correction inclinaison (deskew)
    binary = deskew_image(binary)

    return Image.fromarray(binary)


def deskew_image(binary: np.ndarray) -> np.ndarray:
    """Corrige l'inclinaison d'une image binarisée."""
    coords = np.column_stack(np.where(binary < 128))
    if len(coords) < 100:
        return binary
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = 90 + angle
    if abs(angle) > 0.5:
        (h, w) = binary.shape
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        binary = cv2.warpAffine(binary, M, (w, h),
                                flags=cv2.INTER_CUBIC,
                                borderMode=cv2.BORDER_REPLICATE)
    return binary


def ocr_with_best_config(image: Image.Image) -> str:
    """Lance Tesseract avec plusieurs configs et retourne le meilleur résultat."""
    configs = [
        "--oem 3 --psm 6 -l fra+eng",  # bloc texte uniforme (CVs)
        "--oem 3 --psm 3 -l fra+eng",  # segmentation automatique
        "--oem 3 --psm 4 -l fra+eng",  # colonne simple
    ]
    results = []
    for cfg in configs:
        txt = pytesseract.image_to_string(image, config=cfg)
        results.append((len(txt.strip()), txt))

    # Retourne le résultat le plus long (le plus riche)
    return max(results, key=lambda x: x[0])[1]


def clean_ocr_text(text: str) -> str:
    """Nettoie le texte OCR : artefacts, lignes parasites, doublons."""
    import re
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        line = line.strip()
        # Ignore lignes trop courtes ou parasites (------, ======)
        if len(line) < 2 or re.fullmatch(r'[-=_|.]{3,}', line):
            continue
        # Corrige espaces multiples
        line = re.sub(r' {2,}', ' ', line)
        cleaned.append(line)
    return '\n'.join(cleaned)