import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "model")

CORPUS_FILE = os.path.join(DATA_DIR, "alt.atheism.txt")
VECTORIZER_FILE = os.path.join(MODEL_DIR, "vectorizer.pkl")
MATRIX_FILE = os.path.join(MODEL_DIR, "reference_matrix.npy")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

if not os.path.exists(CORPUS_FILE):
    sample_data = [
        "The stock market experienced a historic high as technology companies posted record profits.",
        "A major breakthrough in quantum computing has been announced by researchers.",
        "Local sports team clinched the national championship after a stunning comeback.",
        "Global leaders met today to discuss new climate change and carbon emission policies.",
        "Medical scientists have developed a promising new treatment for autoimmune diseases.",
        "A sudden earthquake struck the coastal region, causing minimal damage but widespread panic.",
        "Space agencies are collaborating on a new mission to send astronauts to Mars by 2035.",
        "The latest smartphone features advanced AI capabilities that surpass previous models.",
        "Renewable energy adoption has surged, leading to lower electricity prices worldwide.",
        "A well-known artist unveiled a controversial new exhibit that challenges modern societal norms."
    ]
    with open(CORPUS_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(sample_data))

with open(CORPUS_FILE, "r", encoding="utf-8") as f:
    corpus = [line.strip() for line in f.readlines() if line.strip()]

print("Dataset loaded")

vectorizer = TfidfVectorizer(max_features=10000)
reference_matrix = vectorizer.fit_transform(corpus)

print("Model trained")

with open(VECTORIZER_FILE, "wb") as f:
    pickle.dump(vectorizer, f)

np.save(MATRIX_FILE, reference_matrix.toarray())

print("Files saved successfully")
