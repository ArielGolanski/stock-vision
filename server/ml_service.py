# ml_service.py
from fastapi import FastAPI
import joblib
import tensorflow as tf
import numpy as np
from ml.model_utils import EnhancedLSTMPredictor, load_enhanced_data, prepare_features

app = FastAPI()

@app.get("/predict/{ticker}")
def predict_stock(ticker: str, target: str = "Daily Change %", days: int = 5):
    # Load model + scalers
    prefix = "daily" if target == "Daily Change %" else "monthly"
    predictor = EnhancedLSTMPredictor()
    predictor.load(model_path=f"ml_models/{ticker}_enhanced_lstm", prefix=prefix)

    # Load data
    df = load_enhanced_data(ticker)
    features, target_data, _ = prepare_features(df, target)

    # Forecast
    future_changes, future_prices = predictor.forecast_future(df, features, target, n_days=days)

    return {
        "ticker": ticker,
        "future_changes": future_changes,
        "future_prices": future_prices
    }
