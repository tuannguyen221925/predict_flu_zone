"""
main.py
Entry point FastAPI — khởi tạo app, nạp model/DB lúc startup, gắn các router.
"""
import logging

from fastapi import FastAPI

from app.database import init_db
from app.ml import load_ml_artifacts
from app.routers.history import router as history_router
from app.routers.predictions import router as predictions_router
from app.routers.weather_log import router as weather_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Hệ thống Dự báo Sốt xuất huyết & Big Data MongoDB")


@app.on_event("startup")
def on_startup():
    try:
        load_ml_artifacts()
    except Exception as e:
        logger.critical("❌ Lỗi nạp mô hình ML: %s", e)
        raise

    try:
        init_db()
    except Exception as e:
        logger.warning("⚠️ Lỗi kết nối MongoDB: %s", e)


app.include_router(predictions_router)
app.include_router(weather_router)
app.include_router(history_router)


@app.get("/")
def read_root():
    return {
        "message": "Dengue Prediction & MongoDB BigData API is running smoothly!",
        "endpoints": {
            "/predict-zone": "POST - Dự báo thủ công",
            "/predict-realtime": "POST - Dự báo tự động real-time",
            "/log-weather": "POST - Log thời tiết",
            "/get-history/{zone_name}": "GET - Lấy 20 dự báo gần nhất",
            "/get-history-by-date/{zone_name}": "GET - Lọc lịch sử theo ngày",
            "/dashboard-stats": "GET - Thống kê Dashboard",
        },
    }
