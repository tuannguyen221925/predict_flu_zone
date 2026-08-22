"""
routers/weather_log.py
Endpoint ghi log thời tiết real-time (/log-weather).
"""
from datetime import datetime

from fastapi import APIRouter, HTTPException

from API.app.schemas import WeatherLogRequest
from API.app.state import state

router = APIRouter(tags=["Weather"])


@router.post("/log-weather")
def log_weather(data: WeatherLogRequest):
    try:
        weather_document = {
            "zone_name": data.zone_name,
            "captured_at": datetime.now(),
            "temperature": data.temperature,
            "humidity": data.humidity,
            "precipitation": data.precipitation,
            "wind_speed": data.wind_speed,
        }
        state.weather_logs_collection.insert_one(weather_document)
        return {
            "status": "success",
            "message": f"Đã lưu log thời tiết real-time cho vùng {data.zone_name}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu trữ log: {str(e)}")
