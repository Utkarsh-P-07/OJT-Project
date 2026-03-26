from sklearn.metrics.pairwise import cosine_similarity

DEFAULT_THRESHOLD = 0.3

def compute_similarity(vec1, vec2) -> float:
    """Cosine similarity between two sparse TF-IDF vectors."""
    sim = cosine_similarity(vec1, vec2)
    return float(sim[0][0])

def detect_drift(
    similarities: list[float],
    threshold: float = DEFAULT_THRESHOLD,
    from_dates: list[str] = None,
    to_dates: list[str] = None,
    from_terms: list[list[str]] = None,
    to_terms: list[list[str]] = None,
) -> list[dict]:
    """
    Build the result list from similarity scores.
    Optionally attach date labels and top terms for each transition.
    """
    results = []
    for i, score in enumerate(similarities):
        entry = {
            "period": f"T{i} -> T{i+1}",
            "similarity": round(score, 4),
            "drift_detected": score < threshold,
        }

        # attach dates if provided
        if from_dates and to_dates:
            entry["from_date"] = from_dates[i]
            entry["to_date"] = to_dates[i + 1] if i + 1 < len(to_dates) else ""

        # attach top terms so the frontend can show what changed
        if from_terms and to_terms:
            entry["from_terms"] = from_terms[i]
            entry["to_terms"] = to_terms[i + 1] if i + 1 < len(to_terms) else []

        results.append(entry)

    return results
