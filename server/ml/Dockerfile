# FastAPI ML service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system deps for scientific libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Allow choosing between full or lite requirements at build time
ARG REQUIREMENTS=requirements.txt
ENV REQUIREMENTS=${REQUIREMENTS}

# Copy requirements and install
COPY ${REQUIREMENTS} /app/requirements.txt
# Improve reliability for installs
ENV PIP_DEFAULT_TIMEOUT=300 \
    PIP_RETRIES=5 \
    PIP_NO_CACHE_DIR=1
RUN python -m pip install --upgrade pip setuptools wheel \
 && pip install --default-timeout=${PIP_DEFAULT_TIMEOUT} -r /app/requirements.txt

# Copy service code
COPY . .

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

# Default command
CMD ["uvicorn", "ml_service:app", "--host", "0.0.0.0", "--port", "8000"]
