import io
from PIL import Image
import pytesseract
import PyPDF2

def extract_text_from_txt(contents: bytes) -> list[str]:
    """Decodes bytes and returns a list of non-empty lines."""
    decoded = contents.decode('utf-8', errors='ignore')
    return [line.strip() for line in decoded.splitlines() if line.strip()]

def extract_text_from_pdf(contents: bytes) -> list[str]:
    """Extracts text from all pages of a PDF and returns each page's text as a list item."""
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
    text_chunks = []
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text = page.extract_text()
        if text:
            # We split by newlines within the page, or just return the page as a single doc.
            # Using newlines so each sentence/paragraph can act as a document
            lines = text.splitlines()
            text_chunks.extend([line.strip() for line in lines if line.strip()])
    return text_chunks

def extract_text_from_image(contents: bytes) -> list[str]:
    """Uses Tesseract OCR to extract text from image bytes."""
    try:
        image = Image.open(io.BytesIO(contents))
        # Perform OCR
        text = pytesseract.image_to_string(image)
        # Split into lines
        return [line.strip() for line in text.splitlines() if line.strip()]
    except pytesseract.pytesseract.TesseractNotFoundError:
        raise Exception("Tesseract OCR is not installed or not in PATH. Cannot process image.")
    except Exception as e:
        raise Exception(f"Failed to process image: {str(e)}")

def process_uploaded_file(contents: bytes, filename: str) -> list[str]:
    """Routes the file to the correct parser based on extension."""
    filename_lower = filename.lower()
    
    if filename_lower.endswith(".txt"):
        return extract_text_from_txt(contents)
    elif filename_lower.endswith(".pdf"):
        return extract_text_from_pdf(contents)
    elif filename_lower.endswith(".png") or filename_lower.endswith(".jpg") or filename_lower.endswith(".jpeg"):
        return extract_text_from_image(contents)
    else:
        raise ValueError("Unsupported file format. Please upload .txt, .pdf, .png, or .jpg")
