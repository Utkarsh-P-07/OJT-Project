# News Drift Detector

Detects when news content drifts away from a reference corpus using TF-IDF and Cosine Similarity.

🔗 **Live App**: [https://ojt-project-theta.vercel.app](https://ojt-project-theta.vercel.app)
📄 **API Docs**: [https://ojt-project-jtwv.onrender.com/docs](https://ojt-project-jtwv.onrender.com/docs)

---

## What It Does

Upload a `.txt` file or type/paste news text directly. The app compares it against a reference news corpus and returns a similarity score indicating whether the content has drifted.

| Score | Status |
|-------|--------|
| ≥ 0.50 | ✅ No Drift |
| 0.15 – 0.49 | ⚠️ Slight Drift |
| < 0.15 | 🚨 Drift Detected |

---

## Project Structure

```
OJT-Project/
├── backend/
│   ├── core/
│   │   ├── model.py           # TF-IDF training & drift detection
│   │   ├── file_processor.py  # TXT text extraction
│   │   └── utils.py           # NLP text cleaning
│   ├── db/
│   │   └── database.py        # MongoDB connection & queries
│   ├── main.py                # FastAPI app, routes, auth
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/        # React components
    │   ├── context/           # AuthContext
    │   ├── styles/            # Global CSS
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```

---

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
venv/Scripts/activate        # Windows
pip install -r requirements.txt
# create .env with MONGO_URI, DB_NAME, SECRET_KEY, TOKEN_EXPIRE_HOURS, ALLOWED_ORIGINS
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
# create .env with VITE_API_URL=http://localhost:8000
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current user info |
| POST | `/analyze-news` | Analyze a `.txt` file |
| POST | `/analyze-text` | Analyze typed/pasted text |
| GET | `/history` | Get user's analysis history |

---

## Tech Stack

- **Backend**: FastAPI, MongoDB, JWT auth, TF-IDF + Cosine Similarity
- **Frontend**: React, Vite, Axios
- **Deployed on**: Render (backend) + Vercel (frontend)

---

## Supported Input

- `.txt` file upload
- Direct text input (paste or type in the app)
