Chào Tuấn, một file `README.md` chuyên nghiệp không chỉ giúp người khác hiểu dự án của bạn mà còn là "bộ mặt" của đồ án khi bạn trình bày với giảng viên.

Dưới đây là mẫu `README.md` chuẩn cho dự án **Dự báo Sốt xuất huyết** của bạn. Bạn chỉ cần copy nội dung này vào file `README.md` ở thư mục gốc của dự án.

---

# Dengue Fever Prediction & Big Data Management System

Hệ thống dự báo sốt xuất huyết sử dụng trí tuệ nhân tạo (MLP Neural Network) kết hợp với kiến trúc Big Data (MongoDB) để lưu trữ log thời tiết và lịch sử dự báo thời gian thực.

## 🚀 Các tính năng chính

* **Dự báo thông minh**: Tích hợp mô hình học máy MLP để dự báo số ca mắc bệnh dựa trên các biến thời tiết và xu hướng tìm kiếm Google.
* **Tự động hóa Real-time**: Kết nối với OpenWeatherMap API để lấy dữ liệu thời tiết hiện tại mà không cần nhập liệu thủ công.
* **Big Data Storage**: Lưu trữ lịch sử dự báo dưới dạng Nested JSON trên MongoDB, hỗ trợ truy vấn thống kê nhanh chóng.
* **Dashboard hỗ trợ**: Các endpoint API cho phép trích xuất dữ liệu lịch sử và thống kê theo từng vùng (Zone).

## 🛠 Công nghệ sử dụng

* **Backend**: FastAPI (Python)
* **AI/ML**: Scikit-learn (MinMaxScaler, MLPRegressor), Joblib
* **Database**: MongoDB (với Pymongo)
* **Weather API**: OpenWeatherMap
* **Deployment**: Uvicorn

## 📋 Cấu trúc dự án

```text
├── E:/predict_zone_flu/
│   ├── models/            # Chứa các file .pkl (Model & Scaler)
│   ├── API/
│   │   └── main.py        # File chính chứa toàn bộ logic API
│   └── data_science.ipynb # Notebook huấn luyện mô hình

```

## ⚙️ Hướng dẫn cài đặt & Chạy dự án

1. **Cài đặt thư viện**:
```bash
pip install fastapi uvicorn pymongo joblib numpy requests pydantic

```


2. **Cấu hình MongoDB**:
Đảm bảo MongoDB đang chạy tại `localhost:27017` và database là `dengue_bigdata_db`.
3. **Chạy API**:
```bash
uvicorn main:app --reload

```


4. **Kiểm tra API**:
Truy cập `http://localhost:8000/docs` để xem tài liệu Swagger và test các endpoint trực tiếp trên trình duyệt.

## 🎯 Các Endpoint chính

| Phương thức | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/predict-zone` | Dự báo thủ công bằng cách nhập thông số |
| `POST` | `/predict-realtime` | Dự báo tự động theo vùng (Tự lấy thời tiết & tính lag) |
| `GET` | `/get-history/{zone}` | Lấy lịch sử 20 lần dự báo gần nhất |
| `GET` | `/dashboard-stats` | Xem thống kê toàn hệ thống |

## 💡 Lưu ý cho người phát triển

* Dự án sử dụng `scaler_X` và `scaler_y` để đảm bảo kết quả dự báo chính xác, hãy chắc chắn đặt chúng trong thư mục `E:\predict_zone_flu\models`.
* Các tọa độ tỉnh thành được cấu hình trong biến `ZONE_COORDINATES` tại `main.py`, bạn có thể thêm mới dễ dàng.

---

*Dự án đồ án môn học - Hệ thống hỗ trợ ra quyết định.*

---

### Mẹo cho Tuấn:

* **Ảnh chụp màn hình**: Sau khi làm giao diện xong, bạn nên chụp 1 tấm hình Dashboard của bạn và chèn vào trên cùng của file README này (dùng cú pháp `![Alt text](path/to/image.png)`). Giảng viên nhìn thấy hình ảnh sẽ ấn tượng hơn nhiều!
* **Ghi chú**: Nếu bạn đưa dự án lên GitHub, file README này sẽ là thứ người ta đọc đầu tiên. Hãy làm nó thật sạch sẽ!

Bạn có muốn mình thêm vào phần nào chi tiết hơn (như hướng dẫn đóng gói Docker chẳng hạn) không?