# Corn Disease Detection System

A complete web application for detecting Corn plant diseases (Blight, Common Rust, Gray Leaf Spot) using Deep Learning (PyTorch ResNet18).

## Tech Stack

*   **Frontend**: React.js (Vite), CSS3
*   **Backend**: Django REST Framework (Python)
*   **AI Model**: PyTorch (ResNet18)
*   **Database**: SQLite (Development)

## Features

*   **Disease Identification**: Upload a leaf image to detect diseases.
*   **Plant Assistant**: AI Chatbot for care tips and disease info.
*   **Dashboard**: Manage potential disease entries.
*   **Detailed Insights**: View Symptoms, Causes, Treatment, and Prevention.

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
