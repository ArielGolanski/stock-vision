# server/ml/fetch_data.py
import yfinance as yf
import pandas as pd
from datetime import datetime
import os
import time

TICKERS = ["MSFT", "AAPL", "IBM", "T"]
DATA_DIR = "data"

os.makedirs(DATA_DIR, exist_ok=True)

def fetch_with_retry(ticker, period="10y", interval="1d", retries=5, delay=10):
    for attempt in range(retries):
        df = yf.download(ticker, period=period, interval=interval)
        if not df.empty:
            print(f"✅ {ticker}: downloaded {len(df)} rows")
            df.to_csv(f"{DATA_DIR}/{ticker}.csv")
            return True
        print(f"⚠️ {ticker}: attempt {attempt+1} failed, retrying in {delay}s...")
        time.sleep(delay)
    print(f"❌ {ticker}: failed after {retries} retries")
    return False

if __name__ == "__main__":
    print(f"📅 Running data fetch at {datetime.now()}")
    for t in TICKERS:
        fetch_with_retry(t)
