"""
database.py
Khởi tạo kết nối MongoDB và gán vào state dùng chung.
"""
import logging

from pymongo import MongoClient

from API.app.config import MONGO_DB_NAME, MONGO_URI
from API.app.state import state

logger = logging.getLogger(__name__)


def init_db():
    """Kết nối MongoDB và gán các collection vào state."""
    state.mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    state.db = state.mongo_client[MONGO_DB_NAME]
    state.history_collection = state.db["prediction_history"]
    state.weather_logs_collection = state.db["weather_logs_realtime"]

    # Ping thử để chắc chắn kết nối thành công (raise nếu không kết nối được)
    state.mongo_client.admin.command("ping")
    logger.info("✅ Đã kết nối thành công tới MongoDB (%s)", MONGO_DB_NAME)
