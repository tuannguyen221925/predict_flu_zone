from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import os
from datetime import datetime, timedelta
from typing import Optional
import requests

# KHÔNG DÙNG MOTOR ĐỂ TRÁNH LỖI SSL WINDOWS, DÙNG PYMONGO CHUẨN
from pymongo import MongoClient 

# 1. Khởi tạo ứng dụng FastAPI
app = FastAPI(title="Hệ thống Dự báo Sốt xuất huyết & Big Data MongoDB")

# 2. CẤU HÌNH KẾT NỐI MONGODB
try:
    client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    db = client["dengue_bigdata_db"]
    history_collection = db["prediction_history"]
    weather_logs_collection = db["weather_logs_realtime"]
    print("✅ Đã kết nối thành công tới MongoDB!")
except Exception as e:
    print(f"⚠️ Lỗi kết nối MongoDB: {e}")

# 3. CẤU HÌNH API THỜI TIẾT (OpenWeatherMap)
WEATHER_API_KEY = "862e70d3da664d7d00121f16524c1e66" 
WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# Tọa độ các tỉnh/thành Việt Nam
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
    "TienGiang": {"lat": 10.3592, "lon": 106.3570}
}

# 4. NẠP MÔ HÌNH MLP & SCALER
MODELS_DIR = r"E:\predict_zone_flu\models"
scaler_y = None

try:
    mlp_model = joblib.load(os.path.join(MODELS_DIR, "best_mlp_model.pkl"))
    scaler_X = joblib.load(os.path.join(MODELS_DIR, "scaler_X.pkl"))
    
    if os.path.exists(os.path.join(MODELS_DIR, "scaler_y.pkl")):
        scaler_y = joblib.load(os.path.join(MODELS_DIR, "scaler_y.pkl"))
        print(" Đã nạp thành công model, scaler_X và scaler_y!")
    else:
        print(" Đã nạp thành công model và scaler_X (Không tìm thấy scaler_y).")
except Exception as e:
    print(f" Lỗi nạp mô hình: {e}")

# ============================================
# 5. ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU (Pydantic Schemas)
# ============================================
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

# 6. HÀM TIỆN ÍCH
ORDERED_COLUMNS = [
    'avg_temp_max', 'avg_temp_med', 'sum_precip_tot', 'avg_humid',
    'dengue_trends', 'symptoms_trends', 'lag1', 'lag2', 'lag3', 'ma4'
]

def get_weather_realtime(zone_name: str):
    """Lấy dữ liệu thời tiết hiện tại từ OpenWeatherMap"""
    if zone_name not in ZONE_COORDINATES:
        raise ValueError(f"Zone '{zone_name}' chưa có tọa độ trong hệ thống")
    
    coords = ZONE_COORDINATES[zone_name]
    params = {
        "lat": coords["lat"],
        "lon": coords["lon"],
        "appid": WEATHER_API_KEY,
        "units": "metric"
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
            "precipitation": data.get("rain", {}).get("1h", 0)
        }
    except Exception as e:
        print(f" Lỗi gọi API thời tiết: {e}")
        return None

def get_latest_lags(zone_name: str):
    """Lấy lag1, lag2, lag3, ma4 từ lịch sử dự báo của zone"""
    last_records = list(history_collection.find(
        {"zone_name": zone_name}
    ).sort("timestamp", -1).limit(4))
    
    cases = [doc.get("predicted_cases", 0) for doc in last_records]
    
    while len(cases) < 4:
        cases.insert(0, 0)
    
    lag1 = cases[0] if len(cases) >= 1 else 0
    lag2 = cases[1] if len(cases) >= 2 else 0
    lag3 = cases[2] if len(cases) >= 3 else 0
    ma4 = (cases[0] + cases[1] + cases[2] + cases[3]) / 4 if len(cases) >= 4 else 0
    
    return {"lag1": lag1, "lag2": lag2, "lag3": lag3, "ma4": ma4}

# 7. ENDPOINT DỰ BÁO THỦ CÔNG
@app.post("/predict-zone")
def predict_zone(data: PredictionRequest):
    try:
        data_dict = data.dict()
        input_values = [data_dict[col] for col in ORDERED_COLUMNS]
        input_data = np.array([input_values])
        
        input_scaled = scaler_X.transform(input_data)
        prediction_scaled = mlp_model.predict(input_scaled)
        
        if 'scaler_y' in globals() and scaler_y is not None:
            prediction_real = scaler_y.inverse_transform(prediction_scaled.reshape(-1, 1))
            predicted_cases = max(0, int(round(prediction_real[0][0])))
        else:
            predicted_cases = max(0, int(round(prediction_scaled[0])))
        
        prediction_document = {
            "zone_name": data.zone_name,
            "timestamp": datetime.now(),
            "weather_input": {
                "avg_temp_max": data.avg_temp_max,
                "avg_temp_med": data.avg_temp_med,
                "sum_precip_tot": data.sum_precip_tot,
                "avg_humid": data.avg_humid
            },
            "trends_input": {
                "dengue_trends": data.dengue_trends,
                "symptoms_trends": data.symptoms_trends
            },
            "historical_lag": {
                "lag1": data.lag1,
                "lag2": data.lag2,
                "lag3": data.lag3,
                "ma4": data.ma4
            },
            "predicted_cases": predicted_cases,
            "model_used": "MLP_Neural_Network"
        }
        
        history_collection.insert_one(prediction_document)
        
        return {
            "status": "success",
            "message": "Dự báo thành công và đã lưu log vào MongoDB",
            "data": {
                "zone": data.zone_name,
                "predicted_cases": predicted_cases
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

# 8. ENDPOINT DỰ BÁO REAL-TIME (TỰ ĐỘNG HOÀN TOÀN)
@app.post("/predict-realtime")
def predict_realtime(data: AutoPredictRequest):
    """
    ENDPOINT THÔNG MINH: 
    - Tự động lấy thời tiết real-time từ OpenWeatherMap
    - Tự động tính lag từ lịch sử dự báo trong MongoDB
    - Tự động dự báo số ca sốt xuất huyết
    
    Chỉ cần truyền zone_name, hệ thống tự xử lý hết!
    """
    try:
        zone = data.zone_name
        
        # 1. Lấy thời tiết real-time
        weather = get_weather_realtime(zone)
        if weather is None:
            raise HTTPException(
                status_code=503,
                detail=f"Không thể lấy dữ liệu thời tiết cho vùng {zone}. Vui lòng kiểm tra API Key OpenWeatherMap."
            )
        
        # 2. Lấy lag từ lịch sử dự báo
        lags = get_latest_lags(zone)
        
        # 3. Lấy trends (có thể dùng giá trị mặc định hoặc từ request)
        dengue_trends = data.dengue_trends if data.dengue_trends else 50
        symptoms_trends = data.symptoms_trends if data.symptoms_trends else 20
        
        # 4. Tạo payload gọi endpoint predict_zone
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
            ma4=lags["ma4"]
        )
        
        # 5. Gọi hàm dự báo
        result = predict_zone(prediction_payload)
        
        # 6. Trả về kết quả kèm thông tin chi tiết
        return {
            "status": "success",
            "message": "Dự báo real-time thành công!",
            "zone": zone,
            "weather_data": weather,
            "lags_used": lags,
            "prediction": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi dự báo real-time: {str(e)}")


# 9. ENDPOINT LOG THỜI TIẾT
@app.post("/log-weather")
def log_weather(data: WeatherLogRequest):
    try:
        weather_document = {
            "zone_name": data.zone_name,
            "captured_at": datetime.now(),
            "temperature": data.temperature,
            "humidity": data.humidity,
            "precipitation": data.precipitation,
            "wind_speed": data.wind_speed
        }
        weather_logs_collection.insert_one(weather_document)
        return {"status": "success", "message": f"Đã lưu log thời tiết real-time cho vùng {data.zone_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu trữ log: {str(e)}")

# 10. ENDPOINT LẤY LỊCH SỬ
@app.get("/get-history/{zone_name}")
def get_history(zone_name: str):
    try:
        cursor = history_collection.find({"zone_name": zone_name}).sort("timestamp", -1).limit(20)
        history = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            history.append(doc)
        return {"zone": zone_name, "total_records": len(history), "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy xuất lịch sử: {str(e)}")

@app.get("/get-history-by-date/{zone_name}")
def get_history_by_date(
    zone_name: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50
):
    try:
        if end_date is None:
            end_date = datetime.now().strftime("%Y-%m-%d")
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        
        cursor = history_collection.find({
            "zone_name": zone_name,
            "timestamp": {"$gte": start_dt, "$lt": end_dt}
        }).sort("timestamp", -1).limit(limit)
        
        history = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "timestamp" in doc:
                doc["timestamp"] = doc["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
            history.append(doc)
        
        return {
            "zone": zone_name,
            "period": {"start_date": start_date, "end_date": end_date},
            "total_records": len(history),
            "history": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy xuất lịch sử: {str(e)}")

# 11. ENDPOINT DASHBOARD STATS
@app.get("/dashboard-stats")
def get_dashboard_stats():
    try:
        total_predictions = history_collection.count_documents({})
        zones = history_collection.distinct("zone_name")
        
        latest_per_zone = []
        for zone in zones:
            latest = history_collection.find_one(
                {"zone_name": zone},
                sort=[("timestamp", -1)]
            )
            if latest:
                latest["_id"] = str(latest["_id"])
                if "timestamp" in latest:
                    latest["timestamp"] = latest["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
                latest_per_zone.append(latest)
        
        return {
            "total_predictions": total_predictions,
            "total_zones": len(zones),
            "zones": zones,
            "latest_predictions": latest_per_zone
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy thống kê: {str(e)}")

# 12. ROOT ENDPOINT
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
            "/dashboard-stats": "GET - Thống kê Dashboard"
        }
    }