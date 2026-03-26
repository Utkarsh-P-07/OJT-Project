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
2. Upload a CSV with `date` and `text` columns, or 2+ PDFs with dates assigned
3. Choose how to group articles: by day, week, or month
4. Adjust the drift threshold (default 0.3)
5. Click "Run analysis" — results appear on the Dashboard

## CSV Format
```
date,text
2024-01-01,"Article text here..."
2024-02-01,"Another article..."
```
Rows in the same period are merged into one document before analysis.

## Features
- TF-IDF vectorization with bigrams and log normalization
- Cosine similarity between consecutive time periods
- Configurable grouping: day / week / month
- Top keywords per period shown in the results table
- Article count per period (from_count → to_count)
- Run history — reload any past analysis from the dashboard
- Delete runs from history
- Export results to CSV
- Configurable drift threshold (0.1 – 0.9)
- PDF text extraction in the browser (no server upload needed)
- MongoDB stores every run with a unique run ID + indexes for fast queries
- Global stats: all-time run count, total drifts, worst transition ever
- Docker healthchecks and restart policies

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/detect-drift` | Run analysis on uploaded CSV |
| GET | `/results` | Get latest (or specific) run results |
| GET | `/history` | List past runs |
| DELETE | `/runs/{run_id}` | Delete a run |
| GET | `/stats` | Aggregate stats across all runs |
| GET | `/health` | Health check |
