from sklearn.metrics.pairwise import cosine_similarity
import scipy.stats as stats
from collections import defaultdict

def calculate_trend_score(new_text: str, vectorizer, recent_texts: list[str]) -> dict:
    """
    Computes Trend Score = Avg Cosine Similarity with recent news.
    Returns Score (0-100) and Label (Low/Medium/High).
    """
    if not recent_texts or not new_text:
        return {"score": 0.0, "label": "Low Trending"}

    try:
        # Transform the incoming text and the recent texts.
        # Vectorizer should already be fitted.
        new_vec = vectorizer.transform([new_text])
        recent_vecs = vectorizer.transform(recent_texts)
        
        # Calculate cosine similarities
        similarities = cosine_similarity(new_vec, recent_vecs)
        
        # Calculate average similarity score
        avg_sim = float(similarities.mean())
        score = min(max(avg_sim * 100 * 5, 0), 100) # Multiply by 5 to spread out the score a bit as cosine similarity can be low.
        
        # Labels
        if score > 60:
            label = "High Trending"
        elif score > 25:
            label = "Medium Trending"
        else:
            label = "Low Trending"
            
        return {"score": round(score, 2), "label": label}
        
    except Exception as e:
        print(f"Error calculating trend score: {e}")
        return {"score": 0.0, "label": "Low Trending"}

def predict_future_trends(articles: list[dict], group_by: str = "month") -> dict:
    """
    Predict future trend trajectories (Increasing/Decreasing/Stable) for each topic.
    Returns { "topic_name": "trajectory" }
    """
    if not articles:
        return {}
        
    import pandas as pd
    
    # Create DataFrame
    df = pd.DataFrame(articles)
    
    # Ensure date and logic are correct
    if "date" not in df.columns or "topic" not in df.columns:
        return {}
        
    df["date"] = pd.to_datetime(df["date"], errors='coerce')
    df = df.dropna(subset=['date'])
    
    if group_by == "month":
        df["period_key"] = df["date"].dt.to_period("M").astype(str)
    elif group_by == "week":
        df["period_key"] = df["date"].dt.strftime("%G-W%V")
    else:
        df["period_key"] = df["date"].dt.date.astype(str)
        
    # Group by period and topic
    counts = df.groupby(["period_key", "topic"]).size().reset_index(name="count")
    periods = sorted(counts["period_key"].unique())
    
    # We need sequential index for periods
    period_to_idx = {p: i for i, p in enumerate(periods)}
    
    predictions = {}
    topics = counts["topic"].unique()
    
    for topic in topics:
        topic_data = counts[counts["topic"] == topic]
        # x is the sequence index, y is the count
        x = [period_to_idx[p] for p in topic_data["period_key"]]
        y = topic_data["count"].tolist()
        
        if len(x) < 2:
            predictions[topic] = "Stable"
            continue
            
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        
        if slope > 0.5:
            predictions[topic] = "Increasing"
        elif slope < -0.5:
            predictions[topic] = "Decreasing"
        else:
            predictions[topic] = "Stable"
            
    # Prepare chart_data for Recharts
    # We want a list of dicts: [{period_key: '2024-01', Topic1: 5, Topic2: 1}, ...]
    chart_data = []
    for p in periods:
        entry = {"period_key": p}
        for t in topics:
            # find count for this period and topic
            match = counts[(counts["period_key"] == p) & (counts["topic"] == t)]
            entry[t] = int(match["count"].iloc[0]) if not match.empty else 0
        chart_data.append(entry)
            
    return {"predictions": predictions, "periods": periods, "chart_data": chart_data}
