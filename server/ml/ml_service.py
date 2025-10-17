# server/ml/ml_service.py
import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import yfinance as yf
import pandas as pd
from datetime import datetime
import math
import random

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

    # Try heavy ML path first; on ImportError fallback to lightweight heuristic
    try:
        from model_utils import EnhancedLSTMPredictor, load_enhanced_data, prepare_features

        model_path = os.path.join(BASE_MODEL_PATH, f"{ticker}/{ticker}_enhanced_lstm")

        df = load_enhanced_data(ticker)
        if df.empty:
            raise HTTPException(status_code=404, detail="No historical data for ticker")

        features, _, _ = prepare_features(df, target)
        predictor = EnhancedLSTMPredictor()
        predictor.load(model_path=model_path, prefix="daily" if target == "Daily Change %" else "monthly")
        future_changes, future_prices = predictor.forecast_future(df, features, target, n_days=days)
        return {"ticker": ticker, "future_changes": future_changes, "future_prices": future_prices}
    except ImportError:
        # Lightweight mode: generate simple heuristic predictions without TensorFlow/torch
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period="1mo", interval="1d")
            if hist.empty:
                raise HTTPException(status_code=404, detail="No historical data for ticker")
            last_price = float(hist["Close"].iloc[-1])
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Fallback data fetch failed: {str(exc)}")

        heuristic_changes = []
        heuristic_prices = []
        current = last_price
        for i in range(1, days + 1):
            if target == "Daily Change %":
                change = 0.8 + 0.1 * (i % 3)  # ~0.8%..1.0% daily drift
                heuristic_changes.append(change)
                current *= (1 + change / 100.0)
                heuristic_prices.append(round(current, 6))
            else:  # Monthly Change % -> spread a 5% monthly change across business days
                monthly_change = 5.0
                daily_change = monthly_change / 21.0
                heuristic_changes.append(daily_change)
                current *= (1 + daily_change / 100.0)
                heuristic_prices.append(round(current, 6))

        return {"ticker": ticker, "future_changes": heuristic_changes, "future_prices": heuristic_prices}

# Allow React/Node frontend to call FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_date(idx):
    """Helper to format pandas Timestamp or datetime to YYYY-MM-DD"""
    if isinstance(idx, (pd.Timestamp, datetime)):
        return idx.strftime("%Y-%m-%d")
    return str(idx)

@app.get("/api/stock-history")
def stock_history(
    ticker: str = Query(..., description="Stock ticker symbol"),
    time_range: str = Query("10y", alias="range", description="Period like 1d, 5d, 1mo, 1y, 5y, 10y"),
    predictionType: str = Query("daily", description="daily or monthly"),
    predictionPeriods: int = Query(5, description="Number of future periods to forecast"),
):
    try:
        # Debugging logs
        print(f"DEBUG stock_history: ticker={ticker}, period={time_range}, "
              f"predictionType={predictionType}, predictionPeriods={predictionPeriods}")

        ticker = ticker.upper()
        stock = yf.Ticker(ticker)

        # --- Get historical data ---
        print(f"DEBUG stock_histoty: period={range}")
        hist = stock.history(period=time_range, interval="1d")
        if hist.empty:
            print(f"DEBUG stock_history: No data for {ticker} with period={range}")
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

        print(f"History is {history}")

        last_row = hist.iloc[-1]
        technical_info = {
            "last_close": float(last_row["Close"]),
            "last_open": float(last_row["Open"]),
            "last_volume": int(last_row["Volume"]),
        }

        # --- Basic fundamentals ---
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

        # --- Dummy predictions (replace with ML model if desired) ---
        predictions = []
        last_date = hist.index[-1]
        last_price = last_row["Close"]

        if predictionType == "daily":
            for i in range(1, predictionPeriods + 1):
                future_date = pd.date_range(last_date, periods=i + 1, freq="B")[-1]
                predicted_price = last_price * (1 + 0.01 * i)
                predictions.append({
                    "date": format_date(future_date),
                    "predicted_close": float(predicted_price)
                })
        else:  # monthly predictions
            for i in range(1, predictionPeriods + 1):
                future_date = last_date + pd.DateOffset(months=i)
                predicted_price = last_price * (1 + 0.05 * i)
                predictions.append({
                    "date": format_date(future_date),
                    "predicted_close": float(predicted_price)
                })

        return {
            "history": history,
            "predictions": predictions,
            "technical_info": technical_info,
            "stock_info": stock_info,
        }

    except Exception as e:
        return {"error": str(e)}


# -----------------------------
# Backtest endpoint
# -----------------------------
@app.get("/backtest/{ticker}")
def backtest(
    ticker: str,
    window_days: int = Query(90, ge=10, le=365),
    horizon: int = Query(1, ge=1, le=5),
    target: str = Query("Daily Change %", enum=["Daily Change %", "Monthly Change %"]) 
):
    """Walk-forward backtest producing next-\n    day predictions over the last window_days and metrics (directional, MAE, RMSE).
    """
    ticker = ticker.strip().upper()

    # Fetch sufficient history (pad a bit beyond window)
    period = "2y" if window_days > 180 else ("6mo" if window_days > 60 else "3mo")
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval="1d")
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data for ticker")
        # Use last window_days + horizon to ensure we have ground truth for last step
        hist = hist.tail(window_days + horizon + 5)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"History fetch failed: {str(exc)}")

    dates = []
    y_true = []
    y_pred = []

    # Try to prepare ML model once (if available)
    predictor = None
    prepare_features = None
    load_enhanced_data = None
    prefix = "daily" if target == "Daily Change %" else "monthly"
    try:
        from model_utils import EnhancedLSTMPredictor, prepare_features as _prep, load_enhanced_data as _load
        predictor = EnhancedLSTMPredictor()
        model_path = os.path.join(BASE_MODEL_PATH, f"{ticker}/{ticker}_enhanced_lstm")
        predictor.load(model_path=model_path, prefix=prefix)
        prepare_features = _prep
        load_enhanced_data = _load
        enhanced_df = load_enhanced_data(ticker)
    except Exception:
        predictor = None
        enhanced_df = None

    closes = hist["Close"].tolist()
    idx_list = list(hist.index)

    # Walk-forward
    # For each index i where i+hor exists, predict price at i+horizon using data up to i
    for i in range(0, len(closes) - horizon):
        # we only keep last window_days predictions
        # skip until within last window_days
        remaining = len(closes) - (i + horizon)
        if remaining > window_days:
            continue

        history_slice_end = i + 1  # inclusive data up to i
        recent_prices = closes[:history_slice_end]
        prev_close = recent_prices[-1]

        # Ground truth at i + horizon
        true_close = closes[i + horizon]

        # Predict next price
        pred_close = None
        if predictor is not None and enhanced_df is not None:
            try:
                # Align enhanced features to same dates when possible; fallback to price-based length
                # Use all data up to current date index
                current_date = idx_list[i]
                subset = enhanced_df.loc[:current_date]
                features, _, _ = prepare_features(subset, target)
                # Forecast horizon steps ahead; take last returned future price
                _, future_prices = predictor.forecast_future(subset, features, target, n_days=horizon)
                pred_close = float(future_prices[-1])
            except Exception:
                pred_close = None

        if pred_close is None:
            # Heuristic fallback: drift from prev_close, scaled by horizon
            daily_change = 0.9 / 100.0  # 0.9%
            pred_close = prev_close * ((1.0 + daily_change) ** horizon)

        dates.append(format_date(idx_list[i + horizon]))
        y_true.append(float(true_close))
        y_pred.append(float(pred_close))

    if not y_true:
        raise HTTPException(status_code=500, detail="Insufficient data for backtest")

    # Metrics
    abs_errors = [abs(p - t) for p, t in zip(y_pred, y_true)]
    mae = sum(abs_errors) / len(abs_errors)
    mse = sum((p - t) ** 2 for p, t in zip(y_pred, y_true)) / len(y_true)
    rmse = math.sqrt(mse)

    # Directional accuracy uses price change sign vs previous observed close
    directional_total = 0
    directional_hits = 0
    for j in range(len(y_true)):
        # previous true close is the price at date j - horizon (align to series origin)
        # We can approximate by using previous element in hist aligned by dates
        # Find index of prediction date in idx_list and use previous
        try:
            dt = pd.to_datetime(dates[j])
            k = idx_list.index(dt)
            prev_true = float(hist["Close"].iloc[k - horizon]) if k - horizon >= 0 else float(hist["Close"].iloc[k])
        except Exception:
            prev_true = y_true[j]
        actual_dir = 1 if (y_true[j] - prev_true) >= 0 else -1
        pred_dir = 1 if (y_pred[j] - prev_true) >= 0 else -1
        directional_total += 1
        if actual_dir == pred_dir:
            directional_hits += 1

    directional_accuracy = directional_hits / directional_total if directional_total else 0.0

    return {
        "ticker": ticker,
        "window_days": window_days,
        "horizon": horizon,
        "metrics": {
            "directionalAccuracy": round(directional_accuracy, 4),
            "mae": round(mae, 6),
            "rmse": round(rmse, 6),
        },
        "series": {
            "dates": dates,
            "yTrue": y_true,
            "yPred": y_pred,
        },
    }


# -----------------------------
# Mock external providers endpoint
# -----------------------------
@app.get("/providers/externals/{ticker}")
def mock_external_providers(
    ticker: str,
    months: int = Query(12, ge=3, le=24)
):
    """Return mock monthly directional accuracy for external providers for demonstration.
    Deterministic by ticker to keep values stable across calls."""
    seed = sum(ord(c) for c in ticker.upper())
    rng = random.Random(seed)

    def make_provider(name: str):
        # Base between 0.45 and 0.7
        acc = 0.45 + rng.random() * 0.25
        samples = months
        return {"provider": name, "metrics": {"directionalAccuracy": round(acc, 4), "samples": samples}}

    providers = [
        make_provider("Yahoo Analysts (Mock)"),
        make_provider("WallStreetZen (Mock)"),
        make_provider("TipRanks (Mock)"),
    ]

    return {"ticker": ticker.upper(), "providers": providers}
