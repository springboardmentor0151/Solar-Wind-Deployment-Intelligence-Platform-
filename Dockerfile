# Use official lightweight Python image
FROM python:3.11-slim

# Set system environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Set working directory
WORKDIR /app

# Install system dependencies (if any are needed, slim image is usually fine)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY app.py /app/
COPY train_models.py /app/
COPY tests/ /app/tests/

# Pre-train the machine learning models during build time so they are ready
RUN python train_models.py

# Expose Flask default port
EXPOSE 5000

# Start Flask application
CMD ["python", "app.py"]
