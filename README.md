# Recruit

## Prerequisites
- Python 3.10+
- Node.js 18+
- npm (ships with Node)

## Environment Variables
Create `frontend/app/.env` (or `.env.local`) with:

```
VITE_API_BASE_URL=http://localhost:8000
```

Adjust the value if you run the backend on another host/port.

## Backend Setup
1. From the repo root install Python deps:
	- **Windows:** `pip install -r requirements.txt`
	- **macOS/Linux:** `python3 -m pip install -r requirements.txt`
2. Start the FastAPI server so uploads can be saved locally:
	- `uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`
3. Leave this terminal running; the endpoint `POST /api/projects` writes files under `backend/projects/proj_<id>/`.

## Frontend Setup
1. Change directory: `cd frontend/app`
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev`
4. Open the shown URL (typically `http://localhost:5173`) and keep both frontend and backend servers running.

## Upload Flow
1. Click “New project” in the UI, enter a title, and upload a job description file.
2. Press “Create project”; the frontend posts to the backend, which saves files at `backend/projects/proj_<id>/(job_title|job_desc)`.
3. A new project card appears immediately and the modal closes upon success.

If the modal stays open, check the browser console and backend terminal for errors (often the backend isn’t running or the env URL is wrong).
