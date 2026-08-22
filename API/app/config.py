"""
config.py
Tất cả cấu hình đọc từ biến môi trường (.env) — không hardcode secret/path cá nhân.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── MongoDB ──────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "dengue_bigdata_db")

# ── OpenWeatherMap ───────────────────────────────────────────────────────────
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# ── ML Model paths ───────────────────────────────────────────────────────────
MODELS_DIR = os.getenv("MODELS_DIR", "./models")
MODEL_PATH = os.path.join(MODELS_DIR, "best_mlp_model.pkl")
SCALER_X_PATH = os.path.join(MODELS_DIR, "scaler_X.pkl")
SCALER_Y_PATH = os.path.join(MODELS_DIR, "scaler_y.pkl")

# ── Toạ độ các tỉnh/thành Việt Nam ───────────────────────────────────────────
ZONE_COORDINATES = {
    # Miền Bắc
    "Hanoi": {"lat": 21.0285, "lon": 105.8542},
    "Haiphong": {"lat": 20.8449, "lon": 106.6881},
    "ThaiBinh": {"lat": 20.4474, "lon": 106.3387},

    # Miền Trung
    "DaNang": {"lat": 16.0544, "lon": 108.2022},
    "Hue": {"lat": 16.4637, "lon": 107.5909},
    "NhaTrang": {"lat": 12.2388, "lon": 109.1967},
    "BinhDinh": {"lat": 13.7627, "lon": 109.2223},

    # Miền Nam (Trọng điểm)
    "HCM": {"lat": 10.8231, "lon": 106.6297},
    "CanTho": {"lat": 10.0452, "lon": 105.7469},
    "BinhDuong": {"lat": 11.0283, "lon": 106.6713},
    "DongNai": {"lat": 10.9468, "lon": 106.8521},
    "VungTau": {"lat": 10.3460, "lon": 107.0843},
    "TienGiang": {"lat": 10.3592, "lon": 106.3570},
}

# ── Thứ tự cột đầu vào mô hình ───────────────────────────────────────────────
ORDERED_COLUMNS = [
    "avg_temp_max", "avg_temp_med", "sum_precip_tot", "avg_humid",
    "dengue_trends", "symptoms_trends", "lag1", "lag2", "lag3", "ma4",
]
