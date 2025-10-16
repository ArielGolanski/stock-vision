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

### Docker Deployment (Recommended)

This project uses Docker Compose to run all services:
- frontend (React built and served by Nginx)
- backend (Node/Express)
- ml (FastAPI/Uvicorn)
- mongo (MongoDB)

#### 1) Fast build (lite ML, no training) and start all services
```bash
docker-compose up -d --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- ML Service: `http://localhost:8000`
- MongoDB: `mongodb://localhost:27017`

Environment variables (preconfigured in compose):
- `REACT_APP_API_URL=http://localhost:5000`
- `REACT_APP_ML_URL=http://localhost:8000`
- `CONNECTION_STRING=mongodb://mongo:27017/stockvision`

#### 2) View logs
```bash
docker-compose logs -f backend
# or
docker-compose logs -f ml
```

#### 3) Stop all services
```bash
docker-compose down
```

#### Troubleshooting
- The default compose uses a lite ML image (no tensorflow/torch) for faster builds. This lets you run the four containers quickly.
- To switch to full ML dependencies later, build ml with the full requirements:
  ```bash
  docker-compose build --build-arg REQUIREMENTS=requirements.txt ml
  docker-compose up -d
  ```
- If you hit network timeouts during ML build, try:
  ```bash
  docker-compose build --no-cache ml
  ```
  or build on a faster network once.
- On first run, MongoDB data is created in the `mongo_data` volume. To reset:
  ```bash
  docker-compose down -v
  ```
- Verify services are listening:
  ```bash
  curl http://localhost:5000/
  curl http://localhost:8000/
  ```

### Manual (non-Docker)
See sections below for running server, ML, and frontend individually.