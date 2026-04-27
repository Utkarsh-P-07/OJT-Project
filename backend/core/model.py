import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from core.utils import clean_text

DATA_DIR = "data"
MODEL_DIR = "model"
CORPUS_FILE = os.path.join(DATA_DIR, "alt.atheism.txt")
VECTORIZER_FILE = os.path.join(MODEL_DIR, "vectorizer.pkl")
MATRIX_FILE = os.path.join(MODEL_DIR, "reference_matrix.npy")


def initialize_model():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)

    if not os.path.exists(CORPUS_FILE):
        dummy_data = [
            "The stock market saw a massive rally today as technology shares surged.",
            "A new scientific discovery in quantum mechanics was published.",
            "Local sports team wins the championship finals in a stunning victory.",
            "Global warming and climate change policies are being debated at the summit.",
            "Healthcare advancements lead to new treatments for chronic diseases."
        ]
        with open(CORPUS_FILE, "w", encoding="utf-8") as f:
            f.write("\n".join(dummy_data))

    if not os.path.exists(VECTORIZER_FILE) or not os.path.exists(MATRIX_FILE):
        with open(CORPUS_FILE, "r", encoding="utf-8") as f:
            corpus = [line.strip() for line in f if line.strip()]

        cleaned = [clean_text(doc) for doc in corpus]
        vectorizer = TfidfVectorizer(max_features=10000)
        matrix = vectorizer.fit_transform(cleaned)

        with open(VECTORIZER_FILE, "wb") as f:
            pickle.dump(vectorizer, f)
        np.save(MATRIX_FILE, matrix.toarray())


def detect_drift(user_documents: list[str]) -> tuple[float, str]:
    with open(VECTORIZER_FILE, "rb") as f:
        vectorizer = pickle.load(f)
    reference_matrix = np.load(MATRIX_FILE)

    cleaned = [clean_text(doc) for doc in user_documents]
    cleaned = [doc for doc in cleaned if doc]

    if not cleaned:
        raise ValueError(
            "Text was entirely removed during cleaning (only stopwords/punctuation). "
            "Please upload a file with more meaningful content."
        )

    user_matrix = vectorizer.transform(cleaned)
    similarities = cosine_similarity(user_matrix, reference_matrix)
    avg_similarity = float(similarities.max(axis=1).mean())

    if avg_similarity >= 0.5:
        status = "no_drift"
    elif avg_similarity >= 0.15:
        status = "slight_drift"
    else:
        status = "drift"

    return avg_similarity, status
