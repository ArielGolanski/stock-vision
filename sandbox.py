import yfinance as yf

stock = yf.Ticker("MSFT")
hist = stock.history(period="5d", interval="1d")
for idx, row in hist.iterrows():
    print(idx, row["Close"])