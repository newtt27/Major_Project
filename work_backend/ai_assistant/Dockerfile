# === BASE IMAGE ===
FROM python:3.11-slim

# === THIẾT LẬP ===
WORKDIR /app

# === CÀI HỆ THỐNG (BẮT BUỘC CHO AI) ===
# gcc, python3-dev: build torch, scikit-learn
# libpq-dev: kết nối PostgreSQL
# git: clone nếu cần
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# === CÀI PYTHON DEPENDENCIES ===
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# === COPY SOURCE CODE AI ===
COPY . .

# === TẠO THƯ MỤC MODEL (TRÁNH LỖI LOAD) ===
RUN mkdir -p models

# === EXPOSE PORT ĐÚNG (FASTAPI) ===
EXPOSE 8000

# === HEALTHCHECK (TÙY CHỌN – KHUYẾN CÁO) ===
HEALTHCHECK CMD curl --fail http://localhost:8000/ || exit 1

# === CHẠY FASTAPI VỚI UVICORN ===
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]