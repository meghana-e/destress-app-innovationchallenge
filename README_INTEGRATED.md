# 🧠 DESTRESS — AI Stress Intelligence Application

## Overview
**One Integrated Full-Stack Application** combining React Frontend + FastAPI Backend

All code is contained within `/Users/meghana/destress-app` with both frontend and backend code working together seamlessly.

---

## 📁 Project Structure

```
destress-app/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/           # UI Pages (Dashboard, Onboarding, Settings, etc.)
│   │   ├── components/      # React Components
│   │   ├── services/        # API Client (calls /api/*)
│   │   ├── contexts/        # Auth Context
│   │   └── hooks/           # Custom React Hooks
│   ├── dist/                # Built static files (served by backend)
│   └── package.json
│
├── backend/                  # FastAPI + Python
│   ├── main.py              # FastAPI server
│   ├── .env                 # Configuration (PORT=4000)
│   ├── data/                # JSON database files
│   └── requirements.txt      # Python dependencies
│
├── start.sh                 # ✨ SINGLE COMMAND TO RUN EVERYTHING
├── package.json             # Root package config
└── README.md                # This file

```

---

## 🚀 Quick Start — ONE COMMAND

Simply run:

```bash
./start.sh
```

**OR** (if on a different shell):

```bash
bash /Users/meghana/destress-app/start.sh
```

---

## What Happens When You Run `./start.sh`

1. **Builds Frontend** — Compiles React code to static files in `frontend/dist/`
2. **Installs Python Dependencies** — Sets up FastAPI, Uvicorn, etc.
3. **Starts Backend Server** — Launches FastAPI on **port 4000**
4. **Serves Complete App** — One single process serving:
   - React SPA frontend (HTML + CSS + JS)
   - REST API endpoints (`/api/signup`, `/api/questionnaire`, etc.)
   - Dynamic stress scoring

---

## 🔗 How It's Integrated

### Frontend → Backend Connection

```
User Action (Sign Up / Questionnaire)
        ↓
React Component calls API Service
        ↓
API Service makes fetch to /api/* (relative URL)
        ↓
FastAPI backend receives request at /api/*
        ↓
Backend processes (authenticate, score stress, save data)
        ↓
Returns JSON response
        ↓
React updates UI with results (Dashboard, scores, nudges)
```

### Key Integration Points

1. **Onboarding Form** (`frontend/src/pages/Onboarding.tsx`)
   - Collects: age, industry, work hours, sleep, exercise, etc.
   - Calls: `POST /api/questionnaire`
   - Response: User profile with `onboarding_completed: true`

2. **Stress Scoring** (`backend/main.py`)
   - Endpoint: `POST /api/assess`
   - Algorithm: ML model (scikit-learn) or hardcoded logic
   - Returns: `strain_index`, `burnout_risk`, `nudge`, `dnd_mode`, `top_factors`

3. **Dashboard** (`frontend/src/pages/Dashboard.tsx`)
   - Calls: `GET /api/dashboard`
   - Displays: Real-time stress metrics, trends, recommendations
   - Data source: Backend analysis of questionnaire responses

4. **API Base URL**
   - Frontend uses: `API_BASE = "/api"` (relative URL)
   - Backend serves everything from port 4000
   - No need for CORS or cross-origin proxies

---

## 📊 Data Flow Example

### User Journey:

1. **Sign Up** → `POST /api/signup` → Backend creates user
2. **Questionnaire** → `POST /api/questionnaire` → Backend scores stress
3. **Dashboard** → `GET /api/dashboard` → Backend returns metrics
4. **Settings** → `PUT /api/profile` → Backend updates profile
5. **Logout** → `POST /api/logout` → Session cleared

### Score Calculation:

```
Questionnaire Input (12 questions):
  - age: 35
  - industry: "Finance"
  - work_hours: 12
  - work_pressure: "high" (→ 3)
  - manager_support: 1
  - sleeping_habit: 5
  - exercise_habit: 1
  - job_satisfaction: 1
  - work_life_balance: 0
  - social_person: 0
  - lives_with_family: 0
  - work_from: 2
        ↓
Backend Scoring Algorithm
        ↓
Output:
  - strain_index: 90.0
  - burnout_risk: "High"
  - nudge: "Consider taking a break..."
  - dnd_mode: { status: "active", ... }
  - top_factors: ["Long work hours", "Low support", ...]
```

---

## 🔧 Configuration

**Port**: `4000` (set in `/backend/.env`)

To change port:
1. Edit `/backend/.env`: `PORT=3000` (or any available port)
2. Re-run `./start.sh`

**Check if port is available**:
```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN 2>/dev/null && echo "In use" || echo "Free"
```

---

## 📦 What's Installed

### Frontend Dependencies
- React 18.3.1
- TypeScript
- Vite 5.4.21 (build tool)
- Tailwind CSS (styling)
- Lucide Icons
- Framer Motion (animations)
- Recharts (data viz)

### Backend Dependencies
- FastAPI (web framework)
- Uvicorn (server)
- Pydantic (data validation)
- scikit-learn (ML model)
- Python 3.8+

---

## 🧪 Test the Integration

Once the app is running on `http://localhost:4000`:

### 1. Sign Up
```bash
curl -X POST http://localhost:4000/api/signup \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Test User","email":"test@example.com","password":"pass123"}'
```

### 2. Login & Get Token
```bash
curl -X POST http://localhost:4000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### 3. Submit Questionnaire (replace TOKEN)
```bash
curl -X POST http://localhost:4000/api/questionnaire \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TOKEN' \
  -d '{"age":"35","industry":"Finance","work_hours":"12",...}'
```

### 4. Get Dashboard Data
```bash
curl http://localhost:4000/api/dashboard \
  -H 'Authorization: Bearer TOKEN' | jq .
```

---

## 🎯 Features

✅ **Unified Codebase** — Frontend & Backend in one folder  
✅ **Single Port** — Everything on port 4000  
✅ **One Command** — `./start.sh` runs everything  
✅ **Real-time Integration** — Form → Score → Dashboard  
✅ **ML-Powered Scoring** — Dynamic strain index calculation  
✅ **Persistent Storage** — JSON database (in `backend/data/`)  
✅ **Session Management** — JWT-like tokens  
✅ **Responsive UI** — Mobile-friendly React app  
✅ **Production Build** — Minified frontend assets  

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Or use different port
PORT=5000 ./start.sh  # Won't work with current script
# Instead, edit backend/.env: PORT=5000
```

### Frontend Not Loading
- Check: `frontend/dist/index.html` exists
- If not: Run `cd frontend && npm run build`

### API Getting 404
- Check backend logs for errors
- Verify token is in Authorization header
- Check `/api/*` routes are in `backend/main.py`

### Python Errors
- Install deps: `pip install fastapi uvicorn python-multipart pydantic`
- Check Python version: `python3 --version` (needs 3.8+)

---

## 📝 Next Steps

1. Run: `./start.sh`
2. Open: `http://localhost:4000`
3. Sign up with email & password
4. Complete onboarding (12 questions)
5. View dynamic stress metrics on dashboard
6. Explore AI recommendations and interventions

---

## 🔐 Security Notes

- Tokens stored in `backend/data/sessions.json` (demo only)
- Passwords hashed with PBKDF2-HMAC
- No external dependencies for auth (fully self-contained)
- CORS enabled for all origins (adjust in production)

---

**App is ready to run. Simply execute: `./start.sh`** 🚀

