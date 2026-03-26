from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

# keeping max_features reasonable — 5000 is plenty for news articles
_vectorizer = TfidfVectorizer(
    max_features=5000,
    stop_words="english",
    ngram_range=(1, 2),   # unigrams + bigrams catch phrases like "climate change"
    min_df=1,
    sublinear_tf=True,    # log normalization helps with long documents
)

def fit_transform(texts: list[str]):
    """Fit on all periods and transform. Call this once per analysis run."""
    return _vectorizer.fit_transform(texts)

def get_top_terms(tfidf_matrix, period_index: int, n: int = 8) -> list[str]:
    """
    Return the top N terms for a given period by TF-IDF score.
    Useful for showing what each period was actually about.
    """
    feature_names = _vectorizer.get_feature_names_out()
    row = tfidf_matrix[period_index].toarray().flatten()
    top_indices = np.argsort(row)[::-1][:n]
    return [feature_names[i] for i in top_indices if row[i] > 0]
