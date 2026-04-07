from numpy.testing import clear_and_catch_warnings
import numpy as np

def calculate_topic_drift(reference_topics: list[str], current_topics: list[str]) -> dict:
    """
    Computes Population Stability Index (PSI) and KL Divergence
    between the historical ML dataset topics (Reference) and the live API topics (Current).
    """
    if not reference_topics or not current_topics:
        return {"overall_psi": 0.0, "status": "Insufficient Data", "topics": {}}
        
    all_topics = set(reference_topics) | set(current_topics)
    ref_counts = {t: 0 for t in all_topics}
    cur_counts = {t: 0 for t in all_topics}
    
    for t in reference_topics: ref_counts[t] += 1
    for t in current_topics: cur_counts[t] += 1
        
    ref_total = len(reference_topics)
    cur_total = len(current_topics)
    
    epsilon = 0.0001
    psi_total = 0
    drift_details = {}
    
    for t in all_topics:
        ref_pct = (ref_counts[t] / ref_total) if ref_total > 0 else epsilon
        cur_pct = (cur_counts[t] / cur_total) if cur_total > 0 else epsilon
        
        # Avoid absolute zero for logarithmic functions
        ref_pct = max(ref_pct, epsilon)
        cur_pct = max(cur_pct, epsilon)
        
        # PSI per bucket (topic)
        psi_bucket = (cur_pct - ref_pct) * np.log(cur_pct / ref_pct)
        psi_total += psi_bucket
        
        # KL Divergence (Current || Reference)
        kl_bucket = cur_pct * np.log(cur_pct / ref_pct)
        
        drift_details[t] = {
            "ref_pct": round(ref_pct * 100, 2),
            "cur_pct": round(cur_pct * 100, 2),
            "psi": round(psi_bucket, 4),
            "kl": round(kl_bucket, 4)
        }
        
    status = "No Significant Drift"
    if psi_total >= 0.2:
        status = "Significant Drift"
    elif psi_total >= 0.1:
        status = "Moderate Drift"
        
    return {
        "overall_psi": round(psi_total, 4),
        "status": status,
        "topics": drift_details
    }

def get_article_drift_status(topic: str, all_drift_data: dict) -> dict:
    """
    Resolves the Drift Status for a specific topic classification.
    """
    if not all_drift_data or "topics" not in all_drift_data or topic not in all_drift_data["topics"]:
        return {"score": 0.0, "label": "Insufficient Data"}
        
    topic_data = all_drift_data["topics"][topic]
    psi = topic_data["psi"]
    
    if psi >= 0.1:
        label = "High Drift"
    elif psi >= 0.05:
        label = "Moderate Drift"
    else:
        label = "Stable"
        
    return {"score": round(psi, 4), "label": label}

