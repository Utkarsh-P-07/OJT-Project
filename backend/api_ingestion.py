import requests
from datetime import datetime

def fetch_live_news() -> list[dict]:
    """
    Connects to the official NewsAPI and independently fetches articles from specific 
    categories, auto-labeling them explicitly for our machine learning model.
    """
    import os
    API_KEY = os.getenv("NEWSAPI_KEY", "")
    if not API_KEY:
        raise ValueError("NEWSAPI_KEY missing from Environment.")
        
    url_template = f"https://newsapi.org/v2/top-headlines?country=us&category={{}}&apiKey={API_KEY}"
    
    # Map external API categories strictly to our model's supported Topics
    category_map = {
        "business": "Business",
        "science": "Sci/Tech",
        "technology": "Sci/Tech",
        "general": "World",
        "sports": "Sports",
        "health": "Sci/Tech", # Map health into general tech/science bounds
    }
    
    articles_collected = []
    
    for api_cat, model_topic in category_map.items():
        try:
            print(f"[API_INGEST] Fetching category {api_cat}...")
            headers = {"User-Agent": "Mozilla/5.0"}
            res = requests.get(url_template.format(api_cat), headers=headers, timeout=10)
            if res.status_code == 200:
                print(f"[API_INGEST] Success for {api_cat}!")
                data = res.json()
                news_items = data.get("articles", [])
                
                for item in news_items:
                    # Formulate "text" by safely concatenating title, description, and content blocks
                    title = item.get("title") or ""
                    desc = item.get("description") or ""
                    content = item.get("content") or ""
                    
                    # Remove the API truncation brackets (e.g. [+4982 chars]) if present to avoid ML noise
                    import re
                    content_clean = re.sub(r'\[\+\d+ chars\]', '', content).strip()
                    
                    full_text = f"{title} - {desc} {content_clean}".strip()
                    
                    if len(full_text) < 20:
                        continue
                        
                    # Normalize date
                    raw_date = item.get("publishedAt") # e.g. "2023-11-20T12:00:00Z"
                    if raw_date:
                        try:
                            dt = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
                            date_str = dt.strftime("%Y-%m-%d %H:%M:%S")
                        except Exception:
                            date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        
                    articles_collected.append({
                        "date": date_str,
                        "text": full_text,
                        "topic": model_topic
                    })
        except Exception as e:
            print(f"Failed to fetch {api_cat} news: {e}")
            
    return articles_collected
