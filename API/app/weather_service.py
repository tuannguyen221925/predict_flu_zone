"""
weather_service.py
Gọi OpenWeatherMap để lấy thời tiết hiện tại theo vùng.
"""
import logging

import requests

from API.app.config import WEATHER_API_KEY, WEATHER_BASE_URL, ZONE_COORDINATES

logger = logging.getLogger(__name__)


def get_weather_realtime(zone_name: str) -> dict | None:
    """Lấy dữ liệu thời tiết hiện tại từ OpenWeatherMap cho một vùng."""
    if zone_name not in ZONE_COORDINATES:
        raise ValueError(f"Zone '{zone_name}' chưa có tọa độ trong hệ thống")

    coords = ZONE_COORDINATES[zone_name]
    params = {
        "lat": coords["lat"],
        "lon": coords["lon"],
        "appid": WEATHER_API_KEY,
        "units": "metric",
    }

    try:
        response = requests.get(WEATHER_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "weather": data["weather"][0]["description"],
            "wind_speed": data["wind"]["speed"],
            "precipitation": data.get("rain", {}).get("1h", 0),
        }
    except Exception as e:
        logger.error("Lỗi gọi API thời tiết: %s", e)
        return None


def get_latest_lags(zone_name: str) -> dict:
    """Lấy lag1, lag2, lag3, ma4 từ lịch sử dự báo của một vùng."""
    from API.app.state import state

    last_records = list(
        state.history_collection.find({"zone_name": zone_name})
        .sort("timestamp", -1)
        .limit(4)
    )

    cases = [doc.get("predicted_cases", 0) for doc in last_records]
    while len(cases) < 4:
        cases.insert(0, 0)

    lag1, lag2, lag3, lag4 = cases[0], cases[1], cases[2], cases[3]
    ma4 = (lag1 + lag2 + lag3 + lag4) / 4

    return {"lag1": lag1, "lag2": lag2, "lag3": lag3, "ma4": ma4}
