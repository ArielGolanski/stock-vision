# server/ml/model_utils.py
import os
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
import yfinance as yf
from keras.models import Sequential
from keras.layers import Dense, LSTM, Dropout
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime

def load_enhanced_data(ticker, start_date="2015-01-01"):
    """Load stock data and compute enhanced features."""
    end = datetime.now()
    df = yf.download(ticker, start=start_date, end=end)

    # If no data returned
    if df is None or df.empty:
        return pd.DataFrame()

    # Basic OHLCV features
    df['Daily Change %'] = df['Close'].pct_change() * 100
    df['Volume Change %'] = df['Volume'].pct_change() * 100

    # Technical indicators
    df['SMA_10'] = df['Close'].rolling(window=10).mean()
    df['SMA_30'] = df['Close'].rolling(window=30).mean()
    df['EMA_12'] = df['Close'].ewm(span=12).mean()
    df['EMA_26'] = df['Close'].ewm(span=26).mean()

    # Price-based features
    df['High_Low_Pct'] = ((df['High'] - df['Low']) / df['Close']) * 100
    df['Open_Close_Pct'] = ((df['Close'] - df['Open']) / df['Open']) * 100

    # Volatility
    df['Volatility'] = df['Daily Change %'].rolling(window=20).std()

    # MACD
    df['MACD'] = df['EMA_12'] - df['EMA_26']
    df['MACD_Signal'] = df['MACD'].ewm(span=9).mean()
    df['MACD_Histogram'] = df['MACD'] - df['MACD_Signal']

    # RSI
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # Monthly change %
    df['Monthly Change %'] = df['Close'].pct_change(periods=21) * 100

    # Fetch Reddit sentiment once per ticker
    print(f"Fetching Reddit sentiment for {ticker}...")
    try:
        from fetch_news import fetch_reddit_sentiment
        reddit_sentiment = fetch_reddit_sentiment(ticker)
        sentiment_score = reddit_sentiment["average_sentiment"]
        print(f"Reddit sentiment score for: {ticker} is {sentiment_score}")
    except Exception as e:
        print(f"Error fetching Reddit sentiment for {ticker}: {e}")
        sentiment_score = 0
    
    df["Reddit Sentiment"] = sentiment_score

    df = df.dropna().reset_index()
    return df

def prepare_features(df, target_column):
    """Return features array, target array and feature names."""
    feature_columns = [
        'Daily Change %', 'Volume Change %', 'High_Low_Pct', 'Open_Close_Pct',
        'Volatility', 'MACD', 'MACD_Signal', 'MACD_Histogram', 'RSI', 'Reddit Sentiment'
    ]
    if target_column != 'Monthly Change %':
        feature_columns.append('Monthly Change %')

    features = df[feature_columns].values
    target = df[[target_column]].values
    return features, target, feature_columns

class EnhancedLSTMPredictor:
    def __init__(self, sample_size=60, lstm_units=[128, 64], dropout_rate=0.2):
        self.sample_size = sample_size
        self.lstm_units = lstm_units
        self.dropout_rate = dropout_rate
        self.feature_scaler = MinMaxScaler(feature_range=(0, 1))
        self.target_scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = None

    def build_model(self, n_features):
        self.model = Sequential([
            LSTM(self.lstm_units[0], return_sequences=True, input_shape=(self.sample_size, n_features)),
            Dropout(self.dropout_rate),
            LSTM(self.lstm_units[1], return_sequences=False),
            Dropout(self.dropout_rate),
            Dense(50, activation='relu'),
            Dropout(self.dropout_rate),
            Dense(25, activation='relu'),
            Dense(1, activation='linear')
        ])
        self.model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mae'])
        return self.model

    def prepare_data(self, features, target):
        scaled_features = self.feature_scaler.fit_transform(features)
        scaled_target = self.target_scaler.fit_transform(target)
        training_len = int(np.ceil(len(scaled_features) * 0.8))

        x_train, y_train = self._create_sequences(scaled_features[:training_len], scaled_target[:training_len])
        x_test, y_test = self._create_sequences(scaled_features[training_len - self.sample_size:], scaled_target[training_len - self.sample_size:])

        y_test_actual = target[training_len:]
        return (x_train, y_train), (x_test, y_test), y_test_actual, training_len

    def _create_sequences(self, features, target):
        x, y = [], []
        for i in range(self.sample_size, len(features)):
            x.append(features[i-self.sample_size:i])
            y.append(target[i, 0])
        return np.array(x), np.array(y)

    def train(self, x_train, y_train, epochs=20, batch_size=32, validation_split=0.1, verbose=1):
        return self.model.fit(x_train, y_train, batch_size=batch_size, epochs=epochs, validation_split=validation_split, verbose=verbose)

    def predict(self, x_test):
        pred_scaled = self.model.predict(x_test, verbose=0)
        dummy = np.zeros((len(pred_scaled), 1))
        dummy[:, 0] = pred_scaled[:, 0]
        return self.target_scaler.inverse_transform(dummy)[:, 0]

    def forecast_future(self, df, features, target_column, n_days=5):
        # Prepare last sequence
        last_features = self.feature_scaler.transform(features[-self.sample_size:])
        last_sequence = last_features.reshape(1, self.sample_size, -1)

        future_predictions, future_prices = [], []
        current_price = df['Close'].iloc[-1]

        for _ in range(n_days):
            next_pred_scaled = self.model.predict(last_sequence, verbose=0)
            dummy = np.zeros((1, 1))
            dummy[0, 0] = next_pred_scaled[0, 0]
            next_change = self.target_scaler.inverse_transform(dummy)[0, 0]
            future_predictions.append(float(next_change))

            if target_column == 'Daily Change %':
                current_price *= (1 + next_change / 100.0)
            else:
                daily_change = next_change / 21.0
                current_price *= (1 + daily_change / 100.0)
            future_prices.append(float(current_price))

            last_sequence = np.roll(last_sequence, -1, axis=1)
            last_sequence[0, -1, 0] = next_pred_scaled[0, 0]

        return future_predictions, future_prices

    def save(self, model_path="model", prefix="daily"):
        # ensure folder exists
        folder = os.path.dirname(model_path)
        if folder and not os.path.exists(folder):
            os.makedirs(folder, exist_ok=True)
        # save model and scalers
        self.model.save(f"{model_path}_{prefix}.keras")
        joblib.dump(self.feature_scaler, f"{model_path}_{prefix}_feature_scaler.pkl")
        joblib.dump(self.target_scaler, f"{model_path}_{prefix}_target_scaler.pkl")

    def load(self, model_path="model", prefix="daily"):
        self.model = tf.keras.models.load_model(f"{model_path}_{prefix}.keras")
        self.feature_scaler = joblib.load(f"{model_path}_{prefix}_feature_scaler.pkl")
        self.target_scaler = joblib.load(f"{model_path}_{prefix}_target_scaler.pkl")
