from sklearn.feature_extraction.text import TfidfVectorizer

_vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")

def fit_transform(texts: list[str]):
    return _vectorizer.fit_transform(texts)

def transform(texts: list[str]):
    return _vectorizer.transform(texts)
