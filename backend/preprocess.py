import re
import string

def clean_text(text: str) -> str:
    """Lowercase, remove punctuation and extra whitespace."""
    if not text or not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)          # remove URLs
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text).strip()
    return text
