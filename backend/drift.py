from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

DRIFT_THRESHOLD = 0.3  # similarity below this = topic drift

def compute_similarity(vec1, vec2) -> float:
    """Cosine similarity between two TF-IDF vectors."""
    sim = cosine_similarity(vec1, vec2)
    return float(sim[0][0])

def detect_drift(similarities: list[float], threshold: float = DRIFT_THRESHOLD) -> list[dict]:
    """
    Given a list of consecutive similarity scores,
    flag pairs where similarity drops below threshold.
    """
    results = []
    for i, score in enumerate(similarities):
        results.append({
            "period": f"T{i} -> T{i+1}",
            "similarity": round(score, 4),
            "drift_detected": score < threshold
        })
    return results
