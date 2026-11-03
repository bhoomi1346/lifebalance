# AI Life Balance System

AI Life Balance is a full-stack wellness app for tracking daily habits and exploring how they relate to stress and work-life balance. It combines a React dashboard with a Flask API, a MySQL database, and a machine-learning model. Its estimates and recommendations are for general wellness only; they are not medical advice or a diagnosis.

## Features

- Register and sign in, manage a profile, and record sleep, work, activity, hydration, meals, and mood.
- View dashboards, calendar history, stress estimates, work-life balance scores, and personalized habit recommendations.
- Try a what-if simulator, chat about wellness, and export reports as PDF or Excel.
- Connect the simulated wearable provider to populate sample activity and sleep data. Fitbit is currently a placeholder and is not configured for real connections.
- Manage users and model settings with the admin tools.

## Project structure

```text
backend/   Flask API, database models, and backend tests
frontend/  React application built with Vite
ml/        Dataset and model training scripts, data, and saved models
```

## Requirements

- Python 3.10 or newer
- Node.js and npm
- MySQL

## Setup

### 1. Configure the database

Create a MySQL database:

```sql
CREATE DATABASE lifebalance CHARACTER SET utf8mb4;
```

Create `backend/.env` with your local database credentials and a private JWT signing key:

```dotenv
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=localhost:3306
DB_NAME=lifebalance
JWT_SECRET_KEY=replace_with_a_long_random_secret

# Optional: enables the Groq-powered wellness chat.
GROQ_API_KEY=
```

Keep this file private; `.env` files are excluded from Git. The app can run without a Groq key, but AI chat responses require one.

### 2. Install backend dependencies and create tables

From the project root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python create_tables.py
```

If PowerShell prevents environment activation, run the Python commands using `.\venv\Scripts\python.exe` instead.

### 3. Start the API

From `backend`:

```powershell
python app.py
```

The API runs at `http://127.0.0.1:5000`. Visiting its root returns a small status response.

### 4. Install and start the frontend

Open another terminal at the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The frontend currently sends API requests to `http://127.0.0.1:5000/api`.

## Development checks

Run the backend safety checks from `backend`:

```powershell
python test_safety.py
```

Run frontend linting and a production build from `frontend`:

```powershell
npm run lint
npm run build
```

## Machine-learning files

Saved stress-prediction models are in `ml/models`; the API loads the active registered version and falls back to `v1.0`. Dataset generation and model training/retraining scripts are in `ml`. Run those scripts from the `ml` directory; training requires the corresponding dataset and its Python dependencies.
