import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from utils import clean_text

DATA_DIR = "data"
MODEL_DIR = "model"
CORPUS_FILE = os.path.join(DATA_DIR, "alt.atheism.txt")
VECTORIZER_FILE = os.path.join(MODEL_DIR, "vectorizer.pkl")
MATRIX_FILE = os.path.join(MODEL_DIR, "reference_matrix.npy")

def initialize_model():
    """
    Ensures that the model directories, reference corpus, and pre-trained models exist.
    If not, it generates dummy data and trains a base model so the API can run.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # 1. Create dummy corpus if it doesn't exist
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
            
    # 2. Check if vectorizer and matrix exist
    if not os.path.exists(VECTORIZER_FILE) or not os.path.exists(MATRIX_FILE):
        print("Training base reference model from corpus...")
        with open(CORPUS_FILE, "r", encoding="utf-8") as f:
            corpus = [line.strip() for line in f.readlines() if line.strip()]
            
        cleaned_corpus = [clean_text(doc) for doc in corpus]
        
        vectorizer = TfidfVectorizer(max_features=10000)
        reference_matrix = vectorizer.fit_transform(cleaned_corpus)
        
        # Save them
        with open(VECTORIZER_FILE, "wb") as f:
            pickle.dump(vectorizer, f)
            
        np.save(MATRIX_FILE, reference_matrix.toarray())
        print("Model generated and saved successfully.")

def load_pretrained_model():
    """Loads the pre-trained vectorizer and reference document matrix."""
    with open(VECTORIZER_FILE, "rb") as f:
        vectorizer = pickle.load(f)
    reference_matrix = np.load(MATRIX_FILE)
    return vectorizer, reference_matrix

def detect_drift(user_documents: list[str]) -> tuple[float, bool]:
    """
    Takes user content and checks for drift against the pre-trained reference.
    Threshold for drift detection: avg maximum similarity < 0.15
    """
    if not user_documents:
        return 0.0, True
        
    vectorizer, reference_matrix = load_pretrained_model()
    
    # Clean the input texts
    cleaned_user_docs = [clean_text(doc) for doc in user_documents]
    cleaned_user_docs = [doc for doc in cleaned_user_docs if doc]
    
    if not cleaned_user_docs:
        return 0.0, True
        
    # Transform using the loaded PRE-TRAINED vectorizer
    user_matrix = vectorizer.transform(cleaned_user_docs)
    
    # Compute similarities between user docs and the reference matrix
    # reference_matrix shape: (num_reference_docs, num_features)
    # user_matrix shape: (num_user_docs, num_features)
    similarities = cosine_similarity(user_matrix, reference_matrix)
    
    # For each user doc, find its maximum similarity to ANY reference doc
    max_similarities = similarities.max(axis=1)
    
    # Compute the average
    avg_similarity = float(max_similarities.mean())
    
    # Drift is detected if the text diverges significantly from reference (similarity < 0.15)
    drift_detected = avg_similarity < 0.15
    
    return avg_similarity, drift_detected
