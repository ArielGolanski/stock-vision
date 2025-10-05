# 📈 Stock Vision

Full-stack stock analysis and prediction platform with:
- **Frontend** (React + Chart.js + Dark Mode support)
- **Backend** (Node.js + Express + MongoDB)
- **ML Service** (FastAPI + TensorFlow/PyTorch + yFinance)

---

## 🚀 Features

- User authentication (JWT + email verification)
- Trending stocks (via Finnhub API)
- Stock history & predictions (via FastAPI ML service)
- Interactive charts with multiple ranges
- News & company overview tabs
- Daily auto-updated ML models via notebook training

---

## 📂 Project Structure

stock-vision/
│
├── client/ # React frontend
├── server/ # Node.js backend
│ ├── routes/ # API routes (users, stocks, stock-history)
│ └── ml/ # FastAPI ML service
│ ├── ml_models # Saved models
│ ├── notebooks # Training notebooks
│ └── requirements.txt
└── README.md


---

## ⚙️ Installation

### Clone repository

```bash
git clone https://github.com/ArielGolanski/stock-vision.git
cd stock-vision
```

## ▶ Deployment

### 1. Run server
```bash
cd server
```
Run on server folder:
```bash
npm install
npm start
```

### 2. Train model

```bash
cd ml
pip install -r requirements.txt
papermill papermill notebooks/Models_Daily_Monthly.ipynb notebooks/Models_Daily_Monthly.ipynb --force
```

### 3. Run predictions model
Run on server/ml folder:
```bash
uvicorn ml_service:app --reload --port 8000
```

### 4. Run frontend
```bash
cd..
cd..
```
Run on root folder:
```bash
npm install
npm start
```