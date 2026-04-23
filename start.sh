#!/bin/bash
echo "Starting ML API on port 8000..."
cd /home/xanax/Documents/codered/smart_farm_marketplace/Crop-Price-Prediction-Minor-Project
source ../.venv/bin/activate
uvicorn ml_api:app --host 0.0.0.0 --port 8000 &
ML_PID=$!
echo "ML API started (PID: $ML_PID)"

echo "Starting Next.js on port 3000..."
cd /home/xanax/Documents/codered/smart_farm_marketplace
npm run dev
