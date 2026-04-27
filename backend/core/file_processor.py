import io
import numpy as np
import PyPDF2
from PIL import Image

_ocr_reader = None

def _get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        _ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _ocr_reader

def extract_text_from_txt(contents: bytes) -> list[str]:
    decoded = contents.decode('utf-8', errors='ignore')
    return [line.strip() for line in decoded.splitlines() if line.strip()]

def extract_text_from_pdf(contents: bytes) -> list[str]:
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
    lines = []
    for page in pdf_reader.pages:
        text = page.extract_text()
        if text:
            lines.extend([l.strip() for l in text.splitlines() if l.strip()])
    return lines

def extract_text_from_image(contents: bytes) -> list[str]:
    try:
        reader = _get_ocr_reader()
        image_np = np.array(Image.open(io.BytesIO(contents)))
        results = reader.readtext(image_np, detail=0, paragraph=True)
        return [line.strip() for line in results if line.strip()]
    except Exception as e:
        raise ValueError(f"Failed to process image: {str(e)}")

def process_uploaded_file(contents: bytes, filename: str) -> list[str]:
    name = filename.lower()
    if name.endswith(".txt"):
        return extract_text_from_txt(contents)
    elif name.endswith(".pdf"):
        return extract_text_from_pdf(contents)
    elif name.endswith((".png", ".jpg", ".jpeg")):
        return extract_text_from_image(contents)
    raise ValueError("Unsupported file format. Please upload .txt, .pdf, .png, or .jpg")
