"""
routers/predictions.py
Endpoint dự báo: thủ công (/predict-zone) và tự động real-time (/predict-realtime).
"""
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException

from API.app.ml import run_inference
from API.app.schemas import AutoPredictRequest, PredictionRequest
from API.app.state import state
from API.app.weather_service import get_latest_lags, get_weather_realtime

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Predictions"])


def _predict_and_save(data: PredictionRequest) -> dict:
    """Chạy inference, lưu log vào MongoDB, trả về kết quả."""
    predicted_cases = run_inference(data.dict())

    prediction_document = {
        "zone_name": data.zone_name,
        "timestamp": datetime.now(),
        "weather_input": {
            "avg_temp_max": data.avg_temp_max,
            "avg_temp_med": data.avg_temp_med,
            "sum_precip_tot": data.sum_precip_tot,
            "avg_humid": data.avg_humid,
        },
        "trends_input": {
            "dengue_trends": data.dengue_trends,
            "symptoms_trends": data.symptoms_trends,
        },
        "historical_lag": {
            "lag1": data.lag1,
            "lag2": data.lag2,
            "lag3": data.lag3,
            "ma4": data.ma4,
        },
        "predicted_cases": predicted_cases,
        "model_used": "MLP_Neural_Network",
    }

    state.history_collection.insert_one(prediction_document)

    return {
        "status": "success",
        "message": "Dự báo thành công và đã lưu log vào MongoDB",
        "data": {"zone": data.zone_name, "predicted_cases": predicted_cases},
    }


@router.post("/predict-zone")
def predict_zone(data: PredictionRequest):
    """Dự báo thủ công — người dùng tự nhập đầy đủ các thông số đầu vào."""
    try:
        return _predict_and_save(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")


@router.post("/predict-realtime")
def predict_realtime(data: AutoPredictRequest):
    """
    Dự báo tự động hoàn toàn:
    - Tự động lấy thời tiết real-time từ OpenWeatherMap
    - Tự động tính lag từ lịch sử dự báo trong MongoDB
    - Chỉ cần truyền zone_name, hệ thống tự xử lý hết!
    """
    try:
        zone = data.zone_name

        weather = get_weather_realtime(zone)
        if weather is None:
            raise HTTPException(
                status_code=503,
                detail=f"Không thể lấy dữ liệu thời tiết cho vùng {zone}. "
                       f"Vui lòng kiểm tra API Key OpenWeatherMap.",
            )

        lags = get_latest_lags(zone)
        dengue_trends = data.dengue_trends if data.dengue_trends else 50
        symptoms_trends = data.symptoms_trends if data.symptoms_trends else 20

        prediction_payload = PredictionRequest(
            zone_name=zone,
            avg_temp_max=weather["temperature"] + 2,
            avg_temp_med=weather["temperature"],
            sum_precip_tot=weather["precipitation"] * 24,
            avg_humid=weather["humidity"],
            dengue_trends=dengue_trends,
            symptoms_trends=symptoms_trends,
            lag1=lags["lag1"],
            lag2=lags["lag2"],
            lag3=lags["lag3"],
            ma4=lags["ma4"],
        )

        result = _predict_and_save(prediction_payload)

        return {
            "status": "success",
            "message": "Dự báo real-time thành công!",
            "zone": zone,
            "weather_data": weather,
            "lags_used": lags,
            "prediction": result["data"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi dự báo real-time: {str(e)}")
