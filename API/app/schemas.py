"""
schemas.py
Các Pydantic schema định nghĩa cấu trúc request/response của API.
"""
from typing import Optional

from pydantic import BaseModel


class PredictionRequest(BaseModel):
    zone_name: str
    avg_temp_max: float
    avg_temp_med: float
    sum_precip_tot: float
    avg_humid: float
    dengue_trends: int = 50
    symptoms_trends: int = 20
    lag1: float
    lag2: float
    lag3: float
    ma4: float


class WeatherLogRequest(BaseModel):
    zone_name: str
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float


class AutoPredictRequest(BaseModel):
    zone_name: str
    # Optional: có thể truyền thủ công nếu muốn
    dengue_trends: Optional[int] = 50
    symptoms_trends: Optional[int] = 20
