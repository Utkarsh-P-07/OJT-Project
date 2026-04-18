# News Drift Detection System

An end-to-end full stack application that detects topic drift between historical and current news articles.

## Tech Stack
- **Backend**: Python 3, FastAPI, scikit-learn, NLTK
- **Frontend**: React (Vite), Axios, CSS (Inter Font)

## Running the Application

### 1. Backend (FastAPI)
The backend runs on `http://localhost:8000`.

```bash
cd backend
python -m venv venv
# Activate the virtual environment:
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

### 2. Frontend (React)
The frontend usually runs on `http://localhost:5173`.

```bash
cd frontend
npm install
npm run dev
```

## How It Works
1. Upload an `old.txt` (Historical News) and a `new.txt` (Current News) file. Each line should contain text representing one article.
2. The backend cleans the data (lowercase, remove punctuation, remove stopwords, lemmatization).
3. The system computes TF-IDF representations.
4. It checks the maximum cosine similarity between each new article and the historical dataset.
5. If the average maximum similarity drops below **0.15**, it triggers a 🚨 **Drift Detected** alert.

Enjoy!
