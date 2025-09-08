# Project Name

Full-stack chat application using Next.js and FastAPI.

## Structure
- `/frontend` - Next.js frontend application
- `/backend` - FastAPI backend application

## Setup Instructions

### Backend
1. Create virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure environment variables

3. Start the backend server
```bash
uvicorn app.main:app --reload
```

### Frontend
1. Install dependencies
```bash
cd frontend
npm install
```

2. Start the development server
```bash
npm run dev
```