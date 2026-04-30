import io

def extract_text_from_txt(contents: bytes) -> list[str]:
    decoded = contents.decode('utf-8', errors='ignore')
    return [line.strip() for line in decoded.splitlines() if line.strip()]

def process_uploaded_file(contents: bytes, filename: str) -> list[str]:
    name = filename.lower()
    if name.endswith(".txt"):
        return extract_text_from_txt(contents)
    raise ValueError("Unsupported file format. Please upload a .txt file or use the text input.")
