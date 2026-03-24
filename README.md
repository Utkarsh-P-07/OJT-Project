# News Topic Drift Detection

Detects how news topics shift over time using TF-IDF + Cosine Similarity.

## Stack
- Backend: FastAPI + scikit-learn
- Frontend: React + Recharts
- Database: MongoDB
- Deploy: Docker

## Quick Start

### With Docker
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

### Local Dev

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Usage
1. Go to the Analyze page
2. Upload a CSV with `date` and `text` columns (sample: `backend/news_data.csv`)
3. Adjust the drift threshold (default 0.3)
4. Click "Detect Drift" — results appear on the Dashboard
