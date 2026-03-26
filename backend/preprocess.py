import re
import string

# words that add no meaning to topic analysis
EXTRA_STOPWORDS = {"said", "says", "also", "would", "could", "one", "two", "new", "year"}

def clean_text(text: str) -> str:
    """
    Basic text cleaning before vectorization.
    Lowercase, strip URLs, punctuation, numbers, and extra whitespace.
    Nothing fancy — just consistent input for TF-IDF.
    """
    if not text or not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)           # remove URLs
    text = re.sub(r"\d+", "", text)                       # remove numbers (dates, stats)
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text).strip()

    # filter out extra stopwords that scikit-learn misses
    words = [w for w in text.split() if w not in EXTRA_STOPWORDS and len(w) > 2]
    return " ".join(words)
