from fastapi import FastAPI, Query
from model_utils import EnhancedLSTMPredictor, load_enhanced_data, prepare_features
import os

app = FastAPI(title="Stock Prediction API")

BASE_MODEL_PATH = os.path.join(os.path.dirname(__file__), "ml_models")

@app.get("/")
def root():
    return {"message": "ML Prediction Service is running 🚀"}

@app.get("/predict/{ticker}")
def predict_stock(
    ticker: str,
    target: str = Query("Daily Change %", enum=["Daily Change %", "Monthly Change %"]),
    days: int = Query(5, ge=1, le=30)
):
    prefix = "daily" if target == "Daily Change %" else "monthly"
    model_path = os.path.join(BASE_MODEL_PATH, f"{ticker}_enhanced_lstm")

    predictor = EnhancedLSTMPredictor()
    predictor.load(model_path=model_path, prefix=prefix)

    df = load_enhanced_data(ticker)
    features, target_data, _ = prepare_features(df, target)

    future_changes, future_prices = predictor.forecast_future(
        df, features, target, n_days=days
    )

    return {
        "ticker": ticker,
        "target": target,
        "future_changes": future_changes,
        "future_prices": future_prices
    }
