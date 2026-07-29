# Dengue Fever Prediction & Big Data Forecasting System

Hệ thống dự báo số ca mắc sốt xuất huyết theo tuần, kết hợp pipeline Big Data (Apache Spark) để xử lý dữ liệu dịch tễ - khí hậu - Google Trends, với mô hình Machine Learning/Deep Learning và một REST API tự động lấy dữ liệu thời tiết real-time để dự báo theo từng vùng.

## 🚀 Tính năng chính

- **Data Pipeline (Apache Spark):** Xử lý và gộp 3 nguồn dữ liệu (ca bệnh, thời tiết, Google Trends) theo kiến trúc Medallion (Silver/Gold), tổng hợp theo tuần dịch tễ.
- **Feature Engineering:** Sinh đặc trưng chuỗi thời gian — lag 1-3 tuần và trung bình động 4 tuần (ma4) — kết hợp tín hiệu khí hậu và xu hướng tìm kiếm.
- **So sánh đa mô hình:** Huấn luyện và đánh giá 4 mô hình (Random Forest, XGBoost, MLP, Deep LSTM), chọn mô hình tốt nhất dựa trên RMSE và R².
- **Kiểm định mô hình:** Kiểm tra hiện tượng dự báo trễ (Lag Effect) và phân tích tự tương quan residual (ACF) để xác minh mô hình học đặc trưng thực sự.
- **Dự báo Real-time:** Tích hợp OpenWeatherMap API để tự động lấy thời tiết hiện tại theo vùng, tự tính lag features từ lịch sử, và trả về dự báo chỉ với một request.
- **Lưu trữ lịch sử:** Ghi lại toàn bộ lịch sử dự báo và log thời tiết vào MongoDB, phục vụ truy vấn và thống kê.

## 📊 Kết quả mô hình

| Mô hình | RMSE | R² |
|---|---|---|
| Random Forest | 683.16 | 95.66% |
| XGBoost | 588.04 | 96.79% |
| **MLP Network (được chọn)** | **156.89** | **99.77%** |
| Deep LSTM | 1013.28 | 90.46% |

MLP được chọn làm mô hình cuối cùng vì đạt sai số thấp nhất và độ chính xác cao nhất, đồng thời vượt qua kiểm tra Lag Effect (không chỉ đơn thuần lặp lại giá trị tuần trước).

## 🛠 Công nghệ sử dụng

- **Big Data / Data Engineering:** Apache Spark (PySpark), pandas
- **Machine Learning / Deep Learning:** scikit-learn, XGBoost, TensorFlow/Keras (LSTM)
- **Backend:** FastAPI, Uvicorn
- **Database:** MongoDB (pymongo)
- **External API:** OpenWeatherMap
- **Khác:** Joblib (lưu model & scaler)

## 📋 Cấu trúc dự án

```
predict_zone_flu/
├── data/                   # Dữ liệu thô: dengue, weather, Google Trends
├── data_science.ipynb      # Notebook xử lý dữ liệu (Spark) & huấn luyện mô hình
├── models/                 # Model MLP đã huấn luyện (.pkl) và scaler
├── API/
│   └── main.py             # FastAPI service phục vụ dự báo real-time
└── README.md
```

## ⚙️ Hướng dẫn cài đặt & chạy

1. **Cài đặt thư viện:**
   ```bash
   pip install fastapi uvicorn pymongo joblib numpy requests pydantic scikit-learn xgboost tensorflow pyspark
   ```

2. **Cấu hình MongoDB:** đảm bảo MongoDB đang chạy tại `localhost:27017`, database `dengue_bigdata_db`.

3. **Chạy API:**
   ```bash
   uvicorn main:app --reload
   ```

4. **Kiểm tra API:** truy cập `http://localhost:8000/docs` để xem tài liệu Swagger và test trực tiếp các endpoint.

## 🎯 Các endpoint chính

| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/predict-zone` | Dự báo thủ công, người dùng tự nhập các thông số đầu vào |
| `POST` | `/predict-realtime` | Dự báo tự động — chỉ cần truyền tên vùng, hệ thống tự lấy thời tiết & tính lag |
| `POST` | `/log-weather` | Ghi log thời tiết real-time cho một vùng |
| `GET` | `/get-history/{zone_name}` | Lấy 20 dự báo gần nhất của một vùng |
| `GET` | `/get-history-by-date/{zone_name}` | Lọc lịch sử dự báo theo khoảng ngày |
| `GET` | `/dashboard-stats` | Thống kê tổng quan toàn hệ thống |

## 📝 Ghi chú

- Dữ liệu huấn luyện gồm dữ liệu dịch tễ và khí hậu Brazil (nguồn công khai) kết hợp dữ liệu khí hậu Việt Nam, phục vụ mở rộng mô hình sang các tỉnh/thành trong nước.
- Model MLP và scaler cần được đặt đúng thư mục `models/` để API có thể nạp và chạy dự báo.
