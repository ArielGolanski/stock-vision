# server/ml/ml_service.py
import os
from fastapi import FastAPI, Query, HTTPException
from model_utils import EnhancedLSTMPredictor, load_enhanced_data, prepare_features

app = FastAPI(title="Stock Prediction Service")

BASE_DIR = os.path.dirname(__file__)
BASE_MODEL_PATH = os.path.join(BASE_DIR, "ml_models")

@app.get("/")
def read_root():
    return {"message": "ML Prediction Service running"}

@app.get("/predict/{ticker}")
def predict_stock(
    ticker: str,
    target: str = Query("Daily Change %", enum=["Daily Change %", "Monthly Change %"]),
    days: int = Query(5, ge=1, le=30)
):
    ticker = ticker.strip().upper()
    model_path = os.path.join(BASE_MODEL_PATH, f"{ticker}/{ticker}_enhanced_lstm")

    # load data
    df = load_enhanced_data(ticker)
    if df.empty:
        raise HTTPException(status_code=404, detail="No historical data for ticker")

    features, target_arr, feature_names = prepare_features(df, target)

    predictor = EnhancedLSTMPredictor()
    try:
        predictor.load(model_path=model_path, prefix="daily" if target == "Daily Change %" else "monthly")
    except Exception as exc:
        # model not found or incompatible
        raise HTTPException(status_code=500, detail=f"Model load failed: {str(exc)}")

    future_changes, future_prices = predictor.forecast_future(df, features, target, n_days=days)

    return {"ticker": ticker, "future_changes": future_changes, "future_prices": future_prices}
