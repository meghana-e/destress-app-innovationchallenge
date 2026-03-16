# Destress App

Full-stack merged application with:

- `backend/`: FastAPI API for auth, profile storage, questionnaire submission, and dashboard data
- `frontend/`: React + Vite UI wired to the local backend

## Local development

1. Install backend Python dependencies:
   `cd backend && python3 -m pip install -r requirements.txt`
2. Install frontend dependencies:
   `cd frontend && npm install`
3. Install root dependency for concurrent dev startup:
   `npm install`
4. Start both services:
   `npm run dev`

Frontend runs on `http://localhost:3000`.
Backend runs on `http://localhost:5000`.