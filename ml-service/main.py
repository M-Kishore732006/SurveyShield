from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
import joblib
import os
from datetime import datetime

app = FastAPI()
MODEL_PATH = "isolation_forest.joblib"
METADATA_PATH = "model_metadata.joblib"

class ModelManager:
    def __init__(self):
        self.model = None
        self.metadata = None
        self.load_model()
        
    def load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.metadata = joblib.load(METADATA_PATH)
        else:
            self.model = None
            self.metadata = {
                "version": "v0.0.0",
                "trained": False,
                "trained_at": None,
                "feature_names": [],
                "numeric_features": [],
                "categorical_features": []
            }
            
    def train(self, df: pd.DataFrame):
        numeric_features = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
        categorical_features = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        skip_cols = ['recordId', 'household_id', 'uploadId', 'person_id', '_id', 'enumerator_id', 'survey_id', 'village_id']
        numeric_features = [f for f in numeric_features if f not in skip_cols]
        categorical_features = [f for f in categorical_features if f not in skip_cols]
        
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ])
            
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', IsolationForest(contamination=0.05, random_state=42))
        ])
        
        pipeline.fit(df)
        self.model = pipeline
        self.metadata = {
            "version": f"v1.0.{int(datetime.now().timestamp())}",
            "trained": True,
            "trained_at": datetime.now().isoformat(),
            "feature_names": numeric_features + categorical_features,
            "numeric_features": numeric_features,
            "categorical_features": categorical_features
        }
        
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.metadata, METADATA_PATH)
        
        return self.metadata

model_manager = ModelManager()

class TrainRequest(BaseModel):
    records: List[Dict[str, Any]]

class PredictRequest(BaseModel):
    records: List[Dict[str, Any]]

@app.get("/ml/model-status")
def model_status():
    return model_manager.metadata

@app.post("/ml/train")
def train_model(request: TrainRequest):
    df = pd.DataFrame(request.records)
    if len(df) < 5:
        raise HTTPException(status_code=400, detail="Not enough data to train. Need at least 5 records.")
    
    metadata = model_manager.train(df)
    return {"message": "Model trained successfully", "metadata": metadata}

@app.post("/ml/predict")
def predict_anomalies(request: PredictRequest):
    if not model_manager.model:
        raise HTTPException(status_code=400, detail="Model is not trained yet.")
        
    df = pd.DataFrame(request.records)
    
    preds = model_manager.model.predict(df)
    scores = model_manager.model.decision_function(df)
    
    anomaly_scores = (0.5 - scores) * 100
    anomaly_scores = np.clip(anomaly_scores, 0, 100)
    
    results = []
    
    try:
        num_imputer = model_manager.model.named_steps['preprocessor'].transformers_[0][1].named_steps['imputer']
        num_scaler = model_manager.model.named_steps['preprocessor'].transformers_[0][1].named_steps['scaler']
        num_features = model_manager.metadata['numeric_features']
    except Exception as e:
        num_features = []
    
    for i in range(len(df)):
        score = float(anomaly_scores[i])
        
        severity = "LOW"
        is_anomaly = False
        if score >= 70:
            severity = "HIGH"
            is_anomaly = True
        elif score >= 50:
            severity = "MEDIUM"
            is_anomaly = True
            
        reasons = []
        if is_anomaly and len(num_features) > 0:
            for j, feature in enumerate(num_features):
                if feature in df.columns:
                    val = df.iloc[i][feature]
                    try:
                        val = float(val)
                        mean_val = num_imputer.statistics_[j]
                        std_val = num_scaler.scale_[j]
                        if std_val > 0:
                            z_score = abs(val - mean_val) / std_val
                            if z_score > 2.0:
                                direction = "higher" if val > mean_val else "lower"
                                reasons.append(f"{feature.replace('_', ' ').title()} ({val}) is significantly {direction} than the historical average.")
                    except:
                        pass
                        
        if is_anomaly and not reasons:
            reasons.append("Record exhibits an unusual combination of attributes based on historical patterns.")
                
        results.append({
            "isAnomaly": is_anomaly,
            "anomalyScore": score,
            "severity": severity,
            "reasons": reasons,
            "modelVersion": model_manager.metadata['version']
        })
        
    return {"results": results}
