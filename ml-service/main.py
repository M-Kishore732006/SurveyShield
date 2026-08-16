from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.neighbors import LocalOutlierFactor
import io

app = FastAPI()

# Placeholder for loaded models
models = {
    'isolation_forest': IsolationForest(contamination=0.05, random_state=42),
    'lof': LocalOutlierFactor(n_neighbors=20, contamination=0.05, novelty=True),
    'is_trained': False
}

# Dummy historical data for initial fitting if needed
def init_models():
    # In a real app, this would load pre-trained models from disk
    # For hackathon MVP, we can train on some dummy data on startup
    dummy_data = pd.DataFrame({
        'age': np.random.randint(18, 65, 1000),
        'income': np.random.randint(10000, 100000, 1000),
        'hours_worked': np.random.randint(20, 60, 1000),
        'household_size': np.random.randint(1, 8, 1000)
    })
    models['isolation_forest'].fit(dummy_data)
    models['lof'].fit(dummy_data)
    models['is_trained'] = True
    print("Models initialized with dummy data.")

@app.on_event("startup")
async def startup_event():
    init_models()

class RecordFeatures(BaseModel):
    age: float
    income: float
    hours_worked: float
    household_size: float

class PredictRequest(BaseModel):
    records: List[RecordFeatures]

@app.get("/ml/model-status")
def model_status():
    return {"status": "Active", "trained": models['is_trained']}

@app.post("/ml/predict")
def predict_anomalies(request: PredictRequest):
    if not models['is_trained']:
        raise HTTPException(status_code=400, detail="Models not trained")

    df = pd.DataFrame([r.dict() for r in request.records])
    
    # 1. Isolation Forest (Global anomaly)
    # returns 1 for normal, -1 for anomaly
    if_preds = models['isolation_forest'].predict(df)
    if_scores = models['isolation_forest'].decision_function(df) # lower means more anomalous
    
    # Normalize IF scores to 0-100 anomaly score (higher = more anomalous)
    # typically decision_function is between -0.5 and 0.5
    if_anomaly_scores = (0.5 - if_scores) * 100
    if_anomaly_scores = np.clip(if_anomaly_scores, 0, 100)

    # 2. Local Outlier Factor (Local anomaly)
    lof_preds = models['lof'].predict(df)
    lof_scores = models['lof'].decision_function(df)
    lof_anomaly_scores = (0.5 - lof_scores) * 100
    lof_anomaly_scores = np.clip(lof_anomaly_scores, 0, 100)

    results = []
    for i in range(len(df)):
        results.append({
            "isolation_forest_score": float(if_anomaly_scores[i]),
            "lof_score": float(lof_anomaly_scores[i]),
        })

    return {"results": results}

@app.post("/ml/enumerator-score")
def calculate_enumerator_score(data: dict):
    # Dummy Random Forest logic
    # In reality, you'd extract features like anomaly rate, interview duration, etc.
    anomaly_rate = data.get('anomaly_rate', 0)
    flagged = data.get('flagged_records', 0)
    
    # Simple rule-based calculation to simulate RF for now
    score = 100 - (anomaly_rate * 100) - (flagged * 0.5)
    score = max(0, min(100, score))
    
    return {"reliability_score": float(score)}

@app.post("/ml/village-score")
def calculate_village_score(data: dict):
    # Similar to enumerator score
    high_risk_ratio = data.get('high_risk_ratio', 0)
    score = 100 - (high_risk_ratio * 100)
    score = max(0, min(100, score))
    
    return {"quality_score": float(score)}
