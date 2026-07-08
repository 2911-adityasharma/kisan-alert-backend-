# ==========================================
# STAGE 1: Build the React (Vite) Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build

# Copy only dependency definitions first to leverage Docker layer caching
COPY Krishi-alert-frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source code
COPY Krishi-alert-frontend/ ./

# Compile the Vite static files to dist/
RUN npm run build


# ==========================================
# STAGE 2: Build the FastAPI Backend & Serve
# ==========================================
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies if required for Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first to leverage Docker caching
COPY kisan-alert-backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source files
COPY kisan-alert-backend/ ./

# Copy built frontend assets from Stage 1 into the backend's static directory.
# The Docker build context must be the repo root to span both folders.
COPY --from=frontend-builder /build/dist/ /app/static/

# Create uploads directory for scanned crop photos at runtime
RUN mkdir -p /app/static/uploads

# Railway injects the port dynamically at runtime using the $PORT environment variable.
# We bind to host 0.0.0.0 and port $PORT using the shell form of CMD so the variable expands.
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
