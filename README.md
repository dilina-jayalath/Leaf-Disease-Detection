# Corn Disease Detection System

A complete web application for detecting Corn plant diseases (Blight, Common Rust, Gray Leaf Spot) using Deep Learning (PyTorch ResNet18).

## Tech Stack

*   **Frontend**: React.js (Vite), CSS3
*   **Backend**: Django REST Framework (Python)
*   **AI Model**: PyTorch (ResNet18)
*   **Database**: SQLite (Development)

## Features

*   **Disease Identification**: Upload a leaf image to detect diseases.
*   **Plant Assistant**: Authenticated chat assistant with Gemini or OpenAI support, plus a built-in rule-based fallback.
*   **Dashboard**: Manage potential disease entries.
*   **Detailed Insights**: View Symptoms, Causes, Treatment, and Prevention.

## AI Chat Agent Setup

The chat endpoint now supports two AI providers:

*   **Gemini** through Google's OpenAI-compatible `chat/completions` endpoint.
*   **OpenAI** through the `Responses` API.

If no working AI provider is configured, the backend automatically falls back to the local rule-based chatbot.

### Gemini Setup

Create a local `.env` file in the project root. You can copy `.env.example` and replace the placeholder key:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
GEMINI_MAX_OUTPUT_TOKENS=500
GEMINI_TIMEOUT_SECONDS=25
```

Optional:

```bash
GEMINI_REASONING_EFFORT=low
```

### OpenAI Setup

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_CHAT_MODEL=gpt-5.4-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_REASONING_EFFORT=none
OPENAI_MAX_OUTPUT_TOKENS=500
OPENAI_TIMEOUT_SECONDS=25
```

Notes:

*   If `AI_PROVIDER` is not set, the backend auto-selects `gemini` when `GEMINI_API_KEY` exists, otherwise `openai` when `OPENAI_API_KEY` exists.
*   The frontend sends recent chat history to the backend so replies remain conversational.
*   Keep API keys only on the backend, never in frontend code.
*   The local `.env` file is ignored by Git. Commit `.env.example`, but do not commit real secrets.

## Setup Instructions

### 1. Backend (Django)

Prerequisites: Python 3.10+ installed.

```bash
cd backend
# Create virtual environment (optional but recommended)
# python -m venv venv
# .\venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Optional: configure AI chat agent
# Copy ../.env.example to ../.env and add your real Gemini API key.

# Run Migrations
python manage.py migrate

# Start Server
python manage.py runserver
```
Server runs at: `http://localhost:8000`

### 2. Frontend (React)

Prerequisites: Node.js installed.

```bash
cd frontend
# Install dependencies
npm install

# Start Dev Server
npm run dev
```
Frontend runs at: `http://localhost:5173`

## Training the Model

A training script is provided for Google Colab: `corn_training_script.py`.
It downloads the dataset, trains a ResNet18 model, and saves `corn_disease_model.pth`.

## Folder Structure

*   `backend/`: Django project files.
*   `backend/api/`: API app containing views, models, and ML logic.
*   `frontend/`: React application.
*   `frontend/src/components/`: Reusable UI components.
