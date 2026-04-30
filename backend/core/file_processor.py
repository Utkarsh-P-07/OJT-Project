import io
import PyPDF2

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

def process_uploaded_file(contents: bytes, filename: str) -> list[str]:
    name = filename.lower()
    if name.endswith(".txt"):
        return extract_text_from_txt(contents)
    elif name.endswith(".pdf"):
        return extract_text_from_pdf(contents)
    elif name.endswith((".png", ".jpg", ".jpeg")):
        raise ValueError("Image upload is not supported on the free tier. Please upload a .txt or .pdf file.")
    raise ValueError("Unsupported file format. Please upload .txt or .pdf")
