# News Drift Detector

Detects when news content drifts away from a reference corpus using TF-IDF and Cosine Similarity.

## Project Structure

```
OJT-Project/
├── backend/
│   ├── core/               # ML logic
│   │   ├── model.py        # TF-IDF training & drift detection
│   │   ├── file_processor.py  # TXT / PDF / Image text extraction
│   │   └── utils.py        # NLP text cleaning
│   ├── db/
│   │   └── database.py     # MongoDB connection & queries
│   ├── main.py             # FastAPI app, routes, auth
│   ├── requirements.txt
│   ├── .env                # (not committed)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/     # React components + co-located CSS
    │   ├── context/        # AuthContext
    │   ├── styles/         # Global CSS
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env                # (not committed)
    └── .env.example
```

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
venv/Scripts/activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # fill in your values
python -m uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Tech Stack
- **Backend**: FastAPI, MongoDB, JWT auth, TF-IDF + Cosine Similarity, EasyOCR
- **Frontend**: React, Vite, Axios
