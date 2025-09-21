# server/ml/ml_service.py
import os
from fastapi import FastAPI, Query, HTTPException
from model_utils import EnhancedLSTMPredictor, load_enhanced_data, prepare_features
import yfinance as yf
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

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

# Allow React/Node frontend to call FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_date(d):
    if isinstance(d, pd.Timestamp):
        return d.strftime("%Y-%m-%d")
    return str(d)

@app.get("/api/stock-history")
def stock_history(
    ticker: str = Query(..., description="Stock ticker symbol"),
    range: str = Query("10y", description="Range like 1d, 5d, 1mo, 1y, 5y, 10y"),
    predictionType: str = Query("daily", description="daily or monthly"),
    predictionPeriods: int = Query(5, description="Number of future periods to forecast"),
):
    try:
        ticker = ticker.upper()
        stock = yf.Ticker(ticker)

        # Get history
        hist = stock.history(period=range, interval="1d")
        if hist.empty:
            return {"error": "Ticker not found or no data available"}

        history = [
            {
                "date": format_date(idx),
                "close": float(row["Close"]),
                "open": float(row["Open"]),
                "volume": int(row["Volume"]),
            }
            for idx, row in hist.iterrows()
        ]

        last_row = hist.iloc[-1]
        technical_info = {
            "last_close": float(last_row["Close"]),
            "last_open": float(last_row["Open"]),
            "last_volume": int(last_row["Volume"]),
        }

        # Stock info (basic fundamentals)
        info = stock.info
        stock_info = {
            "name": info.get("longName", ticker),
            "description": info.get("longBusinessSummary", ""),
            "stats": {
                "Market Cap": str(info.get("marketCap", "N/A")),
                "P/E Ratio": str(info.get("trailingPE", "N/A")),
                "Dividend Yield": str(info.get("dividendYield", "N/A")),
                "52W Range": f"{info.get('fiftyTwoWeekLow', 'N/A')} - {info.get('fiftyTwoWeekHigh', 'N/A')}",
            },
        }

        # === TODO: Replace this with your ML model prediction ===
        # Dummy predictions: +1% per day
        predictions = []
        last_date = hist.index[-1]
        last_price = last_row["Close"]

        if predictionType == "daily":
            for i in range(1, predictionPeriods + 1):
                future_date = pd.date_range(last_date, periods=i + 1, freq="B")[-1]
                predicted_price = last_price * (1 + 0.01 * i)
                predictions.append(
                    {"date": format_date(future_date), "predicted_close": float(predicted_price)}
                )
        else:  # monthly
            for i in range(1, predictionPeriods + 1):
                future_date = last_date + pd.DateOffset(months=i)
                predicted_price = last_price * (1 + 0.05 * i)
                predictions.append(
                    {"date": format_date(future_date), "predicted_close": float(predicted_price)}
                )

        return {
            "history": history,
            "predictions": predictions,
            "technical_info": technical_info,
            "stock_info": stock_info,
        }

    except Exception as e:
        return {"error": str(e)}
